import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Account,
  CategoryKind,
  DEFAULT_PREFERENCES,
  FamilyGroup,
  Goal,
  MainCategory,
  Preferences,
  RecurringRule,
  SettlementDecision,
  SplitBill,
  SplitDebtor,
  Transaction,
  User,
} from './types';
import { buildSeed } from './seed';
import { uid } from './utils/id';
import { monthOf, currentMonth, todayISO } from './utils/format';
import { sumSpentInMonth } from './utils/selectors';
import { InvitePayload } from './utils/invite';
import { formatLocalDate, occurrencesBetween, parseLocalDate } from './utils/recurring';
import { DEFAULT_CATEGORY_TAXONOMY } from './utils/categoryDefaults';

type State = {
  currentUserId: string | null;
  users: User[];
  familyGroups: FamilyGroup[];
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
  recurringRules: RecurringRule[];
  splitBills: SplitBill[];
  categoryTaxonomy: MainCategory[];
  preferences: Preferences;
  initialized: boolean;
};

type Actions = {
  setCurrentUser: (id: string | null) => void;
  signUp: (name: string, emoji?: string) => User;
  acceptInvite: (payload: InvitePayload, name: string, emoji?: string) => User;
  addAccount: (input: Omit<Account, 'id' | 'createdAt'>) => Account;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  reorderAccounts: (orderedIds: string[]) => void;
  addCategory: (accountId: string, name: string) => void;
  renameCategory: (accountId: string, oldName: string, newName: string) => void;
  deleteCategory: (accountId: string, name: string) => void;
  // 전역 카테고리 택소노미
  addMainCategory: (kind: CategoryKind, emoji: string, label: string) => MainCategory;
  updateMainCategory: (id: string, patch: Partial<Pick<MainCategory, 'emoji' | 'label'>>) => void;
  removeMainCategory: (id: string) => void;
  reorderMainCategories: (kind: CategoryKind, orderedIds: string[]) => void;
  addSubCategory: (mainId: string, label: string) => void;
  updateSubCategory: (mainId: string, subId: string, label: string) => void;
  removeSubCategory: (mainId: string, subId: string) => void;
  resetCategoryTaxonomy: () => void;
  // 사용자 환경설정 (필드 필수 여부, 미분류 라벨 등)
  updatePreferences: (patch: Partial<Preferences>) => void;
  resetPreferences: () => void;
  addTransaction: (input: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addGoal: (input: Omit<Goal, 'id'>) => Goal;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  setAllocation: (accountId: string, month: string, category: string, amount: number) => void;
  settle: (
    accountId: string,
    month: string,
    decisions: Record<string, SettlementDecision>,
  ) => void;
  addRecurringRule: (
    input: Omit<RecurringRule, 'id' | 'createdAt' | 'lastRunDate'>,
  ) => RecurringRule;
  updateRecurringRule: (id: string, patch: Partial<RecurringRule>) => void;
  deleteRecurringRule: (id: string, removeGenerated: boolean) => void;
  materializeRecurringRules: () => number;
  // 정산 (SplitBill)
  addSplitBill: (
    input: Omit<SplitBill, 'id' | 'inflowTxId' | 'outflowTxId'>,
  ) => SplitBill;
  updateSplitBill: (id: string, patch: Partial<Omit<SplitBill, 'id'>>) => void;
  deleteSplitBill: (id: string) => void;
  // 상태 전이 — settled 외 (draft/requested/seen/cancelled/rejected).
  setSplitBillStatus: (
    id: string,
    status: 'draft' | 'requested' | 'seen' | 'cancelled' | 'rejected',
    options?: { reason?: string },
  ) => void;
  // settled 처리 — 자동 거래 생성 포함.
  // 가족: outflowAccountId 필수, inflowAccountId 자동(원본 거래 계좌)
  // 외부/미분류: inflowAccountId 필수 (autoCreateInflowTx=true 일 때만 자동 거래 생성)
  settleSplitBill: (
    id: string,
    params: { outflowAccountId?: string; inflowAccountId?: string; date?: string },
  ) => void;
  resetAll: () => void;
  loadSeed: () => void;
};

export type Store = State & Actions;

const emptyState: State = {
  currentUserId: null,
  users: [],
  familyGroups: [],
  accounts: [],
  goals: [],
  transactions: [],
  recurringRules: [],
  splitBills: [],
  categoryTaxonomy: DEFAULT_CATEGORY_TAXONOMY,
  preferences: DEFAULT_PREFERENCES,
  initialized: false,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyState,

      setCurrentUser: (id) => set({ currentUserId: id }),

      signUp: (name, emoji) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error('이름을 입력해주세요');
        const userId = uid('u');
        const fgId = uid('fg');
        const user: User = {
          id: userId,
          name: trimmed,
          emoji: emoji || '👤',
          familyGroupId: fgId,
        };
        const group: FamilyGroup = {
          id: fgId,
          name: trimmed,
          memberIds: [userId],
        };
        set((s) => ({
          users: [...s.users, user],
          familyGroups: [...s.familyGroups, group],
          currentUserId: userId,
          initialized: true,
        }));
        return user;
      },

      acceptInvite: (payload, name, emoji) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error('이름을 입력해주세요');
        const state = get();
        const userId = uid('u');
        const newUser: User = {
          id: userId,
          name: trimmed,
          emoji: emoji || '👤',
          familyGroupId: payload.familyGroupId,
        };

        // inviter stub 처리: 로컬에 없으면 새로 추가
        const users = [...state.users];
        const inviterExists = users.some((u) => u.id === payload.inviter.id);
        if (!inviterExists) {
          users.push({
            id: payload.inviter.id,
            name: payload.inviter.name,
            emoji: payload.inviter.emoji || '👤',
            familyGroupId: payload.familyGroupId,
          });
        }
        users.push(newUser);

        // 가족 그룹 처리: 없으면 생성, 있으면 멤버 추가
        const groups = [...state.familyGroups];
        const gi = groups.findIndex((g) => g.id === payload.familyGroupId);
        if (gi === -1) {
          const memberIds = [payload.inviter.id, userId].filter(
            (id, idx, arr) => arr.indexOf(id) === idx,
          );
          groups.push({
            id: payload.familyGroupId,
            name: payload.familyGroupName,
            memberIds,
          });
        } else {
          const g = groups[gi];
          const memberIds = [...g.memberIds];
          if (!inviterExists && !memberIds.includes(payload.inviter.id)) {
            memberIds.push(payload.inviter.id);
          }
          if (!memberIds.includes(userId)) memberIds.push(userId);
          groups[gi] = { ...g, memberIds };
        }

        set({
          users,
          familyGroups: groups,
          currentUserId: userId,
          initialized: true,
        });
        return newUser;
      },

      addAccount: (input) => {
        const account: Account = {
          ...input,
          id: uid('a'),
          createdAt: new Date().toISOString().slice(0, 10),
        };
        set((s) => ({ accounts: [...s.accounts, account] }));
        return account;
      },

      updateAccount: (id, patch) =>
        set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),

      deleteAccount: (id) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.id !== id),
          transactions: s.transactions.filter((t) => t.accountId !== id),
          goals: s.goals.map((g) => ({
            ...g,
            linkedAccountIds: g.linkedAccountIds.filter((x) => x !== id),
          })),
        })),

      reorderAccounts: (orderedIds) =>
        set((s) => {
          // orderedIds는 subset의 새 순서. 원본 accounts에서 해당 id 슬롯에 순서대로 배치.
          const targetSet = new Set(orderedIds);
          const queue = [...orderedIds];
          const byId = new Map(s.accounts.map((a) => [a.id, a]));
          const next = s.accounts.map((a) => {
            if (!targetSet.has(a.id)) return a;
            const nextId = queue.shift()!;
            return byId.get(nextId)!;
          });
          return { accounts: next };
        }),

      addCategory: (accountId, name) =>
        set((s) => {
          const trimmed = name.trim();
          if (!trimmed) return s;
          return {
            accounts: s.accounts.map((a) => {
              if (a.id !== accountId) return a;
              if (a.categories.includes(trimmed)) return a;
              return { ...a, categories: [...a.categories, trimmed] };
            }),
          };
        }),

      renameCategory: (accountId, oldName, newName) =>
        set((s) => {
          const trimmed = newName.trim();
          if (!trimmed || trimmed === oldName) return s;
          return {
            accounts: s.accounts.map((a) => {
              if (a.id !== accountId) return a;
              if (!a.categories.includes(oldName)) return a;
              if (a.categories.includes(trimmed)) return a; // 충돌 방지
              const categories = a.categories.map((c) => (c === oldName ? trimmed : c));
              const budgetAllocations: typeof a.budgetAllocations = {};
              for (const [m, entries] of Object.entries(a.budgetAllocations)) {
                const updated: Record<string, number> = {};
                for (const [cat, amt] of Object.entries(entries)) {
                  updated[cat === oldName ? trimmed : cat] = amt;
                }
                budgetAllocations[m] = updated;
              }
              return { ...a, categories, budgetAllocations };
            }),
            transactions: s.transactions.map((t) =>
              t.accountId === accountId && t.category === oldName
                ? { ...t, category: trimmed }
                : t,
            ),
          };
        }),

      deleteCategory: (accountId, name) =>
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== accountId) return a;
            const categories = a.categories.filter((c) => c !== name);
            const budgetAllocations: typeof a.budgetAllocations = {};
            for (const [m, entries] of Object.entries(a.budgetAllocations)) {
              const updated: Record<string, number> = {};
              for (const [cat, amt] of Object.entries(entries)) {
                if (cat !== name) updated[cat] = amt;
              }
              budgetAllocations[m] = updated;
            }
            return { ...a, categories, budgetAllocations };
          }),
          transactions: s.transactions.map((t) =>
            t.accountId === accountId && t.category === name
              ? { ...t, category: undefined }
              : t,
          ),
        })),

      addMainCategory: (kind, emoji, label) => {
        const main: MainCategory = {
          id: uid('mcat'),
          kind,
          emoji: emoji || '📦',
          label: label.trim(),
          subs: [],
        };
        set((s) => ({ categoryTaxonomy: [...s.categoryTaxonomy, main] }));
        return main;
      },

      updateMainCategory: (id, patch) =>
        set((s) => ({
          categoryTaxonomy: s.categoryTaxonomy.map((m) =>
            m.id === id
              ? {
                  ...m,
                  ...(patch.emoji !== undefined ? { emoji: patch.emoji } : {}),
                  ...(patch.label !== undefined ? { label: patch.label.trim() } : {}),
                }
              : m,
          ),
        })),

      removeMainCategory: (id) =>
        set((s) => ({
          categoryTaxonomy: s.categoryTaxonomy.filter((m) => m.id !== id),
        })),

      reorderMainCategories: (kind, orderedIds) =>
        set((s) => {
          const sameKind = orderedIds
            .map((id) => s.categoryTaxonomy.find((m) => m.id === id && m.kind === kind))
            .filter((m): m is MainCategory => !!m);
          const others = s.categoryTaxonomy.filter(
            (m) => m.kind !== kind || !orderedIds.includes(m.id),
          );
          return { categoryTaxonomy: [...others, ...sameKind] };
        }),

      addSubCategory: (mainId, label) =>
        set((s) => ({
          categoryTaxonomy: s.categoryTaxonomy.map((m) =>
            m.id === mainId
              ? {
                  ...m,
                  subs: [...m.subs, { id: uid('scat'), label: label.trim() }],
                }
              : m,
          ),
        })),

      updateSubCategory: (mainId, subId, label) =>
        set((s) => ({
          categoryTaxonomy: s.categoryTaxonomy.map((m) =>
            m.id === mainId
              ? {
                  ...m,
                  subs: m.subs.map((sc) =>
                    sc.id === subId ? { ...sc, label: label.trim() } : sc,
                  ),
                }
              : m,
          ),
        })),

      removeSubCategory: (mainId, subId) =>
        set((s) => ({
          categoryTaxonomy: s.categoryTaxonomy.map((m) =>
            m.id === mainId ? { ...m, subs: m.subs.filter((sc) => sc.id !== subId) } : m,
          ),
        })),

      resetCategoryTaxonomy: () => set({ categoryTaxonomy: DEFAULT_CATEGORY_TAXONOMY }),

      updatePreferences: (patch) =>
        set((s) => ({
          preferences: {
            ...s.preferences,
            ...patch,
            txRequired: {
              ...s.preferences.txRequired,
              ...(patch.txRequired ?? {}),
            },
            homeSections: {
              ...s.preferences.homeSections,
              ...(patch.homeSections ?? {}),
            },
            accountsSections: {
              ...s.preferences.accountsSections,
              ...(patch.accountsSections ?? {}),
            },
            calendarSections: {
              ...s.preferences.calendarSections,
              ...(patch.calendarSections ?? {}),
            },
            statsSections: {
              ...s.preferences.statsSections,
              ...(patch.statsSections ?? {}),
            },
          },
        })),

      resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES }),

      addTransaction: (input) => {
        const tx: Transaction = { ...input, id: uid('t') };
        set((s) => ({ transactions: [...s.transactions, tx] }));
        return tx;
      },

      updateTransaction: (id, patch) =>
        set((s) => ({
          transactions: s.transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),

      deleteTransaction: (id) =>
        set((s) => {
          const target = s.transactions.find((t) => t.id === id);
          // 1) 단순 삭제
          let nextTxs = s.transactions.filter((t) => t.id !== id);
          let nextBills = s.splitBills;

          if (target) {
            // 2-A) 자동 생성된 정산 거래(inflow/outflow) 삭제 → bill 을 seen 으로 되돌리고 링크 해제
            if (target.splitBillId && target.splitRole) {
              const billId = target.splitBillId;
              nextBills = nextBills.map((b) => {
                if (b.id !== billId) return b;
                // 짝 거래도 함께 삭제 (가족 케이스의 transfer 쌍)
                const pairIds = [b.inflowTxId, b.outflowTxId].filter(
                  (x): x is string => !!x && x !== id,
                );
                if (pairIds.length > 0) {
                  nextTxs = nextTxs.filter((t) => !pairIds.includes(t.id));
                }
                return {
                  ...b,
                  status: 'seen',
                  inflowTxId: undefined,
                  outflowTxId: undefined,
                  outflowAccountId: undefined,
                  // 외부 케이스의 inflowAccountId 는 사용자가 고른 값이라 유지.
                  // 가족 케이스는 자동 결정이므로 유지해도 무해.
                };
              });
            } else {
              // 2-B) 원본 거래 삭제 → 그 거래에 묶인 정산서 함께 삭제 (1:1).
              nextBills = nextBills.filter((b) => b.txId !== id);
            }
          }

          return { transactions: nextTxs, splitBills: nextBills };
        }),

      addGoal: (input) => {
        const goal: Goal = { ...input, id: uid('goal') };
        set((s) => ({ goals: [...s.goals, goal] }));
        return goal;
      },

      updateGoal: (id, patch) =>
        set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) })),

      deleteGoal: (id) =>
        set((s) => ({
          goals: s.goals.filter((g) => g.id !== id),
          accounts: s.accounts.map((a) =>
            a.goalId === id ? { ...a, goalId: undefined } : a,
          ),
        })),

      setAllocation: (accountId, month, category, amount) =>
        set((s) => ({
          accounts: s.accounts.map((a) => {
            if (a.id !== accountId) return a;
            const monthAllocs = { ...(a.budgetAllocations[month] ?? {}) };
            monthAllocs[category] = amount;
            return {
              ...a,
              budgetAllocations: { ...a.budgetAllocations, [month]: monthAllocs },
            };
          }),
        })),

      settle: (accountId, month, decisions) => {
        const state = get();
        const account = state.accounts.find((a) => a.id === accountId);
        if (!account) return;
        const allocs = account.budgetAllocations[month] ?? {};
        let totalReturnToAccount = 0;
        const newAllocs = { ...allocs };
        const moves: Array<{ from: string; to: string; amount: number }> = [];

        for (const [category, decision] of Object.entries(decisions)) {
          const allocated = allocs[category] ?? 0;
          const spent = sumSpentInMonth(accountId, month, category, state.transactions);
          const remaining = allocated - spent;
          if (remaining <= 0) continue;
          if (decision.type === 'keep') continue;
          if (decision.type === 'move') {
            newAllocs[category] = spent;
            newAllocs[decision.toCategory] =
              (newAllocs[decision.toCategory] ?? allocs[decision.toCategory] ?? 0) + remaining;
            moves.push({ from: category, to: decision.toCategory, amount: remaining });
          }
          if (decision.type === 'return') {
            newAllocs[category] = spent;
            totalReturnToAccount += remaining;
          }
        }

        // 반환 처리: 차감형에서 "계좌 잔액으로 반환" 의미는, 해당 카테고리 배정을 "사용된 만큼만"으로 조정
        // 별도 트랜잭션은 만들지 않고, 배정 자체를 줄여 계좌 잔액 개념을 보존
        void totalReturnToAccount;
        void moves;

        set((s) => ({
          accounts: s.accounts.map((a) =>
            a.id === accountId
              ? {
                  ...a,
                  budgetAllocations: { ...a.budgetAllocations, [month]: newAllocs },
                }
              : a,
          ),
        }));
      },

      addRecurringRule: (input) => {
        const rule: RecurringRule = {
          ...input,
          id: uid('rr'),
          createdAt: todayISO(),
        };
        set((s) => ({ recurringRules: [...s.recurringRules, rule] }));
        return rule;
      },

      updateRecurringRule: (id, patch) =>
        set((s) => ({
          recurringRules: s.recurringRules.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),

      deleteRecurringRule: (id, removeGenerated) =>
        set((s) => ({
          recurringRules: s.recurringRules.filter((r) => r.id !== id),
          transactions: removeGenerated
            ? s.transactions.filter((t) => t.sourceRuleId !== id)
            : s.transactions,
        })),

      materializeRecurringRules: () => {
        const state = get();
        const today = parseLocalDate(todayISO());
        const newTxs: Transaction[] = [];
        const updatedRules: RecurringRule[] = [];

        for (const rule of state.recurringRules) {
          if (!rule.enabled) continue;
          const endCap = rule.endDate ? parseLocalDate(rule.endDate) : today;
          const until = endCap < today ? endCap : today;
          const afterDate = rule.lastRunDate ?? undefined;
          const occs = occurrencesBetween(rule.startDate, rule.interval, until, afterDate);
          if (occs.length === 0) continue;

          const signed = rule.kind === 'expense' ? -Math.abs(rule.amount) : Math.abs(rule.amount);
          const isSupp =
            rule.kind === 'deposit' && rule.isSupplement ? true : undefined;
          for (const d of occs) {
            newTxs.push({
              id: uid('t'),
              accountId: rule.accountId,
              authorId: rule.ownerId,
              date: formatLocalDate(d),
              amount: signed,
              category: rule.category,
              source: rule.source,
              memo: rule.memo,
              autoGenerated: true,
              sourceRuleId: rule.id,
              isSupplement: isSupp,
            });
          }
          updatedRules.push({
            ...rule,
            lastRunDate: formatLocalDate(occs[occs.length - 1]),
          });
        }

        if (newTxs.length === 0) return 0;

        const updatedIds = new Set(updatedRules.map((r) => r.id));
        set((s) => ({
          transactions: [...s.transactions, ...newTxs],
          recurringRules: s.recurringRules.map((r) =>
            updatedIds.has(r.id) ? updatedRules.find((u) => u.id === r.id)! : r,
          ),
        }));
        return newTxs.length;
      },

      addSplitBill: (input) => {
        const bill: SplitBill = { ...input, id: uid('sb') };
        set((s) => ({ splitBills: [...s.splitBills, bill] }));
        return bill;
      },

      updateSplitBill: (id, patch) =>
        set((s) => ({
          splitBills: s.splitBills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),

      deleteSplitBill: (id) =>
        set((s) => {
          const bill = s.splitBills.find((b) => b.id === id);
          if (!bill) return s;
          // settled 상태면 자동 생성된 거래도 함께 삭제 (사용자가 명시적으로 정산서 자체를 폐기하는 경우)
          const removeIds = new Set(
            [bill.inflowTxId, bill.outflowTxId].filter((x): x is string => !!x),
          );
          return {
            splitBills: s.splitBills.filter((b) => b.id !== id),
            transactions:
              removeIds.size > 0
                ? s.transactions.filter((t) => !removeIds.has(t.id))
                : s.transactions,
          };
        }),

      setSplitBillStatus: (id, status, options) =>
        set((s) => ({
          splitBills: s.splitBills.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status,
                  cancelledReason:
                    status === 'cancelled' ? options?.reason ?? b.cancelledReason : undefined,
                  rejectedReason:
                    status === 'rejected' ? options?.reason ?? b.rejectedReason : undefined,
                }
              : b,
          ),
        })),

      settleSplitBill: (id, params) => {
        const state = get();
        const bill = state.splitBills.find((b) => b.id === id);
        if (!bill) return;
        if (bill.status === 'settled') return;

        const date = params.date ?? todayISO();
        const amount = Math.abs(bill.amount);
        const author = state.users.find((u) => u.id === bill.authorId);
        const debtorLabel = describeDebtorLocal(bill.debtor, state.users);
        const memo = bill.memo
          ? `정산: ${bill.memo}`
          : `정산: ${debtorLabel} → ${author?.name ?? ''}`.trim();

        const newTxs: Transaction[] = [];
        let inflowTxId: string | undefined;
        let outflowTxId: string | undefined;
        let inflowAccountId = params.inflowAccountId;
        let outflowAccountId = params.outflowAccountId;

        if (bill.debtor.kind === 'user') {
          // 가족 케이스 — transfer 쌍 자동 생성
          if (!outflowAccountId) {
            console.warn('settleSplitBill (user): outflowAccountId required');
            return;
          }
          // 받는 쪽 계좌: 원본 거래의 계좌
          if (!inflowAccountId) {
            const originTx = state.transactions.find((t) => t.id === bill.txId);
            inflowAccountId = originTx?.accountId;
          }
          if (!inflowAccountId) {
            console.warn('settleSplitBill (user): inflowAccountId could not be resolved');
            return;
          }

          const outId = uid('t');
          const inId = uid('t');
          outflowTxId = outId;
          inflowTxId = inId;

          newTxs.push({
            id: outId,
            accountId: outflowAccountId,
            authorId: bill.debtor.userId,
            date,
            amount: -amount,
            kind: 'transfer',
            memo,
            splitBillId: bill.id,
            splitRole: 'outflow',
          });
          newTxs.push({
            id: inId,
            accountId: inflowAccountId,
            authorId: bill.authorId,
            date,
            amount: amount,
            kind: 'transfer',
            memo,
            splitBillId: bill.id,
            splitRole: 'inflow',
          });
        } else {
          // 외부 / 미분류 — autoCreateInflowTx=true 일 때만 본인 계좌에 deposit 생성
          if (bill.autoCreateInflowTx) {
            if (!inflowAccountId) {
              const originTx = state.transactions.find((t) => t.id === bill.txId);
              inflowAccountId = originTx?.accountId;
            }
            if (!inflowAccountId) {
              console.warn('settleSplitBill (external): inflowAccountId required');
              return;
            }
            const inId = uid('t');
            inflowTxId = inId;
            newTxs.push({
              id: inId,
              accountId: inflowAccountId,
              authorId: bill.authorId,
              date,
              amount: amount,
              kind: 'deposit',
              memo,
              splitBillId: bill.id,
              splitRole: 'inflow',
            });
          }
        }

        set((s) => ({
          transactions: [...s.transactions, ...newTxs],
          splitBills: s.splitBills.map((b) =>
            b.id === id
              ? {
                  ...b,
                  status: 'settled',
                  outflowAccountId,
                  inflowAccountId,
                  inflowTxId,
                  outflowTxId,
                }
              : b,
          ),
        }));
      },

      resetAll: () => set({ ...emptyState, initialized: true }),

      loadSeed: () => {
        const seed = buildSeed();
        set({
          ...emptyState,
          ...seed,
          initialized: true,
        });
      },
    }),
    {
      name: 'one-pie-store-v1',
      // 기존 persist 데이터에 신규 필드(taxonomy, preferences 등)가 없으면 기본값 주입.
      // 또한 자동으로 박혔던 옛 기본 프리퍼런스({amount: true})도 현재 기본으로 리셋.
      merge: (persistedState, currentState) => {
        const persisted = (persistedState ?? {}) as Partial<State>;
        const merged: Store = { ...currentState, ...persisted } as Store;
        if (!merged.categoryTaxonomy || merged.categoryTaxonomy.length === 0) {
          merged.categoryTaxonomy = DEFAULT_CATEGORY_TAXONOMY;
        }
        if (!merged.preferences) {
          merged.preferences = DEFAULT_PREFERENCES;
        } else {
          const tr = merged.preferences.txRequired;
          if (
            tr &&
            Object.keys(tr).length === 1 &&
            tr.amount === true
          ) {
            // 사용자가 손대지 않은 옛 자동 기본값. 현재 기본으로 리셋.
            merged.preferences = {
              ...merged.preferences,
              txRequired: {},
            };
          }
          // 옛 persist 데이터에 신규 필드(*Sections 등)가 누락됐을 수 있음 → 기본값 주입.
          merged.preferences = {
            ...DEFAULT_PREFERENCES,
            ...merged.preferences,
          };
        }
        // 옛 splitShares / splitSettled / splitWith → SplitBill[] 마이그레이션.
        // - 1 tx 의 N명 share → N개의 SplitBill (각 1명 debtor, status=requested 또는 settled)
        // - 옛 splitWith(균등) 도 같은 방식으로 흡수
        // - persist 데이터에 splitBills 가 없으면 빈 배열로 보장.
        if (!Array.isArray(merged.splitBills)) merged.splitBills = [];
        if (Array.isArray(merged.transactions)) {
          type LegacyTx = Transaction & {
            splitShares?: { userId: string; amount: number }[];
            splitSettled?: boolean;
            splitWith?: string[];
          };
          const newBills: SplitBill[] = [];
          merged.transactions = merged.transactions.map((tRaw) => {
            const t = tRaw as LegacyTx;
            const legacyWith = t.splitWith;
            const legacyShares =
              t.splitShares ??
              (legacyWith && legacyWith.length > 0
                ? legacyWith.map((uid2) => ({
                    userId: uid2,
                    amount: Math.round(Math.abs(t.amount) / (legacyWith.length + 1)),
                  }))
                : undefined);
            if (legacyShares && legacyShares.length > 0) {
              const status: SplitBill['status'] = t.splitSettled ? 'settled' : 'requested';
              for (const sh of legacyShares) {
                newBills.push({
                  id: uid('sb'),
                  authorId: t.authorId,
                  debtor: { kind: 'user', userId: sh.userId },
                  txId: t.id,
                  amount: sh.amount,
                  status,
                });
              }
              const cleaned = { ...t };
              delete cleaned.splitShares;
              delete cleaned.splitSettled;
              delete cleaned.splitWith;
              return cleaned as Transaction;
            }
            return tRaw as Transaction;
          });
          if (newBills.length > 0) {
            merged.splitBills = [...merged.splitBills, ...newBills];
          }
        }
        return merged;
      },
    },
  ),
);

