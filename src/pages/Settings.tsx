import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { visibleGoals } from '../utils/selectors';
import {
  AccountsSection,
  CalendarSection,
  HomeSection,
  StatsSection,
} from '../types';

type MenuItem = {
  to: string;
  icon: string;
  label: string;
  sublabel?: string;
};

type Group = {
  title: string;
  items: MenuItem[];
};

export default function Settings() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const users = useStore((s) => s.users);
  const accounts = useStore((s) => s.accounts);
  const goals = useStore((s) => s.goals);
  const recurringRules = useStore((s) => s.recurringRules);
  const familyGroups = useStore((s) => s.familyGroups);
  const taxonomy = useStore((s) => s.categoryTaxonomy);
  const preferences = useStore((s) => s.preferences);

  const me = users.find((u) => u.id === currentUserId)!;
  const myAccounts = accounts.filter((a) => a.ownerId === currentUserId);
  const myGoals = visibleGoals(currentUserId, goals, users);
  const myRules = recurringRules.filter((r) => r.ownerId === currentUserId);
  const myGroup = familyGroups.find((g) => g.id === me?.familyGroupId);
  const memberCount = myGroup?.memberIds?.length ?? 0;
  const expenseMains = taxonomy.filter((m) => m.kind === 'expense').length;
  const incomeMains = taxonomy.filter((m) => m.kind === 'income').length;

  const groups: Group[] = [
    {
      title: '화면 표시',
      items: [
        {
          to: '/settings/home',
          icon: '🏠',
          label: '홈 화면',
          sublabel: hiddenSummary<HomeSection>(
            preferences.homeSections,
            ['goals', 'accounts'],
            { goals: '목표', accounts: '계좌' },
          ),
        },
        {
          to: '/settings/accounts-view',
          icon: '💳',
          label: '계좌 화면',
          sublabel: hiddenSummary<AccountsSection>(
            preferences.accountsSections,
            ['mine', 'shared'],
            { mine: '내 계좌', shared: '공유받은 계좌' },
          ),
        },
        {
          to: '/settings/calendar-view',
          icon: '📅',
          label: '거래 화면',
          sublabel: hiddenSummary<CalendarSection>(
            preferences.calendarSections,
            ['viewToggle', 'search'],
            { viewToggle: '보기 토글', search: '검색' },
          ),
        },
        {
          to: '/settings/stats-view',
          icon: '📊',
          label: '통계 화면',
          sublabel: hiddenSummary<StatsSection>(
            preferences.statsSections,
            ['summary', 'monthly', 'net', 'category', 'accountType', 'activeGoals'],
            {
              summary: '월별 요약',
              monthly: '수입/지출',
              net: '순이익',
              category: '카테고리',
              accountType: '결제 수단',
              activeGoals: '진행 중 목표',
            },
          ),
        },
      ],
    },
    {
      title: '데이터',
      items: [
        {
          to: '/settings/accounts',
          icon: '💳',
          label: '내 계좌',
          sublabel: `${myAccounts.length}개`,
        },
        {
          to: '/settings/goals',
          icon: '🎯',
          label: '목표',
          sublabel: `${myGoals.length}개`,
        },
        {
          to: '/settings/recurring',
          icon: '🔁',
          label: '반복 거래',
          sublabel: `${myRules.length}개 규칙`,
        },
        {
          to: '/settings/categories',
          icon: '🏷',
          label: '카테고리',
          sublabel: `지출 ${expenseMains} · 수입 ${incomeMains}`,
        },
      ],
    },
    {
      title: '기타',
      items: [
        {
          to: '/settings/family',
          icon: '👨‍👩‍👧',
          label: '가족',
          sublabel: myGroup ? `${myGroup.name} · ${memberCount}명` : '미연결',
        },
        {
          to: '/settings/developer',
          icon: '🛠',
          label: '개발자',
        },
      ],
    },
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row">
          <div style={{ fontSize: 32 }}>{me.emoji}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{me.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {myGroup ? `가족 그룹: ${myGroup.name}` : '가족 미연결'}
            </div>
          </div>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.title} className="settings-group">
          <div className="settings-group-title">{g.title}</div>
          <ul className="settings-menu">
            {g.items.map((it) => (
              <li key={it.to}>
                <button
                  type="button"
                  className="settings-menu-item"
                  onClick={() => navigate(it.to)}
                >
                  <span className="settings-menu-icon">{it.icon}</span>
                  <span className="settings-menu-text">
                    <span className="settings-menu-label">{it.label}</span>
                    {it.sublabel && (
                      <span className="settings-menu-sublabel">{it.sublabel}</span>
                    )}
                  </span>
                  <span className="settings-menu-chevron">›</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// 페이지별 *Sections 객체에서 false 인 키만 골라 한국어 라벨로 요약.
// 모두 표시 / "X, Y 숨김" 두 가지 형태.
function hiddenSummary<K extends string>(
  sections: Partial<Record<K, boolean>>,
  allKeys: readonly K[],
  labels: Record<K, string>,
): string {
  const hidden = allKeys.filter((k) => sections[k] === false);
  if (hidden.length === 0) return '모두 표시';
  return `${hidden.map((k) => labels[k]).join(', ')} 숨김`;
}
