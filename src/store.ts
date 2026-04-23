import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Account, FamilyGroup, Goal, SettlementDecision, Transaction, User } from './types';
import { buildSeed } from './seed';
import { uid } from './utils/id';
import { monthOf, currentMonth } from './utils/format';
import { sumSpentInMonth } from './utils/selectors';

type State = {
  currentUserId: string | null;
  users: User[];
  familyGroups: FamilyGroup[];
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
  initialized: boolean;
};

type Actions = {
  setCurrentUser: (id: string | null) => void;
  addAccount: (input: Omit<Account, 'id' | 'createdAt'>) => Account;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  reorderAccounts: (orderedIds: string[]) => void;
  addCategory: (accountId: string, name: string) => void;
  renameCategory: (accountId: string, oldName: string, newName: string) => void;
  deleteCategory: (accountId: string, name: string) => void;
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
  initialized: false,
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyState,

      setCurrentUser: (id) => set({ currentUserId: id }),

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
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

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
    },
  ),
);

// 초기화: 첫 로드시 시드 자동 주입
export function initStoreIfEmpty() {
  const s = useStore.getState();
  if (!s.initialized || s.users.length === 0) {
    s.loadSeed();
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
  const initialAllocated = Object.values(allocs).reduce((s, v) => s + v, 0);
  const spent = sumSpentInMonth(accountId, month, undefined, transactions);
  const monthTxs = transactions.filter(
    (t) => t.accountId === accountId && t.date.startsWith(month) && t.amount > 0,
  );
  const supplemented = monthTxs
    .filter((t) => t.isSupplement)
    .reduce((s, t) => s + t.amount, 0);
  const regularInflow = monthTxs
    .filter((t) => !t.isSupplement)
    .reduce((s, t) => s + t.amount, 0);
  const allocated = initialAllocated + supplemented;
  return {
    initialAllocated,
    supplemented,
    regularInflow,
    allocated,
    spent,
    remaining: allocated - spent,
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
