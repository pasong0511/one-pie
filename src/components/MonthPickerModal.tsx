import { useEffect, useMemo, useRef, useState } from 'react';
import { addMonths, currentMonth } from '../utils/format';

const RANGE_BACK = 36;
const RANGE_FORWARD = 12;

export default function MonthPickerModal({
  month,
  onSelect,
  onClose,
}: {
  month: string;
  onSelect: (m: string) => void;
  onClose: () => void;
}) {
  const [picked, setPicked] = useState(month);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const months = useMemo(() => {
    const base = currentMonth();
    const arr: string[] = [];
    for (let i = -RANGE_BACK; i <= RANGE_FORWARD; i++) {
      arr.push(addMonths(base, i));
    }
    return arr;
  }, []);

  // 모달 오픈 시 현재 선택 월을 리스트 중앙으로 스크롤
  useEffect(() => {
    const item = selectedRef.current;
    const list = listRef.current;
    if (item && list) {
      list.scrollTop =
        item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2;
    }
  }, []);

  const [py, pm] = picked.split('-');
  const lastDay = new Date(Number(py), Number(pm), 0).getDate();
  const periodLabel = `${py}.${pm}.01 - ${py}.${pm}.${String(lastDay).padStart(2, '0')}`;

  const handleApply = () => {
    onSelect(picked);
    onClose();
  };

  return (
    <div className="modal-backdrop sheet" onClick={onClose}>
      <div className="modal month-picker" onClick={(e) => e.stopPropagation()}>
        <div className="month-picker-header">
          <div className="month-picker-title-row">
            <h3>월 선택</h3>
            <button className="ghost" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>
          <div className="month-picker-period">기간 {periodLabel}</div>
        </div>
        <div className="month-picker-list" ref={listRef}>
          {months.map((ym) => {
            const [yy, mm] = ym.split('-');
            const isPicked = ym === picked;
            return (
              <button
                key={ym}
                ref={isPicked ? selectedRef : undefined}
                type="button"
                className={`month-picker-item ${isPicked ? 'picked' : ''}`}
                onClick={() => setPicked(ym)}
              >
                {yy}년 {Number(mm)}월
              </button>
            );
          })}
        </div>
        <div className="month-picker-footer">
          <button
            type="button"
            className="primary month-picker-apply"
            onClick={handleApply}
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
