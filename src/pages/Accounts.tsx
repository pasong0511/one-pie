import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, remainingBudget, cumulativeBalance } from '../store';
import { visibleAccounts } from '../utils/selectors';
import { formatKRW, currentMonth } from '../utils/format';
import { Account, ACCOUNT_TYPE_META } from '../types';
import MonthNavigator from '../components/MonthNavigator';

export default function Accounts() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const [month, setMonth] = useState<string>(currentMonth());

  const visible = visibleAccounts(currentUserId, accounts);
  const my = visible.filter((a) => a.ownerId === currentUserId);
  const shared = visible.filter((a) => a.ownerId !== currentUserId);

  return (
    <div>
      <div className="section-title">계좌</div>
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
