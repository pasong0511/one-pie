import { lazy, Suspense, useEffect, useMemo } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import GoalDetail from './pages/GoalDetail';
import WhatIf from './pages/WhatIf';
import Settings from './pages/Settings';
import SettingsAccounts from './pages/settings/Accounts';
import SettingsGoals from './pages/settings/Goals';
import SettingsRecurring from './pages/settings/Recurring';
import SettingsFamily from './pages/settings/Family';
import SettingsDeveloper from './pages/settings/Developer';
import SettingsCategories from './pages/settings/Categories';
import SettingsHome from './pages/settings/Home';
import SettingsAccountsView from './pages/settings/AccountsView';
import SettingsCalendarView from './pages/settings/CalendarView';
import SettingsStatsView from './pages/settings/StatsView';
import Calendar from './pages/Calendar';
import Transaction from './pages/Transaction';
import Settle from './pages/Settle';
import SettleDetail from './pages/SettleDetail';
import LowBalanceToast from './components/LowBalanceToast';
import GlobalTxButton from './components/GlobalTxButton';
import BottomNav from './components/BottomNav';
import AccountSwitcher from './components/AccountSwitcher';
import TxAccountFilter from './components/TxAccountFilter';
import { usePageRuntime, useRouteMeta } from './stores/runtime';

// Stats는 recharts를 쓰므로 lazy-load (초기 번들에서 제외 → 모바일 초기 로딩 빠르게)
const Stats = lazy(() => import('./pages/Stats'));

export default function App() {
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const splitBills = useStore((s) => s.splitBills);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const materializeRecurringRules = useStore((s) => s.materializeRecurringRules);
  const navigate = useNavigate();

  // 상단 정산 아이콘 배지 — 본인이 청구한/받을 입장인 미완료 정산서 합계.
  const pendingSettleCount = useMemo(() => {
    if (!currentUserId) return 0;
    let n = 0;
    for (const b of splitBills) {
      if (b.status === 'settled' || b.status === 'cancelled' || b.status === 'rejected') continue;
      if (b.authorId === currentUserId) n++;
      else if (b.debtor.kind === 'user' && b.debtor.userId === currentUserId) n++;
    }
    return n;
  }, [splitBills, currentUserId]);

  useEffect(() => {
    if (currentUserId) materializeRecurringRules();
  }, [currentUserId, materializeRecurringRules]);

  const currentUser = users.find((u) => u.id === currentUserId);
  const location = useLocation();
  const hasInvite = useMemo(
    () => new URLSearchParams(location.search).has('invite'),
    [location.search],
  );

  // URL → PageRuntime 동기화. 모든 컨텍스트(라우트, 현재 계좌/목표 id)는
  // 여기서 한 번에 채워서 다른 컴포넌트들이 useStore가 아닌 usePageRuntime 구독.
  const setRoute = usePageRuntime((s) => s.setRoute);
  const setCurrentAccount = usePageRuntime((s) => s.setCurrentAccount);
  const setCurrentGoal = usePageRuntime((s) => s.setCurrentGoal);
  useEffect(() => {
    const path = location.pathname;
    let params: Record<string, string> = {};
    let acctId: string | null = null;
    let goalId: string | null = null;
    const acctMatch = path.match(/^\/account\/([^/]+)/);
    if (acctMatch) {
      params = { id: acctMatch[1] };
      acctId = acctMatch[1];
    }
    const goalMatch = path.match(/^\/goal\/([^/]+)/);
    if (goalMatch) {
      params = { id: goalMatch[1] };
      goalId = goalMatch[1];
    }
    setRoute(path, params);
    setCurrentAccount(acctId);
    setCurrentGoal(goalId);
  }, [location.pathname, setRoute, setCurrentAccount, setCurrentGoal]);

  const { title: pageTitle, showSwitcher, showBack, hideChrome } = useRouteMeta();

  if (!currentUserId || hasInvite) {
    return (
      <div className="app">
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="topbar">
        {showBack ? (
          <button
            type="button"
            className="ghost topbar-back"
            onClick={() => navigate(-1)}
            aria-label="뒤로 가기"
          >
            ‹
          </button>
        ) : showSwitcher ? (
          <AccountSwitcher />
        ) : location.pathname === '/calendar' ? (
          <TxAccountFilter />
        ) : (
          <h1 className="topbar-title">{pageTitle ?? ''}</h1>
        )}
        {showBack && <h1 className="topbar-title topbar-title-center">{pageTitle ?? ''}</h1>}
        {!hideChrome && (
          <div className="topbar-right">
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => navigate('/settle')}
              title="정산"
              aria-label="정산"
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>🤝</span>
              {pendingSettleCount > 0 && (
                <span className="topbar-icon-badge">{pendingSettleCount}</span>
              )}
            </button>
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={() => alert('알림이 없어요.')}
              title="알림"
              aria-label="알림"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10 21a2 2 0 004 0" />
              </svg>
            </button>
            <button
              className="user-chip"
              onClick={() => {
                setCurrentUser(null);
                navigate('/');
              }}
              title="사용자 전환"
            >
              <span>{currentUser?.emoji ?? '👤'}</span>
              <span>{currentUser?.name ?? ''}</span>
              <span style={{ color: 'var(--text-faint)', fontSize: 11 }}>전환 ▾</span>
            </button>
          </div>
        )}
      </div>

      <LowBalanceToast />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/account/:id" element={<AccountDetail />} />
        <Route path="/goal/:id" element={<GoalDetail />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/tx/:id" element={<Transaction />} />
        <Route path="/settle" element={<Settle />} />
        <Route path="/settle/:id" element={<SettleDetail />} />
        <Route path="/what-if" element={<WhatIf />} />
        <Route
          path="/stats"
          element={
            <Suspense fallback={<div className="empty">통계 불러오는 중…</div>}>
              <Stats />
            </Suspense>
          }
        />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/home" element={<SettingsHome />} />
        <Route path="/settings/accounts-view" element={<SettingsAccountsView />} />
        <Route path="/settings/calendar-view" element={<SettingsCalendarView />} />
        <Route path="/settings/stats-view" element={<SettingsStatsView />} />
        <Route path="/settings/accounts" element={<SettingsAccounts />} />
        <Route path="/settings/goals" element={<SettingsGoals />} />
        <Route path="/settings/recurring" element={<SettingsRecurring />} />
        <Route path="/settings/categories" element={<SettingsCategories />} />
        <Route path="/settings/family" element={<SettingsFamily />} />
        <Route path="/settings/developer" element={<SettingsDeveloper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!hideChrome && <GlobalTxButton />}
      {!hideChrome && <BottomNav />}
    </div>
  );
}
