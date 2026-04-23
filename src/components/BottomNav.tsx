import { NavLink } from 'react-router-dom';

const TABS: { to: string; icon: string; label: string; end?: boolean }[] = [
  { to: '/', icon: '🏠', label: '홈', end: true },
  { to: '/calendar', icon: '📅', label: '달력' },
  { to: '/stats', icon: '📊', label: '통계' },
  { to: '/settings', icon: '⚙️', label: '설정' },
];

// 모바일 하단 고정 탭바. 주요 페이지 간 전환을 1-탭 거리에.
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => `bnav-item ${isActive ? 'active' : ''}`}
        >
          <span className="bnav-icon">{t.icon}</span>
          <span className="bnav-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
