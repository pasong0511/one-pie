import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { CategoryKind, MainCategory } from '../../types';

export default function SettingsCategories() {
  const navigate = useNavigate();
  const taxonomy = useStore((s) => s.categoryTaxonomy);
  const addMain = useStore((s) => s.addMainCategory);
  const updateMain = useStore((s) => s.updateMainCategory);
  const removeMain = useStore((s) => s.removeMainCategory);
  const addSub = useStore((s) => s.addSubCategory);
  const updateSub = useStore((s) => s.updateSubCategory);
  const removeSub = useStore((s) => s.removeSubCategory);
  const resetTaxonomy = useStore((s) => s.resetCategoryTaxonomy);

  const [kind, setKind] = useState<CategoryKind>('expense');
  const [activeMainId, setActiveMainId] = useState<string | null>(null);
  const [editingMainId, setEditingMainId] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [mainEmojiBuf, setMainEmojiBuf] = useState('');
  const [mainLabelBuf, setMainLabelBuf] = useState('');
  const [subLabelBuf, setSubLabelBuf] = useState('');
  const [newMainOpen, setNewMainOpen] = useState(false);
  const [newMainEmoji, setNewMainEmoji] = useState('📦');
  const [newMainLabel, setNewMainLabel] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');

  const mainsOfKind = useMemo(
    () => taxonomy.filter((m) => m.kind === kind),
    [taxonomy, kind],
  );
  const activeMain: MainCategory | null =
    mainsOfKind.find((m) => m.id === activeMainId) ?? null;

  const startEditMain = (m: MainCategory) => {
    setEditingMainId(m.id);
    setMainEmojiBuf(m.emoji);
    setMainLabelBuf(m.label);
  };
  const commitEditMain = () => {
    if (!editingMainId) return;
    const label = mainLabelBuf.trim();
    if (!label) {
      setEditingMainId(null);
      return;
    }
    updateMain(editingMainId, { emoji: mainEmojiBuf, label });
    setEditingMainId(null);
  };
  const handleRemoveMain = (m: MainCategory) => {
    if (
      confirm(
        `"${m.emoji} ${m.label}" 메인 카테고리를 삭제할까요?\n하위 ${m.subs.length}개 서브도 함께 사라집니다.`,
      )
    ) {
      removeMain(m.id);
      if (activeMainId === m.id) setActiveMainId(null);
    }
  };
  const handleAddMain = () => {
    const label = newMainLabel.trim();
    if (!label) return;
    const m = addMain(kind, newMainEmoji || '📦', label);
    setActiveMainId(m.id);
    setNewMainLabel('');
    setNewMainEmoji('📦');
    setNewMainOpen(false);
  };

  const startEditSub = (subId: string, label: string) => {
    setEditingSubId(subId);
    setSubLabelBuf(label);
  };
  const commitEditSub = () => {
    if (!editingSubId || !activeMain) return;
    const label = subLabelBuf.trim();
    if (!label) {
      setEditingSubId(null);
      return;
    }
    updateSub(activeMain.id, editingSubId, label);
    setEditingSubId(null);
  };
  const handleAddSub = () => {
    if (!activeMain) return;
    const label = newSubLabel.trim();
    if (!label) return;
    addSub(activeMain.id, label);
    setNewSubLabel('');
  };

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <div className="row between" style={{ margin: '0 0 12px' }}>
        <h2 style={{ margin: 0 }}>카테고리 설정</h2>
        <button
          className="ghost"
          onClick={() => {
            if (confirm('카테고리를 기본값으로 초기화할까요?\n추가/수정/삭제한 내용이 모두 사라집니다.')) {
              resetTaxonomy();
              setActiveMainId(null);
            }
          }}
          title="기본값으로 초기화"
        >
          ↺ 기본값
        </button>
      </div>

      <div className="cat-kind-tabs">
        <button
          type="button"
          className={`cat-kind-tab ${kind === 'expense' ? 'active' : ''}`}
          onClick={() => {
            setKind('expense');
            setActiveMainId(null);
          }}
        >
          💸 지출
        </button>
        <button
          type="button"
          className={`cat-kind-tab ${kind === 'income' ? 'active' : ''}`}
          onClick={() => {
            setKind('income');
            setActiveMainId(null);
          }}
        >
          💰 수입
        </button>
      </div>

      <div className="cat-twopane">
        <div className="cat-twopane-left">
          {mainsOfKind.map((m) => (
            <div
              key={m.id}
              className={`cat-main-row ${activeMain?.id === m.id ? 'active' : ''}`}
            >
              {editingMainId === m.id ? (
                <div className="cat-main-edit">
                  <input
                    className="emoji-input"
                    value={mainEmojiBuf}
                    onChange={(e) => setMainEmojiBuf(e.target.value)}
                    maxLength={4}
                  />
                  <input
                    autoFocus
                    value={mainLabelBuf}
                    onChange={(e) => setMainLabelBuf(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEditMain();
                      if (e.key === 'Escape') setEditingMainId(null);
                    }}
                  />
                  <button className="primary" onClick={commitEditMain}>
                    저장
                  </button>
                  <button className="ghost" onClick={() => setEditingMainId(null)}>
                    취소
                  </button>
                  <button className="danger" onClick={() => handleRemoveMain(m)} title="삭제">
                    🗑
                  </button>
                </div>
              ) : (
                <div className="cat-main-btn">
                  <button
                    type="button"
                    className="cat-main-select"
                    onClick={() => setActiveMainId(m.id)}
                  >
                    <span className="cat-main-emoji">{m.emoji}</span>
                    <span className="cat-main-label">{m.label}</span>
                    <span className="cat-main-count">{m.subs.length}</span>
                  </button>
                  <button
                    type="button"
                    className="cat-main-edit-btn"
                    onClick={() => startEditMain(m)}
                    title="편집"
                    aria-label={`${m.label} 편집`}
                  >
                    ✏
                  </button>
                </div>
              )}
            </div>
          ))}
          {newMainOpen ? (
            <div className="cat-main-row">
              <div className="cat-main-edit">
                <input
                  className="emoji-input"
                  value={newMainEmoji}
                  onChange={(e) => setNewMainEmoji(e.target.value)}
                  maxLength={4}
                />
                <input
                  autoFocus
                  placeholder="메인 이름"
                  value={newMainLabel}
                  onChange={(e) => setNewMainLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddMain();
                    if (e.key === 'Escape') setNewMainOpen(false);
                  }}
                />
                <button className="primary" onClick={handleAddMain}>
                  추가
                </button>
                <button className="ghost" onClick={() => setNewMainOpen(false)}>
                  취소
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="cat-main-add"
              onClick={() => setNewMainOpen(true)}
            >
              + 메인 추가
            </button>
          )}
        </div>

        <div className="cat-twopane-right">
          {!activeMain && (
            <div className="empty" style={{ padding: 16 }}>
              왼쪽에서 메인 카테고리를 선택하세요.
            </div>
          )}
          {activeMain && (
            <>
              <div className="cat-sub-header">
                {activeMain.emoji} {activeMain.label}
              </div>
              {activeMain.subs.map((sc) => (
                <div key={sc.id} className="cat-sub-row">
                  {editingSubId === sc.id ? (
                    <>
                      <input
                        autoFocus
                        value={subLabelBuf}
                        onChange={(e) => setSubLabelBuf(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEditSub();
                          if (e.key === 'Escape') setEditingSubId(null);
                        }}
                        style={{ flex: 1 }}
                      />
                      <button className="primary" onClick={commitEditSub}>
                        저장
                      </button>
                      <button className="ghost" onClick={() => setEditingSubId(null)}>
                        취소
                      </button>
                      <button
                        className="danger"
                        onClick={() => {
                          if (confirm(`"${sc.label}" 서브를 삭제할까요?`)) {
                            removeSub(activeMain.id, sc.id);
                            setEditingSubId(null);
                          }
                        }}
                        title="삭제"
                      >
                        🗑
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1 }}>{sc.label}</span>
                      <button
                        className="ghost"
                        onClick={() => startEditSub(sc.id, sc.label)}
                        title="편집"
                      >
                        ✏
                      </button>
                    </>
                  )}
                </div>
              ))}
              <div className="cat-sub-row add">
                <input
                  placeholder="서브 카테고리 추가..."
                  value={newSubLabel}
                  onChange={(e) => setNewSubLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddSub();
                  }}
                  style={{ flex: 1 }}
                />
                <button className="primary" onClick={handleAddSub} disabled={!newSubLabel.trim()}>
                  + 추가
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
