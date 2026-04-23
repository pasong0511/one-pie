import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccountDetail from './pages/AccountDetail';
import GoalDetail from './pages/GoalDetail';
import WhatIf from './pages/WhatIf';
import Settings from './pages/Settings';
import LowBalanceToast from './components/LowBalanceToast';
import GlobalTxButton from './components/GlobalTxButton';

export default function App() {
  const currentUserId = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const navigate = useNavigate();

  const currentUser = users.find((u) => u.id === currentUserId);

  if (!currentUserId) {
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
        <div className="brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <a>🥧 one-pie</a>
        </div>
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

      <LowBalanceToast />

      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/account/:id" element={<AccountDetail />} />
        <Route path="/goal/:id" element={<GoalDetail />} />
        <Route path="/what-if" element={<WhatIf />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <GlobalTxButton />
    </div>
  );
}
