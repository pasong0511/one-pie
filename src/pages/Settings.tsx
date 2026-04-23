import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import PropertyPanel from '../components/PropertyPanel';
import GoalEditor from '../components/GoalEditor';
import InviteModal from '../components/InviteModal';
import { visibleGoals } from '../utils/selectors';
import { formatKRW } from '../utils/format';
import { ACCOUNT_TYPE_META } from '../types';

export default function Settings() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const users = useStore((s) => s.users);
  const accounts = useStore((s) => s.accounts);
  const addAccount = useStore((s) => s.addAccount);
  const loadSeed = useStore((s) => s.loadSeed);
  const resetAll = useStore((s) => s.resetAll);
  const [editing, setEditing] = useState<string | null>(null);

  const me = users.find((u) => u.id === currentUserId)!;
  const myAccounts = accounts.filter((a) => a.ownerId === currentUserId);
  const goals = useStore((s) => s.goals);
  const myGoals = visibleGoals(currentUserId, goals, users);
  const reorderAccounts = useStore((s) => s.reorderAccounts);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [goalEditing, setGoalEditing] = useState<{ id?: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const familyGroups = useStore((s) => s.familyGroups);
  const myGroup = familyGroups.find((g) => g.id === me?.familyGroupId);
  const members = (myGroup?.memberIds ?? [])
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is NonNullable<typeof u> => !!u);

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
      <button className="ghost" onClick={() => navigate('/')} style={{ marginBottom: 8 }}>
        ← 대시보드
      </button>
      <h2 style={{ margin: '0 0 16px' }}>⚙ 설정</h2>

      <div className="section-title">프로필</div>
      <div className="card">
        <div className="row">
          <div style={{ fontSize: 32 }}>{me.emoji}</div>
          <div>
            <div style={{ fontWeight: 600 }}>{me.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {me.familyGroupId ? `가족 그룹: ${me.familyGroupId}` : '가족 미연결'}
            </div>
          </div>
        </div>
      </div>

      <div className="section-title">
        내 계좌
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

      <div className="section-title">
        목표
        <button className="ghost" onClick={() => setGoalEditing({})}>
          + 새 목표
        </button>
      </div>
      {myGoals.length === 0 && <div className="empty">아직 목표가 없어요.</div>}
      {myGoals.map((g) => (
        <div key={g.id} className="card" style={{ marginBottom: 8 }}>
          <div className="row between">
            <div>
              <div style={{ fontWeight: 600 }}>
                {g.emoji} {g.name}
                <span
                  className={`chip mode-${(g.mode ?? '누적형') === '누적형' ? 'cumulative' : 'deductive'}`}
                  style={{ marginLeft: 6 }}
                >
                  {(g.mode ?? '누적형') === '누적형' ? '📈 누적' : '📉 차감'}
                </span>
                <span
                  className={`chip ${
                    g.ownerType === 'family' ? 'sharing-rw' : 'sharing-private'
                  }`}
                  style={{ marginLeft: 4 }}
                >
                  {g.ownerType === 'family' ? '👥 공유' : '🔒 개인'}
                </span>
                {(() => {
                  const st = g.status ?? '진행중';
                  return (
                    <span
                      className={`chip status-${st === '진행중' ? 'ongoing' : st === '완료' ? 'done' : 'failed'}`}
                      style={{ marginLeft: 4 }}
                    >
                      {st === '진행중' ? '🔄 진행중' : st === '완료' ? '✅ 완료' : '❌ 실패'}
                    </span>
                  );
                })()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                {g.startAmount !== undefined && g.startAmount > 0
                  ? `${formatKRW(g.startAmount)} → ${formatKRW(g.targetAmount)}`
                  : formatKRW(g.targetAmount)}
                {' · '}
                {g.startDate ? `${g.startDate} ~ ${g.targetDate}` : g.targetDate} · 연결 계좌{' '}
                {g.linkedAccountIds.length}개
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => navigate(`/goal/${g.id}`)}>열기</button>
              <button onClick={() => setGoalEditing({ id: g.id })}>편집</button>
            </div>
          </div>
        </div>
      ))}

      <div className="section-title">가족</div>
      <div className="card">
        <div style={{ fontSize: 13 }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            가족 그룹: <strong style={{ color: 'var(--text)' }}>{myGroup?.name ?? me.familyGroupId ?? '없음'}</strong>
          </div>
          {members.length > 0 && (
            <div className="row" style={{ flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {members.map((m) => (
                <span
                  key={m.id}
                  className="chip"
                  style={{ padding: '6px 10px', fontSize: 12 }}
                >
                  {m.emoji ?? '👤'} {m.name}
                  {m.id === currentUserId && (
                    <span style={{ color: 'var(--text-faint)', marginLeft: 4 }}>(나)</span>
                  )}
                </span>
              ))}
            </div>
          )}
          <button className="primary" onClick={() => setInviteOpen(true)}>
            + 가족 구성원 초대 (QR)
          </button>
        </div>
      </div>

      <div className="section-title">개발자</div>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={loadSeed}>샘플 데이터 재로드</button>
          <button
            className="danger"
            onClick={() => {
              if (confirm('모든 데이터를 삭제할까요?')) {
                resetAll();
                navigate('/');
              }
            }}
          >
            전체 초기화
          </button>
        </div>
      </div>

      {editing && (
        <PropertyPanel accountId={editing} onClose={() => setEditing(null)} />
      )}
      {goalEditing && (
        <GoalEditor
          goalId={goalEditing.id}
          onClose={() => setGoalEditing(null)}
        />
      )}
      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}
