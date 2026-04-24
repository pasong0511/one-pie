import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { CategoryKind, CATEGORY_KIND_META } from '../types';

type Props = {
  // 거래의 구분(지출/입금)에 맞춰 고정. 피커 내에서 탭으로 전환하지 않음.
  kind: CategoryKind;
  // 현재 선택된 서브 label (재진입 시 하이라이트)
  value?: string;
  onSelect: (subLabel: string) => void;
  onClose: () => void;
};

// 카테고리 선택 bottom-sheet. 부모의 kind 기준으로 메인 칩 → 서브 칩.
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

  const mainsOfKind = useMemo(
    () => taxonomy.filter((m) => m.kind === kind),
    [taxonomy, kind],
  );
  const activeMain = mainsOfKind.find((m) => m.id === activeMainId) ?? null;
  const kindMeta = CATEGORY_KIND_META[kind];

  const handleSubPick = (label: string) => {
    onSelect(label);
    onClose();
  };

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
          <h3 style={{ margin: 0 }}>
            {kindMeta.emoji} {kindMeta.label} 카테고리
          </h3>
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
          <div className="cat-picker-section-label">메인</div>
          <div className="cat-picker-chips">
            {mainsOfKind.map((m) => (
              <button
                type="button"
                key={m.id}
                className={`cat-chip-lg ${activeMainId === m.id ? 'active' : ''}`}
                onClick={() => setActiveMainId(m.id === activeMainId ? null : m.id)}
              >
                <span>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
            {mainsOfKind.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                등록된 카테고리가 없어요 — ⚙에서 추가하세요
              </span>
            )}
          </div>

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
