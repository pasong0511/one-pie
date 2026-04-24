import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import PropertyPanel from '../../components/PropertyPanel';
import { ACCOUNT_TYPE_META } from '../../types';

export default function SettingsAccounts() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const addAccount = useStore((s) => s.addAccount);
  const reorderAccounts = useStore((s) => s.reorderAccounts);
  const [editing, setEditing] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const myAccounts = accounts.filter((a) => a.ownerId === currentUserId);

  const createNew = () => {
    const a = addAccount({
      ownerId: currentUserId,
      name: '새 계좌',
      emoji: '📒',
      type: '계좌',
      mode: '차감형',
      recurringDeposits: [],
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: [],
      budgetAllocations: {},
    });
    setEditing(a.id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setOverId(null);
      return;
    }
    const ids = myAccounts.map((x) => x.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    if (from === -1 || to === -1) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    reorderAccounts(ids);
    setDraggingId(null);
    setOverId(null);
  };

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <div className="row between" style={{ margin: '0 0 16px' }}>
        <h2 style={{ margin: 0 }}>내 계좌</h2>
        <button className="ghost" onClick={createNew}>
          + 새 계좌
        </button>
      </div>

      {myAccounts.length === 0 && <div className="empty">아직 계좌가 없어요.</div>}
      {myAccounts.length > 1 && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginBottom: 6 }}>
          ⇅ 카드를 드래그해서 순서를 바꿀 수 있어요
        </div>
      )}
      {myAccounts.map((a) => {
        const isDragging = draggingId === a.id;
        const isOver = overId === a.id && draggingId !== a.id;
        return (
          <div
            key={a.id}
            className="card"
            draggable
            onDragStart={(e) => {
              setDraggingId(a.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnter={() => setOverId(a.id)}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(a.id);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setOverId(null);
            }}
            style={{
              marginBottom: 8,
              opacity: isDragging ? 0.4 : 1,
              borderColor: isOver ? 'var(--accent)' : undefined,
              borderWidth: isOver ? 2 : 1,
              cursor: 'grab',
              transition: 'border-color 0.1s',
            }}
          >
            <div className="row between">
              <div className="row" style={{ gap: 8 }}>
                <span
                  style={{
                    color: 'var(--text-faint)',
                    fontSize: 14,
                    userSelect: 'none',
                  }}
                  title="드래그로 순서 변경"
                >
                  ⋮⋮
                </span>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {a.emoji} {a.name}
                  </div>
                  <div
                    style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}
                  >
                    {ACCOUNT_TYPE_META[a.type ?? '계좌'].emoji} {ACCOUNT_TYPE_META[a.type ?? '계좌'].label} · {a.mode} · {a.sharing} · 카테고리{' '}
                    {a.categories.length}개
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => navigate(`/account/${a.id}`)}>열기</button>
                <button onClick={() => setEditing(a.id)}>속성</button>
              </div>
            </div>
          </div>
        );
      })}

      {editing && (
        <PropertyPanel accountId={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
