import { NavLink } from 'react-router-dom';

type IconName = 'home' | 'wallet' | 'cal' | 'chart' | 'settings';

// 모바일 하단 고정 탭바. Toss 톤의 라인 아이콘 사용.
const TABS: { to: string; icon: IconName; label: string; end?: boolean }[] = [
  { to: '/', icon: 'home', label: '홈', end: true },
  { to: '/accounts', icon: 'wallet', label: '계좌' },
  { to: '/calendar', icon: 'cal', label: '거래' },
  { to: '/stats', icon: 'chart', label: '통계' },
  { to: '/settings', icon: 'settings', label: '설정' },
];

function NavIcon({ name }: { name: IconName }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...p}>
          <path d="M4 10l8-6 8 6v10a2 2 0 01-2 2h-4v-7h-4v7H6a2 2 0 01-2-2V10z" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...p}>
          <rect x="3" y="6" width="18" height="14" rx="2" />
          <path d="M16 12h3" />
          <path d="M3 10h14a2 2 0 012 2v0a2 2 0 01-2 2H3" />
        </svg>
      );
    case 'cal':
      return (
        <svg {...p}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M4 10h16M9 3v4M15 3v4" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...p}>
          <path d="M4 19V5M4 19h16M8 15V9M12 15v-4M16 15v-8" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </svg>
      );
  }
}

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
          <span className="bnav-icon">
            <NavIcon name={t.icon} />
          </span>
          <span className="bnav-label">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
