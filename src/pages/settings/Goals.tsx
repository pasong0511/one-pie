import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import GoalEditor from '../../components/GoalEditor';
import { visibleGoals } from '../../utils/selectors';
import { formatKRW } from '../../utils/format';

export default function SettingsGoals() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const users = useStore((s) => s.users);
  const goals = useStore((s) => s.goals);
  const [goalEditing, setGoalEditing] = useState<{ id?: string } | null>(null);

  const myGoals = visibleGoals(currentUserId, goals, users);

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <div className="row between" style={{ margin: '0 0 16px' }}>
        <h2 style={{ margin: 0 }}>목표</h2>
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

      {goalEditing && (
        <GoalEditor
          goalId={goalEditing.id}
          onClose={() => setGoalEditing(null)}
        />
      )}
    </div>
  );
}
