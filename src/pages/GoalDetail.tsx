import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { goalProgress } from '../utils/selectors';
import { accountBalance } from '../store';
import { formatKRW } from '../utils/format';
import GoalEditor from '../components/GoalEditor';

export default function GoalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goal = useStore((s) => s.goals.find((g) => g.id === id));
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const users = useStore((s) => s.users);
  const updateGoal = useStore((s) => s.updateGoal);
  const [editOpen, setEditOpen] = useState(false);

  if (!goal) {
    return (
      <div className="empty">
        목표를 찾을 수 없어요. <button onClick={() => navigate('/')}>대시보드로</button>
      </div>
    );
  }

  const p = goalProgress(goal, accounts, transactions);
  const linked = accounts.filter((a) => goal.linkedAccountIds.includes(a.id));

  return (
    <div>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div />
        <button onClick={() => setEditOpen(true)}>⚙ 편집</button>
      </div>
      <h2 style={{ margin: '0 0 4px' }}>
        {goal.emoji ?? '🎯'} {goal.name}
        <span
          className={`chip mode-${p.mode === '누적형' ? 'cumulative' : 'deductive'}`}
          style={{ marginLeft: 8, verticalAlign: 'middle' }}
        >
          {p.mode === '누적형' ? '📈 누적형' : '📉 차감형'}
        </span>
        <span
          className={`chip status-${p.status === '진행중' ? 'ongoing' : p.status === '완료' ? 'done' : 'failed'}`}
          style={{ marginLeft: 4, verticalAlign: 'middle' }}
        >
          {p.status === '진행중' ? '🔄 진행중' : p.status === '완료' ? '✅ 완료' : '❌ 실패'}
        </span>
      </h2>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        {goal.ownerType === 'family' ? '👥 가족 공동 목표' : '🔒 개인 목표'}
        {goal.startDate ? ` · ${goal.startDate} ~ ${goal.targetDate}` : ` · 목표 시점 ${goal.targetDate}`}
      </div>

      {p.reached && p.status === '진행중' && (
        <div
          className="warn-box"
          style={{
            background: 'var(--accent-weak)',
            borderColor: 'var(--accent)',
            color: 'var(--accent)',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span>✅ 목표 달성!</span>
          <button onClick={() => updateGoal(goal.id, { status: '완료' })}>
            완료로 표시
          </button>
        </div>
      )}

      <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {p.status === '진행중' ? (
          <>
            <button onClick={() => updateGoal(goal.id, { status: '완료' })}>
              ✅ 완료로 표시
            </button>
            <button onClick={() => updateGoal(goal.id, { status: '실패' })}>
              ❌ 실패로 표시
            </button>
          </>
        ) : (
          <button onClick={() => updateGoal(goal.id, { status: '진행중' })}>
            🔄 다시 진행중으로
          </button>
        )}
      </div>

      <div className="card">
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {p.mode === '누적형' ? '현재 누적' : '현재 잔여'}
        </div>
        <div className="big-stat">{formatKRW(p.current)}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          {p.mode === '누적형'
            ? `시작 ${formatKRW(p.startAmount)} → 목표 ${formatKRW(p.target)}`
            : `시작 ${formatKRW(p.startAmount)} → 목표 ${formatKRW(p.target)} (줄이기)`}
        </div>
        <div className="progress">
          <div
            className={`fill ${p.mode === '차감형' ? 'blue' : ''}`}
            style={{ width: `${Math.min(p.ratio * 100, 100)}%` }}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
          {(p.ratio * 100).toFixed(1)}% {p.reached && '· ✅ 달성!'}
        </div>
        <hr />
        {p.status === '진행중' ? (
          <div className="grid-2">
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>월평균 순증</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {formatKRW(Math.round(p.monthlyAvg))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>예상 달성</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>
                {p.estimatedMonth ?? '—'}
                {p.delayMonths !== null && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: 12,
                      color: p.delayMonths > 0 ? 'var(--danger)' : 'var(--accent)',
                    }}
                  >
                    ({p.delayMonths > 0 ? '+' : ''}
                    {p.delayMonths}개월)
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: p.status === '완료' ? 'var(--accent)' : 'var(--danger)',
            }}
          >
            {p.status === '완료'
              ? '✅ 달성 완료 — 더 이상 추적하지 않습니다'
              : '❌ 중단된 목표 — 다시 진행중으로 되돌릴 수 있어요'}
          </div>
        )}
      </div>

      <div className="section-title">연결된 계좌</div>
      <div className="card">
        {linked.length === 0 && <div className="empty">연결된 계좌가 없어요.</div>}
        {linked.map((a) => {
          const bal = accountBalance(a.id, accounts, transactions);
          const ownerName = users.find((u) => u.id === a.ownerId)?.name;
          return (
            <div
              key={a.id}
              className="tx-row"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/account/${a.id}`)}
            >
              <div className="date">{ownerName}</div>
              <div className="cat">{a.mode}</div>
              <div className="memo">
                {a.emoji} {a.name}
              </div>
              <div className="amount positive">{formatKRW(bal)}</div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 16 }}>
        <button onClick={() => navigate('/what-if')}>🤔 이 소비가 목표에 미칠 영향</button>
      </div>

      {editOpen && <GoalEditor goalId={goal.id} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