// 초기화: 첫 로드시 initialized 플래그만 세팅 (빈 상태로 시작 — 가입/초대 수락 유도)
// 시드 데이터는 Login 화면의 "샘플 데이터 로드" 버튼으로 명시적으로만 주입.
export function initStoreIfEmpty() {
  const s = useStore.getState();
  if (!s.initialized) {
    useStore.setState({ initialized: true });
  }
}

// 차감형 계좌의 "초기배정 + 추경 - 지출" = 남은 예산
// initialAllocated: 카테고리별 배정 합 (월초 계획)
// supplemented: 이번 달 isSupplement=true 거래 합 (명시적 추경)
// regularInflow: 이번 달 일반 입금 합 (예산에 미반영, 기록만)
// allocated = initialAllocated + supplemented (총 예산)
// remaining = allocated - spent
export function remainingBudget(
  accountId: string,
  month: string,
  accounts: Account[],
  transactions: Transaction[],
): {
  initialAllocated: number;
  supplemented: number;
  regularInflow: number;
  allocated: number;
  spent: number;
  remaining: number;
} {
  const account = accounts.find((a) => a.id === accountId);
  if (!account)
    return {
      initialAllocated: 0,
      supplemented: 0,
      regularInflow: 0,
      allocated: 0,
      spent: 0,
      remaining: 0,
    };
  const allocs = account.budgetAllocations[month] ?? {};
  const categorySum = Object.values(allocs).reduce((s, v) => s + v, 0);
  const monthlyTotal = account.monthlyBudget?.[month];
  // 총 예산이 명시되어 있으면 그 값을, 없으면 카테고리 합을 초기배정으로 사용
  const initialAllocated =
    monthlyTotal !== undefined ? Math.max(monthlyTotal, categorySum) : categorySum;
  const spent = sumSpentInMonth(accountId, month, undefined, transactions);
  // 이 달 양수 거래 — 정산 자동 입금은 분리 (일반 입금/추경에 섞이면 안 됨)
  const monthTxs = transactions.filter(
    (t) =>
      t.accountId === accountId &&
      t.date.startsWith(month) &&
      t.amount > 0 &&
      !t.splitBillId,
  );
  const supplemented = monthTxs
    .filter((t) => t.isSupplement)
    .reduce((s, t) => s + t.amount, 0);
  const regularInflow = monthTxs
    .filter((t) => !t.isSupplement)
    .reduce((s, t) => s + t.amount, 0);

  // 정산 자동 거래는 잔액엔 반영해야 함 (실제 돈 이동) 하지만 통계엔 빠져야 함.
  // sumSpentInMonth 가 transfer 를 제외하므로 spent 에 안 잡혀서 별도 보정.
  const settlementTxs = transactions.filter(
    (t) =>
      t.accountId === accountId && t.date.startsWith(month) && t.splitBillId,
  );
  const settlementInflow = settlementTxs
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const settlementOutflow = settlementTxs
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);

  const allocated = initialAllocated + supplemented;
  // 차감형 남음: (예산 - 사용) - 정산 출금 + 정산 입금 (예산 회복 효과)
  const remaining = allocated - spent - settlementOutflow + settlementInflow;
  return {
    initialAllocated,
    supplemented,
    regularInflow,
    allocated,
    spent,
    remaining,
  };
}

