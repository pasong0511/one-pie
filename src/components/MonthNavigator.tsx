import { addMonths, currentMonth } from '../utils/format';

// 월 단위 뷰 전환 컨트롤 — ‹ 월 ›, 현재 달이 아니면 "오늘로" 표시
export default function MonthNavigator({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) {
  const [y, m] = month.split('-');
  const isCurrent = month === currentMonth();
  return (
    <div className="month-nav">
      <button
        className="ghost"
        onClick={() => onChange(addMonths(month, -1))}
        aria-label="이전 달"
      >
        ‹
      </button>
      <button
        className="ghost month-nav-title"
        onClick={() => onChange(currentMonth())}
        title={isCurrent ? '이번 달' : '오늘로 돌아가기'}
      >
        {y}년 {Number(m)}월
        {!isCurrent && <span className="month-nav-today"> · 오늘로</span>}
      </button>
      <button
        className="ghost"
        onClick={() => onChange(addMonths(month, 1))}
        aria-label="다음 달"
      >
        ›
      </button>
    </div>
  );
}
