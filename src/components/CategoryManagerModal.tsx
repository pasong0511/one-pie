import { useState } from 'react';
import { useStore } from '../store';

// 카테고리 관리(추가/수정/삭제) 전용 모달.
// 현재는 account.categories 기반 (계좌별 독립). 향후 확장 포인트:
// - Category type을 { id, name, emoji?, kind? }로 분리
// - 공통 풀(user/familyGroup) + 계좌별 opt-in 구조
// 이 컴포넌트는 `accountId`만 받아 store 액션으로 CRUD하므로,
// store 내부 구현이 바뀌어도 UI는 그대로 재사용 가능.
export default function CategoryManagerModal({
  accountId,
  onClose,
}: {
  accountId: string;
  onClose: () => void;
}) {
  const account = useStore((s) => s.accounts.find((a) => a.id === accountId));
  const addCategory = useStore((s) => s.addCategory);
  const renameCategory = useStore((s) => s.renameCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);

  const [editing, setEditing] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState('');
  const [newCat, setNewCat] = useState('');

  if (!account) return null;

  const startEdit = (name: string) => {
    setEditing(name);
    setEditBuf(name);
  };
  const cancelEdit = () => {
    setEditing(null);
    setEditBuf('');
  };
  const commitEdit = () => {
    const next = editBuf.trim();
    if (!editing) return;
    if (!next || next === editing) {
      cancelEdit();
      return;
    }
    if (account.categories.includes(next)) {
      alert(`"${next}" 카테고리가 이미 있어요.`);
      return;
    }
    renameCategory(accountId, editing, next);
    cancelEdit();
  };
  const handleDelete = (name: string) => {
    if (
      confirm(
        `"${name}" 카테고리를 삭제할까요?\n이 카테고리의 예산 배정도 함께 사라지고, 관련 거래의 카테고리는 비워집니다.`,
      )
    ) {
      deleteCategory(accountId, name);
      if (editing === name) cancelEdit();
    }
  };
  const handleAdd = () => {
    const next = newCat.trim();
    if (!next) return;
    if (account.categories.includes(next)) {
      alert(`"${next}" 카테고리가 이미 있어요.`);
      return;
    }
    addCategory(accountId, next);
    setNewCat('');
  };

  return (
    <div className="modal-backdrop nested" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>⚙ 카테고리 설정 · {account.name}</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {account.categories.length === 0 && (
            <div className="empty" style={{ padding: 16 }}>
              아직 카테고리가 없어요. 아래에서 추가하세요.
            </div>
          )}
          <div className="cat-manage-list">
            {account.categories.map((c) => (
              <div key={c} className="cat-manage-row">
                {editing === c ? (
                  <>
                    <input
                      autoFocus
                      value={editBuf}
                      onChange={(e) => setEditBuf(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      style={{ flex: 1 }}
                    />
                    <button className="primary" onClick={commitEdit}>
                      저장
                    </button>
                    <button className="ghost" onClick={cancelEdit}>
                      취소
                    </button>
                    <button className="danger" onClick={() => handleDelete(c)}>
                      🗑
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1 }}>{c}</span>
                    <button className="ghost" onClick={() => startEdit(c)} title="편집">
                      ✏
                    </button>
                  </>
                )}
              </div>
            ))}
            <div className="cat-manage-row add">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
                placeholder="새 카테고리 입력..."
                style={{ flex: 1 }}
              />
              <button className="primary" onClick={handleAdd} disabled={!newCat.trim()}>
                + 추가
              </button>
            </div>
          </div>
          <div className="hint" style={{ marginTop: 12 }}>
            이름을 바꾸면 기존 거래와 예산 배정도 함께 업데이트됩니다. 삭제 시 예산 배정은 사라지고 거래의 카테고리는 비워집니다.
          </div>
        </div>
        <div className="modal-footer">
          <button className="primary" onClick={onClose}>
            완료
          </button>
        </div>
      </div>
    </div>
  );
}
