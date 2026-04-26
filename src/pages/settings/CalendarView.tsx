import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { CalendarSection } from '../../types';

type Row = {
  key: CalendarSection;
  icon: string;
  label: string;
  sublabel: string;
};

const ROWS: Row[] = [
  {
    key: 'viewToggle',
    icon: '☰',
    label: '보기 전환 토글',
    sublabel: '목록 / 달력 보기 전환 버튼',
  },
  {
    key: 'search',
    icon: '🔍',
    label: '검색 버튼',
    sublabel: '돋보기 아이콘 — 거래 검색 모달 진입',
  },
];

export default function SettingsCalendarView() {
  const navigate = useNavigate();
  const calendarSections = useStore((s) => s.preferences.calendarSections);
  const updatePreferences = useStore((s) => s.updatePreferences);

  const isOn = (key: CalendarSection) => calendarSections[key] !== false;
  const toggle = (key: CalendarSection) => {
    updatePreferences({ calendarSections: { [key]: !isOn(key) } });
  };

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <h2 style={{ margin: '0 0 4px' }}>거래 화면</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 16px' }}>
        거래 페이지 상단 툴바에 표시할 항목을 선택해요. 둘 다 끄면 툴바 자체가 숨겨져요.
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
