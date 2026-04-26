import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { HomeSection } from '../../types';

type Row = {
  key: HomeSection;
  icon: string;
  label: string;
  sublabel: string;
};

const ROWS: Row[] = [
  {
    key: 'goals',
    icon: '🎯',
    label: '목표',
    sublabel: '진행중/완료/실패 목표 카드',
  },
  {
    key: 'accounts',
    icon: '💳',
    label: '계좌',
    sublabel: '월 네비 + 내 계좌 / 공유받은 계좌',
  },
];

export default function SettingsHome() {
  const navigate = useNavigate();
  const homeSections = useStore((s) => s.preferences.homeSections);
  const updatePreferences = useStore((s) => s.updatePreferences);

  const isOn = (key: HomeSection) => homeSections[key] !== false;
  const toggle = (key: HomeSection) => {
    updatePreferences({ homeSections: { [key]: !isOn(key) } });
  };

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <h2 style={{ margin: '0 0 4px' }}>홈 화면</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
        대시보드에 표시할 섹션을 선택해요. 끄면 빈 상태도 함께 숨겨져요.
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
