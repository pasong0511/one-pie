import { Account, Goal, GoalStatus, Transaction, User } from '../types';
import { currentMonth, monthOf, addMonths, monthDiff } from './format';

export function balanceOf(accountId: string, transactions: Transaction[], initial = 0): number {
  return transactions
    .filter((t) => t.accountId === accountId)
    .reduce((sum, t) => sum + t.amount, initial);
}

export function canView(userId: string, account: Account): boolean {
  if (account.ownerId === userId) return true;
  if (account.sharing === 'private') return false;
  return account.sharedWith.includes(userId);
}

export function canWrite(userId: string, account: Account): boolean {
  if (account.ownerId === userId) return true;
  if (account.sharing !== 'shared-rw') return false;
  return account.sharedWith.includes(userId);
}

export function canEditTransaction(
  userId: string,
  account: Account,
  transaction: Transaction,
): boolean {
  if (transaction.authorId === userId) return true;
  if (account.editPolicy === 'author-only') return false;
  return canWrite(userId, account);
}

export function canDeleteTransaction(userId: string, transaction: Transaction): boolean {
  return transaction.authorId === userId;
}

export function visibleAccounts(userId: string, accounts: Account[]): Account[] {
  return accounts.filter((a) => canView(userId, a));
}

export function visibleGoals(userId: string, goals: Goal[], users: User[]): Goal[] {
  const me = users.find((u) => u.id === userId);
  return goals.filter((g) => {
    if (g.ownerType === 'user') return g.ownerId === userId;
    if (g.ownerType === 'family') return !!me?.familyGroupId && me.familyGroupId === g.ownerId;
    return false;
  });
}

// 지출 합계 — 이체(transfer)는 잔액 이동일 뿐 실제 소비가 아니므로 제외.
export function sumSpentInMonth(
  accountId: string,
  month: string,
  category: string | undefined,
  transactions: Transaction[],
): number {
  return transactions
    .filter((t) => t.accountId === accountId && monthOf(t.date) === month)
    .filter((t) => (category ? t.category === category : true))
    .filter((t) => t.amount < 0 && t.kind !== 'transfer')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

// 수입 합계 — 이체 + 정산 입금(자동 생성) 제외.
// 정산 입금은 본인이 선결재한 돈을 돌려받는 것이므로 수입 통계에 잡으면 부풀려짐.
export function sumInflowInMonth(
  accountId: string,
  month: string,
  category: string | undefined,
  transactions: Transaction[],
): number {
  return transactions
    .filter((t) => t.accountId === accountId && monthOf(t.date) === month)
    .filter((t) => (category ? t.category === category : true))
    .filter((t) => t.amount > 0 && t.kind !== 'transfer' && !t.splitBillId)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function goalProgress(
  goal: Goal,
  accounts: Account[],
  transactions: Transaction[],
): {
  mode: '누적형' | '차감형';
  status: GoalStatus;
  startAmount: number;
  current: number;
  target: number;
  ratio: number;            // 0~1 (도달도)
  monthlyAvg: number;       // 최근 순증 (+)/순감 (-) 평균
  estimatedMonth: string | null;
  delayMonths: number | null;
  reached: boolean;
  onTrack: boolean;
} {
  const mode: '누적형' | '차감형' = goal.mode ?? '누적형';
  const status: GoalStatus = goal.status ?? '진행중';
  const startAmount = goal.startAmount ?? 0;
  const linked = accounts.filter((a) => goal.linkedAccountIds.includes(a.id));
  const current = linked.reduce(
    (sum, a) => sum + balanceOf(a.id, transactions, a.initialBalance ?? 0),
    0,
  );
  const target = goal.targetAmount;
  const range = target - startAmount;
  const rawRatio = range !== 0 ? (current - startAmount) / range : 0;
  const ratio = Math.max(0, Math.min(1, rawRatio));

  // 최근 3개월 순증/순감 평균 (linked 계좌들의 월별 합)
  const now = currentMonth();
  const monthsToCheck = [addMonths(now, -2), addMonths(now, -1), now];
  const perMonth = monthsToCheck.map((m) =>
    linked.reduce((sum, a) => {
      const all = transactions.filter((t) => t.accountId === a.id && monthOf(t.date) === m);
      return sum + all.reduce((s, t) => s + t.amount, 0);
    }, 0),
  );
  const nonZero = perMonth.filter((v) => v !== 0);
  const monthlyAvg =
    nonZero.length > 0 ? perMonth.reduce((s, v) => s + v, 0) / nonZero.length : 0;

  // 달성 판정
  const reached =
    mode === '누적형' ? current >= target : current <= target;

  // 목표까지 남은 거리 (부호 있음)
  const distance = target - current;
  // 진행 방향과 속도 방향이 일치하면 on-track (distance 부호 == monthlyAvg 부호)
  const onTrack =
    reached ||
    (distance > 0 && monthlyAvg > 0) ||
    (distance < 0 && monthlyAvg < 0);

  let estimatedMonth: string | null = null;
  let delayMonths: number | null = null;
  if (reached) {
    estimatedMonth = now;
    delayMonths = monthDiff(goal.targetDate, now);
  } else if (onTrack && monthlyAvg !== 0) {
    const monthsNeeded = Math.ceil(distance / monthlyAvg);
    estimatedMonth = addMonths(now, monthsNeeded);
    delayMonths = monthDiff(goal.targetDate, estimatedMonth);
  }

  return {
    mode,
    status,
    startAmount,
    current,
    target,
    ratio,
    monthlyAvg,
    estimatedMonth,
    delayMonths,
    reached,
    onTrack,
  };
}
