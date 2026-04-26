import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { CategoryKind, CATEGORY_KIND_META, MainCategory } from '../types';

type Props = {
  // 거래 kind 에 맞춰 카테고리 필터링.
  //   'expense' / 'income' = 한 종류만
  //   'all' = 둘 다 (이체 거래에 사용 — 지출/수입 카테고리 둘 다 노출)
  kind: CategoryKind | 'all';
  value?: string;
  onSelect: (subLabel: string) => void;
  onClose: () => void;
};

// 카테고리 선택 bottom-sheet. kind='all' 이면 지출/수입 두 섹션으로 나눠 노출.
// 우측 상단 ⚙ 아이콘으로 /settings/categories 로 이동.
export default function CategoryPickerModal({
  kind,
  value,
  onSelect,
  onClose,
}: Props) {
  const navigate = useNavigate();
  const taxonomy = useStore((s) => s.categoryTaxonomy);
  const [activeMainId, setActiveMainId] = useState<string | null>(null);

  const expenseMains = useMemo(
    () => taxonomy.filter((m) => m.kind === 'expense'),
    [taxonomy],
  );
  const incomeMains = useMemo(
    () => taxonomy.filter((m) => m.kind === 'income'),
    [taxonomy],
  );

  // 활성 메인 결정 — kind 가 단일이면 해당 종류에서, 'all' 이면 전체에서 검색.
  const allRelevantMains: MainCategory[] =
    kind === 'all' ? taxonomy : kind === 'expense' ? expenseMains : incomeMains;
  const activeMain = allRelevantMains.find((m) => m.id === activeMainId) ?? null;

  const handleSubPick = (label: string) => {
    onSelect(label);
    onClose();
  };

  const headerLabel =
    kind === 'all'
      ? '↔ 이체 카테고리'
      : `${CATEGORY_KIND_META[kind].emoji} ${CATEGORY_KIND_META[kind].label} 카테고리`;

  return (
    <div className="modal-backdrop sheet" onClick={onClose}>
      <div
        className="modal category-picker"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cat-picker-header">
          <button className="ghost" onClick={onClose} aria-label="닫기">
            ✕
          </button>
          <h3 style={{ margin: 0 }}>{headerLabel}</h3>
          <button
            className="ghost"
            onClick={() => {
              onClose();
              navigate('/settings/categories');
            }}
            title="카테고리 편집"
            aria-label="카테고리 편집"
          >
            ⚙
          </button>
        </div>

        <div className="cat-picker-body">
          {kind === 'all' ? (
            <>
              <MainsBlock
                title={`${CATEGORY_KIND_META.expense.emoji} ${CATEGORY_KIND_META.expense.label}`}
                mains={expenseMains}
                activeMainId={activeMainId}
                onPick={(id) => setActiveMainId(id === activeMainId ? null : id)}
              />
              <MainsBlock
                title={`${CATEGORY_KIND_META.income.emoji} ${CATEGORY_KIND_META.income.label}`}
                mains={incomeMains}
                activeMainId={activeMainId}
                onPick={(id) => setActiveMainId(id === activeMainId ? null : id)}
                spacedTop
              />
            </>
          ) : (
            <MainsBlock
              title="메인"
              mains={allRelevantMains}
              activeMainId={activeMainId}
              onPick={(id) => setActiveMainId(id === activeMainId ? null : id)}
            />
          )}

          {activeMain && (
            <>
              <div className="cat-picker-section-label" style={{ marginTop: 14 }}>
                {activeMain.emoji} {activeMain.label} → 서브
              </div>
              <div className="cat-picker-chips">
                {activeMain.subs.map((sc) => (
                  <button
                    type="button"
                    key={sc.id}
                    className={`cat-chip-sm ${value === sc.label ? 'selected' : ''}`}
                    onClick={() => handleSubPick(sc.label)}
                  >
                    {sc.label}
                  </button>
                ))}
                {activeMain.subs.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    서브 카테고리 없음 — ⚙에서 추가
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          {value && (
            <button
              className="ghost"
              onClick={() => {
                onSelect('');
                onClose();
              }}
            >
              선택 해제
            </button>
          )}
          <button className="primary" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function MainsBlock({
  title,
  mains,
  activeMainId,
  onPick,
  spacedTop,
}: {
  title: string;
  mains: MainCategory[];
  activeMainId: string | null;
  onPick: (id: string) => void;
  spacedTop?: boolean;
}) {
  return (
    <>
      <div
        className="cat-picker-section-label"
        style={spacedTop ? { marginTop: 14 } : undefined}
      >
        {title}
      </div>
      <div className="cat-picker-chips">
        {mains.map((m) => (
          <button
            type="button"
            key={m.id}
            className={`cat-chip-lg ${activeMainId === m.id ? 'active' : ''}`}
            onClick={() => onPick(m.id)}
          >
            <span>{m.emoji}</span>
            <span>{m.label}</span>
          </button>
        ))}
        {mains.length === 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            등록된 카테고리가 없어요 — ⚙에서 추가하세요
          </span>
        )}
      </div>
    </>
  );
}
