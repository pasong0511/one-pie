import { useNavigate } from 'react-router-dom';
import { useStore, remainingBudget, cumulativeBalance } from '../store';
import { visibleAccounts, visibleGoals, goalProgress } from '../utils/selectors';
import { formatKRW, currentMonth } from '../utils/format';
import { Account, ACCOUNT_TYPE_META } from '../types';
import { useState } from 'react';
import WhatIfButton from '../components/WhatIfButton';
import MonthNavigator from '../components/MonthNavigator';

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const goals = useStore((s) => s.goals);
  const users = useStore((s) => s.users);
  const [goalFilter, setGoalFilter] = useState<'all' | 'private' | 'family'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | '진행중' | '완료' | '실패'>('all');
  const [month, setMonth] = useState<string>(currentMonth());

  const visible = visibleAccounts(currentUserId, accounts);
  const my = visible.filter((a) => a.ownerId === currentUserId);
  const shared = visible.filter((a) => a.ownerId !== currentUserId);

  const allMyGoals = visibleGoals(currentUserId, goals, users);
  const privateCount = allMyGoals.filter((g) => g.ownerType === 'user').length;
  const familyCount = allMyGoals.filter((g) => g.ownerType === 'family').length;
  const ongoingCount = allMyGoals.filter((g) => (g.status ?? '진행중') === '진행중').length;
  const doneCount = allMyGoals.filter((g) => g.status === '완료').length;
  const failedCount = allMyGoals.filter((g) => g.status === '실패').length;
  const byOwner =
    goalFilter === 'all'
      ? allMyGoals
      : goalFilter === 'private'
        ? allMyGoals.filter((g) => g.ownerType === 'user')
        : allMyGoals.filter((g) => g.ownerType === 'family');
  const myGoals =
    statusFilter === 'all'
      ? byOwner
      : byOwner.filter((g) => (g.status ?? '진행중') === statusFilter);

  return (
    <div>
      <div className="section-title">목표</div>
      {allMyGoals.length > 0 && (
        <div
          className="row"
          style={{ gap: 4, marginBottom: 8, flexWrap: 'wrap' }}
        >
          <button
            className={goalFilter === 'all' ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setGoalFilter('all')}
          >
            전체 ({allMyGoals.length})
          </button>
          <button
            className={goalFilter === 'private' ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setGoalFilter('private')}
          >
            🔒 나만 보기 ({privateCount})
          </button>
          <button
            className={goalFilter === 'family' ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setGoalFilter('family')}
          >
            👥 공유 ({familyCount})
          </button>
        </div>
      )}
      {allMyGoals.length > 0 && (
        <div
          className="row"
          style={{ gap: 4, marginBottom: 8, flexWrap: 'wrap' }}
        >
          <button
            className={statusFilter === 'all' ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setStatusFilter('all')}
          >
            전체 ({allMyGoals.length})
          </button>
          <button
            className={statusFilter === '진행중' ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setStatusFilter('진행중')}
          >
            🔄 진행중 ({ongoingCount})
          </button>
          <button
            className={statusFilter === '완료' ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setStatusFilter('완료')}
          >
            ✅ 완료 ({doneCount})
          </button>
          <button
            className={statusFilter === '실패' ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setStatusFilter('실패')}
          >
            ❌ 실패 ({failedCount})
          </button>
        </div>
      )}
      {allMyGoals.length === 0 && (
        <div className="empty">
          아직 목표가 없어요. 설정 → 목표에서 만들어보세요.
        </div>
      )}
      {allMyGoals.length > 0 && myGoals.length === 0 && (
        <div className="empty">
          이 필터에 해당하는 목표가 없어요.
        </div>
      )}
      {myGoals.length > 0 && (
        <>
          {myGoals.map((g) => {
            const p = goalProgress(g, accounts, transactions);
            return (
              <div
                key={g.id}
                className="goal-banner card hover"
                onClick={() => navigate(`/goal/${g.id}`)}
                style={{
                  marginBottom: 8,
                  opacity: p.status === '진행중' ? 1 : 0.65,
                }}
              >
                <div className="row between" style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    {g.emoji ?? '🎯'} {g.name}
                    <span
                      className={`chip mode-${p.mode === '누적형' ? 'cumulative' : 'deductive'}`}
                      style={{ marginLeft: 6 }}
                    >
                      {p.mode === '누적형' ? '📈 누적' : '📉 차감'}
                    </span>
                    <span
                      className={`chip ${
                        g.ownerType === 'family' ? 'sharing-rw' : 'sharing-private'
                      }`}
                      style={{ marginLeft: 4 }}
                    >
                      {g.ownerType === 'family' ? '👥 공유' : '🔒 개인'}
                    </span>
                    <span
                      className={`chip status-${p.status === '진행중' ? 'ongoing' : p.status === '완료' ? 'done' : 'failed'}`}
                      style={{ marginLeft: 4 }}
                    >
                      {p.status === '진행중' ? '🔄 진행중' : p.status === '완료' ? '✅ 완료' : '❌ 실패'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                    {g.startDate ? `${g.startDate} ~ ${g.targetDate}` : `목표 ${g.targetDate}`}
                  </div>
                </div>
                <div className="progress" style={{ marginBottom: 8 }}>
                  <div
                    className={`fill ${p.mode === '차감형' ? 'blue' : ''}`}
                    style={{ width: `${Math.min(p.ratio * 100, 100)}%` }}
                  />
                </div>
                <div className="row between">
                  <div>
                    <span className="big-stat">{formatKRW(p.current)}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                      {p.mode === '누적형'
                        ? ` / ${formatKRW(p.target)}`
                        : ` → ${formatKRW(p.target)}`}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {p.status === '진행중' ? (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          예상 달성
                        </div>
                        <div style={{ fontWeight: 600 }}>
                          {p.estimatedMonth ?? '—'}
                          {p.delayMonths !== null && (
                            <span
                              style={{
                                marginLeft: 4,
                                fontSize: 11,
                                color:
                                  p.delayMonths > 0 ? 'var(--danger)' : 'var(--accent)',
                              }}
                            >
                              ({p.delayMonths > 0 ? '+' : ''}
                              {p.delayMonths}개월)
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          상태
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            color:
                              p.status === '완료' ? 'var(--accent)' : 'var(--danger)',
                          }}
                        >
                          {p.status === '완료' ? '✅ 달성 완료' : '❌ 중단'}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}

      <div className="section-title" style={{ marginTop: 32 }}>계좌</div>
      <MonthNavigator month={month} onChange={setMonth} />
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          fontWeight: 600,
          margin: '4px 0 6px',
        }}
      >
        내 계좌
      </div>
      {my.length === 0 && <div className="empty">아직 계좌가 없어요.</div>}
      {my.map((a) => (
        <AccountCard
          key={a.id}
          account={a}
          month={month}
          onClick={() => navigate(`/account/${a.id}`, { state: { month } })}
          accounts={accounts}
          transactions={transactions}
        />
      ))}

      {shared.length > 0 && (
        <>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              fontWeight: 600,
              margin: '16px 0 6px',
            }}
          >
            공유받은 계좌
          </div>
          {shared.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              month={month}
              onClick={() => navigate(`/account/${a.id}`, { state: { month } })}
              accounts={accounts}
              transactions={transactions}
              sharedFromLabel
            />
          ))}
        </>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
        <WhatIfButton />
      </div>
    </div>
  );
}

function AccountCard({
  account,
  month,
  onClick,
  accounts,
  transactions,
  sharedFromLabel,
}: {
  account: Account;
  month: string;
  onClick: () => void;
  accounts: Account[];
  transactions: any[];
  sharedFromLabel?: boolean;
}) {
  const users = useStore((s) => s.users);
  const goals = useStore((s) => s.goals);
  const ownerName = users.find((u) => u.id === account.ownerId)?.name ?? '';

  let balanceLine: React.ReactNode = null;

  if (account.mode === '차감형') {
    const r = remainingBudget(account.id, month, accounts, transactions);
    const initSpent = Math.min(r.spent, r.initialAllocated);
    const overflowSpent = Math.max(0, r.spent - r.initialAllocated);
    const pctInit = r.initialAllocated > 0 ? initSpent / r.initialAllocated : 0;
    const pctSupp = r.supplemented > 0 ? Math.min(overflowSpent / r.supplemented, 1) : 0;
    const initFull = r.spent >= r.initialAllocated && r.initialAllocated > 0;
    const suppExceeded = overflowSpent > r.supplemented;
    balanceLine = (
      <>
        <div className="row between">
          <div>
            <span className="big-stat">{formatKRW(r.remaining)}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
              남음 / 예산 {formatKRW(r.allocated)}
              {r.supplemented > 0 && ` (추경 +${formatKRW(r.supplemented)})`}
            </span>
          </div>
        </div>
        {r.initialAllocated > 0 && (
          <div className="progress" style={{ marginTop: 8 }}>
            <div
              className={`fill ${initFull ? 'danger' : pctInit > 0.8 ? 'warn' : ''}`}
              style={{ width: `${Math.min(pctInit * 100, 100)}%` }}
            />
          </div>
        )}
        {r.supplemented > 0 && (
          <div className="progress" style={{ marginTop: 4 }}>
            <div
              className={`fill blue ${suppExceeded ? 'danger' : ''}`}
              style={{ width: `${pctSupp * 100}%` }}
            />
          </div>
        )}
      </>
    );
  } else {
    const bal = cumulativeBalance(account.id, accounts, transactions);
    const linkedGoal = goals.find((g) => g.id === account.goalId);
    balanceLine = (
      <div className="row between">
        <div>
          <span className="big-stat">{formatKRW(bal)}</span>
          {linkedGoal && (
            <span style={{ color: 'var(--text-muted)', marginLeft: 8, fontSize: 12 }}>
              → {linkedGoal.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card hover" onClick={onClick} style={{ marginBottom: 8 }}>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>
          {account.emoji ?? '📒'} {account.name}
          {sharedFromLabel && (
            <span style={{ color: 'var(--text-faint)', fontWeight: 400, marginLeft: 6, fontSize: 12 }}>
              · {ownerName}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span className="chip">
            {ACCOUNT_TYPE_META[account.type ?? '계좌'].emoji} {ACCOUNT_TYPE_META[account.type ?? '계좌'].label}
          </span>
          <span
            className={`chip mode-${account.mode === '누적형' ? 'cumulative' : 'deductive'}`}
          >
            {account.mode}
          </span>
          <span
            className={`chip sharing-${
              account.sharing === 'private' ? 'private' : account.sharing === 'shared-rw' ? 'rw' : 'r'
            }`}
          >
            {account.sharing === 'private' ? '🔒 private' :
              account.sharing === 'shared-rw' ? '🔗 rw' : '👁 r-only'}
          </span>
        </div>
      </div>
      {balanceLine}
    </div>
  );
}
