import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { StatsSection } from '../../types';

type Row = {
  key: StatsSection;
  icon: string;
  label: string;
  sublabel: string;
};

const ROWS: Row[] = [
  {
    key: 'summary',
    icon: '📋',
    label: '월별 요약',
    sublabel: '수입 · 지출 · 순이익 · 저축률 4카드',
  },
  {
    key: 'monthly',
    icon: '📊',
    label: '수입 vs 지출',
    sublabel: '최근 N개월 막대 그래프',
  },
  {
    key: 'net',
    icon: '📈',
    label: '순이익 추이',
    sublabel: '최근 N개월 라인 그래프',
  },
  {
    key: 'category',
    icon: '🍩',
    label: '카테고리별 지출',
    sublabel: '도넛 차트',
  },
  {
    key: 'accountType',
    icon: '💳',
    label: '결제 수단별 지출',
    sublabel: '계좌 종류 가로 막대',
  },
  {
    key: 'activeGoals',
    icon: '🎯',
    label: '진행 중 목표',
    sublabel: '목표별 진행률 바 (목표 있을 때만)',
  },
];

export default function SettingsStatsView() {
  const navigate = useNavigate();
  const statsSections = useStore((s) => s.preferences.statsSections);
  const updatePreferences = useStore((s) => s.updatePreferences);

  const isOn = (key: StatsSection) => statsSections[key] !== false;
  const toggle = (key: StatsSection) => {
    updatePreferences({ statsSections: { [key]: !isOn(key) } });
  };

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <h2 style={{ margin: '0 0 4px' }}>통계 화면</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
        통계 페이지에 표시할 차트를 선택해요. 월 네비/기간 토글은 항상 표시.
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
