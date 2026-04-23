type Props = {
  categories: string[];
  selected?: string;
  onSelect?: (name: string) => void;
  // 칩 옆에 덧붙일 부가 텍스트 (예: 예산 배정 금액)
  subtext?: (name: string) => string | null;
  emptyText?: string;
};

// 카테고리 칩 — 선택/표시 전용. 추가/수정/삭제는 CategoryManagerModal에서 처리.
export default function CategoryChips({
  categories,
  selected,
  onSelect,
  subtext,
  emptyText = '등록된 카테고리 없음 — ⚙에서 추가하세요',
}: Props) {
  if (categories.length === 0) {
    return (
      <div className="cat-chip-row">
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>{emptyText}</span>
      </div>
    );
  }
  return (
    <div className="cat-chip-row">
      {categories.map((c) => {
        const sub = subtext ? subtext(c) : null;
        const isSelected = selected === c;
        return (
          <span
            key={c}
            className={`cat-chip ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect?.(isSelected ? '' : c)}
          >
            <span>{c}</span>
            {sub && <span className="cat-chip-sub">{sub}</span>}
          </span>
        );
      })}
    </div>
  );
}
