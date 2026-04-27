import { create } from 'zustand';
import { useStore } from '../store';
import {
  canDeleteTransaction,
  canEditTransaction,
  canView,
  canWrite,
} from '../utils/selectors';
import { Account, Transaction } from '../types';

// ──────────────────────────────────────────────────────────────────────────
// PageRuntime: 새로고침 전까지만 살아있는 세션 컨텍스트.
// localStorage에 저장하지 않음. 라우팅/도메인 컨텍스트를 캐시해서
// 컴포넌트가 props drilling 없이 구독.
// ──────────────────────────────────────────────────────────────────────────
export type PageRuntime = {
  // 라우팅
  route: string;                          // 현재 pathname
  routeParams: Record<string, string>;    // /:id 같은 동적 파라미터

  // 도메인 컨텍스트 — URL이나 사용자 액션으로 세팅
  currentAccountId: string | null;
  currentGoalId: string | null;
  currentTxId: string | null;

  // 거래 페이지 다중 계좌 필터. 빈 배열 = 전체.
  // 새로고침 전까지 유지 (페이지 이동해도 살아있음).
  txFilterAccountIds: string[];

  // 액션
  setRoute: (route: string, params?: Record<string, string>) => void;
  setCurrentAccount: (id: string | null) => void;
  setCurrentGoal: (id: string | null) => void;
  setCurrentTx: (id: string | null) => void;
  setTxFilterAccountIds: (ids: string[]) => void;
  toggleTxFilterAccount: (id: string) => void;
  clearTxFilterAccounts: () => void;
};

export const usePageRuntime = create<PageRuntime>((set) => ({
  route: '/',
  routeParams: {},
  currentAccountId: null,
  currentGoalId: null,
  currentTxId: null,
  txFilterAccountIds: [],
  setRoute: (route, params = {}) => set({ route, routeParams: params }),
  setCurrentAccount: (id) => set({ currentAccountId: id }),
  setCurrentGoal: (id) => set({ currentGoalId: id }),
  setCurrentTx: (id) => set({ currentTxId: id }),
  setTxFilterAccountIds: (ids) => set({ txFilterAccountIds: ids }),
  toggleTxFilterAccount: (id) =>
    set((s) => {
      const has = s.txFilterAccountIds.includes(id);
      return {
        txFilterAccountIds: has
          ? s.txFilterAccountIds.filter((x) => x !== id)
          : [...s.txFilterAccountIds, id],
      };
    }),
  clearTxFilterAccounts: () => set({ txFilterAccountIds: [] }),
}));

// ──────────────────────────────────────────────────────────────────────────
// 라우트 메타 — 상단바 표시·스위처 노출 같은 분기를 한 곳에서 관리.
// App.tsx는 useRouteMeta()만 호출, 페이지별 분기를 컴포넌트로 흩지 않음.
// ──────────────────────────────────────────────────────────────────────────
export type RouteMeta = {
  title: string | null;       // 상단바 타이틀 (스위처가 안 보일 때만)
  showSwitcher: boolean;      // 좌측에 AccountSwitcher 노출
  showBack: boolean;          // 좌측에 뒤로가기(‹) 버튼 노출
  hideChrome: boolean;        // BottomNav / GlobalTxButton / 우측 알림·유저칩 숨김
};

export function useRouteMeta(): RouteMeta {
  const route = usePageRuntime((s) => s.route);
  return computeRouteMeta(route);
}

function computeRouteMeta(pathname: string): RouteMeta {
  if (pathname === '/tx/new') {
    return { title: '거래 추가', showSwitcher: false, showBack: true, hideChrome: true };
  }
  if (pathname.startsWith('/tx/')) {
    return { title: '거래 수정', showSwitcher: false, showBack: true, hideChrome: true };
  }
  if (pathname === '/settle') {
    return { title: '정산', showSwitcher: false, showBack: true, hideChrome: false };
  }
  if (pathname.startsWith('/settle/')) {
    return { title: '정산서', showSwitcher: false, showBack: true, hideChrome: false };
  }

  const showSwitcher =
    pathname === '/accounts' || pathname.startsWith('/account/');
  if (showSwitcher) {
    return { title: null, showSwitcher: true, showBack: false, hideChrome: false };
  }

  let title: string | null = null;
  if (pathname === '/') title = '홈';
  else if (pathname === '/calendar') title = '거래';
  else if (pathname === '/stats') title = '통계';
  else if (pathname.startsWith('/settings')) title = '설정';
  else if (pathname === '/what-if') title = '이 소비 괜찮을까';
  else if (pathname.startsWith('/goal/')) title = '목표';
  return { title, showSwitcher: false, showBack: false, hideChrome: false };
}

// ──────────────────────────────────────────────────────────────────────────
// 권한 캐시 — runtime의 currentXxxId + persistent store를 조합한 derived hook.
// 컴포넌트는 selectors 함수를 직접 호출하지 않고 hook으로 받음.
// ──────────────────────────────────────────────────────────────────────────
export type AccountPerms = {
  account: Account;
  canView: boolean;
  canWrite: boolean;
  isOwner: boolean;
  sharing: Account['sharing'];
  editPolicy: Account['editPolicy'];
};

export function useCurrentAccountPerms(): AccountPerms | null {
  const accountId = usePageRuntime((s) => s.currentAccountId);
  const userId = useStore((s) => s.currentUserId);
  const accounts = useStore((s) => s.accounts);

  if (!accountId || !userId) return null;
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return null;
  return {
    account,
    canView: canView(userId, account),
    canWrite: canWrite(userId, account),
    isOwner: account.ownerId === userId,
    sharing: account.sharing,
    editPolicy: account.editPolicy,
  };
}

// 임의의 계좌 id에 대한 권한 — 리스트 카드에서 한꺼번에 쓸 때 유용.
export function useAccountPerms(accountId: string | null | undefined): AccountPerms | null {
  const userId = useStore((s) => s.currentUserId);
  const accounts = useStore((s) => s.accounts);
  if (!accountId || !userId) return null;
  const account = accounts.find((a) => a.id === accountId);
  if (!account) return null;
  return {
    account,
    canView: canView(userId, account),
    canWrite: canWrite(userId, account),
    isOwner: account.ownerId === userId,
    sharing: account.sharing,
    editPolicy: account.editPolicy,
  };
}

export type TxPerms = {
  transaction: Transaction;
  canEdit: boolean;
  canDelete: boolean;
  isAuthor: boolean;
};

export function useCurrentTxPerms(): TxPerms | null {
  const txId = usePageRuntime((s) => s.currentTxId);
  const userId = useStore((s) => s.currentUserId);
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);

  if (!txId || !userId) return null;
  const tx = transactions.find((t) => t.id === txId);
  if (!tx) return null;
  const account = accounts.find((a) => a.id === tx.accountId);
  if (!account) return null;
  return {
    transaction: tx,
    canEdit: canEditTransaction(userId, account, tx),
    canDelete: canDeleteTransaction(userId, tx),
    isAuthor: tx.authorId === userId,
  };
}
