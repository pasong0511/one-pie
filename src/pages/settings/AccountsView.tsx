import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { AccountsSection } from '../../types';

type Row = {
  key: AccountsSection;
  icon: string;
  label: string;
  sublabel: string;
};

const ROWS: Row[] = [
  {
    key: 'mine',
    icon: '👤',
    label: '내 계좌',
    sublabel: '내가 소유한 계좌 카드 리스트',
  },
  {
    key: 'shared',
    icon: '👥',
    label: '공유받은 계좌',
    sublabel: '가족이 공유한 계좌 카드 리스트',
  },
];

export default function SettingsAccountsView() {
  const navigate = useNavigate();
  const accountsSections = useStore((s) => s.preferences.accountsSections);
  const updatePreferences = useStore((s) => s.updatePreferences);

  const isOn = (key: AccountsSection) => accountsSections[key] !== false;
  const toggle = (key: AccountsSection) => {
    updatePreferences({ accountsSections: { [key]: !isOn(key) } });
  };

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <h2 style={{ margin: '0 0 4px' }}>계좌 화면</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
        계좌 페이지에 표시할 섹션을 선택해요. 월 네비는 항상 표시.
      </p>

      <ul className="settings-menu">
        {ROWS.map((r) => {
          const on = isOn(r.key);
          return (
            <li key={r.key}>
              <button
                type="button"
                className="settings-menu-item"
                onClick={() => toggle(r.key)}
                aria-pressed={on}
              >
                <span className="settings-menu-icon">{r.icon}</span>
                <span className="settings-menu-text">
                  <span className="settings-menu-label">{r.label}</span>
                  <span className="settings-menu-sublabel">{r.sublabel}</span>
                </span>
                <span
                  className={`toggle-switch ${on ? 'on' : ''}`}
                  aria-hidden="true"
                >
                  <span className="toggle-switch-knob" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
