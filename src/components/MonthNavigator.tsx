import { useState } from 'react';
import { addMonths } from '../utils/format';
import MonthPickerModal from './MonthPickerModal';

// 월 단위 뷰 전환 컨트롤 — ‹ 월 ›, 월 탭하면 월 선택 모달
export default function MonthNavigator({
  month,
  onChange,
}: {
  month: string;
  onChange: (m: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [y, m] = month.split('-');
  return (
    <>
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
          onClick={() => setPickerOpen(true)}
          aria-label="월 선택"
          title="월 선택"
        >
          {y}년 {Number(m)}월
        </button>
        <button
          className="ghost"
          onClick={() => onChange(addMonths(month, 1))}
          aria-label="다음 달"
        >
          ›
        </button>
      </div>
      {pickerOpen && (
        <MonthPickerModal
          month={month}
          onSelect={onChange}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