// 누적형 계좌의 잔액 (initial + 모든 tx)
export function cumulativeBalance(
  accountId: string,
  accounts: Account[],
  transactions: Transaction[],
): number {
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  const initial = account.initialBalance ?? 0;
  const txSum = transactions
    .filter((t) => t.accountId === accountId)
    .reduce((s, t) => s + t.amount, 0);
  return initial + txSum;
}

// 계좌 잔액: mode에 따라 해석이 다름. 단일 숫자가 필요할 때 사용
export function accountBalance(
  accountId: string,
  accounts: Account[],
  transactions: Transaction[],
  month = currentMonth(),
): number {
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return 0;
  if (account.mode === '누적형') {
    return cumulativeBalance(accountId, accounts, transactions);
  }
  // 차감형: 이번달 배정 - 이번달 사용
  return remainingBudget(accountId, month, accounts, transactions).remaining;
}

void monthOf;

// describeDebtor 의 store 내부 사본 — 외부 import 순환 방지용.
function describeDebtorLocal(debtor: SplitDebtor, users: User[]): string {
  if (debtor.kind === 'user') {
    return users.find((u) => u.id === debtor.userId)?.name ?? '가족 멤버';
  }
  if (debtor.kind === 'external') return debtor.name;
  return debtor.label?.trim() || '미분류';
}
