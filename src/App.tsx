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
import Calendar from './pages/Calendar';
import LowBalanceToast from './components/LowBalanceToast';
import GlobalTxButton from './components/GlobalTxButton';
import BottomNav from './components/BottomNav';
import AccountSwitcher from './components/AccountSwitcher';

// Stats는 recharts를 쓰므로 lazy-load (초기 번들에서 제외 → 모바일 초기 로딩 빠르게)
const Stats = lazy(() => import('./pages/Stats'));

export default function App() {
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const materializeRecurringRules = useStore((s) => s.materializeRecurringRules);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUserId) materializeRecurringRules();
  }, [currentUserId, materializeRecurringRules]);

  const currentUser = users.find((u) => u.id === currentUserId);
  const location = useLocation();
  const hasInvite = useMemo(
    () => new URLSearchParams(location.search).has('invite'),
    [location.search],
  );

  const pathname = location.pathname;
  const showSwitcher = pathname === '/' || pathname === '/accounts';
  const pageTitle = !showSwitcher ? getPageTitle(pathname) : null;

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
        {showSwitcher ? (
          <AccountSwitcher />
        ) : (
          <h1 className="topbar-title">{pageTitle ?? ''}</h1>
        )}
        <div className="topbar-right">
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
      </div>

      <LowBalanceToast />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/account/:id" element={<AccountDetail />} />
        <Route path="/goal/:id" element={<GoalDetail />} />
        <Route path="/calendar" element={<Calendar />} />
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
        <Route path="/settings/accounts" element={<SettingsAccounts />} />
        <Route path="/settings/goals" element={<SettingsGoals />} />
        <Route path="/settings/recurring" element={<SettingsRecurring />} />
        <Route path="/settings/categories" element={<SettingsCategories />} />
        <Route path="/settings/family" element={<SettingsFamily />} />
        <Route path="/settings/developer" element={<SettingsDeveloper />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <GlobalTxButton />
      <BottomNav />
    </div>
  );
}

function getPageTitle(pathname: string): string | null {
  if (pathname === '/calendar') return '달력';
  if (pathname === '/stats') return '통계';
  if (pathname.startsWith('/settings')) return '설정';
  if (pathname === '/what-if') return '이 소비 괜찮을까';
  if (pathname.startsWith('/account/')) return '계좌';
  if (pathname.startsWith('/goal/')) return '목표';
  return null;
}
