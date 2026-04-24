import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { visibleGoals } from '../utils/selectors';

type MenuItem = {
  to: string;
  icon: string;
  label: string;
  sublabel?: string;
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

  const me = users.find((u) => u.id === currentUserId)!;
  const myAccounts = accounts.filter((a) => a.ownerId === currentUserId);
  const myGoals = visibleGoals(currentUserId, goals, users);
  const myRules = recurringRules.filter((r) => r.ownerId === currentUserId);
  const myGroup = familyGroups.find((g) => g.id === me?.familyGroupId);
  const memberCount = myGroup?.memberIds?.length ?? 0;
  const expenseMains = taxonomy.filter((m) => m.kind === 'expense').length;
  const incomeMains = taxonomy.filter((m) => m.kind === 'income').length;

  const items: MenuItem[] = [
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

      <ul className="settings-menu">
        {items.map((it) => (
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
  );
}
