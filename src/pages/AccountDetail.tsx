import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore, remainingBudget, cumulativeBalance } from '../store';
import {
  canDeleteTransaction,
  canEditTransaction,
  canView,
  canWrite,
  goalProgress,
  sumInflowInMonth,
  sumSpentInMonth,
} from '../utils/selectors';
import { formatKRW, currentMonth } from '../utils/format';
import TransactionModal from '../components/TransactionModal';
import PropertyPanel from '../components/PropertyPanel';
import SettlementModal from '../components/SettlementModal';
import { ACCOUNT_TYPE_META } from '../types';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const account = useStore((s) => s.accounts.find((a) => a.id === id));
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const users = useStore((s) => s.users);
  const goals = useStore((s) => s.goals);
  const [txOpen, setTxOpen] = useState<{ txId?: string } | null>(null);
  const [propOpen, setPropOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const month = currentMonth();

  if (!account) {
    return (
      <div className="empty">
        계좌를 찾을 수 없어요. <button onClick={() => navigate('/')}>대시보드로</button>
      </div>
    );
  }

  if (!canView(currentUserId, account)) {
    return (
      <div className="empty">
        이 계좌는 볼 수 없습니다 (private).
        <div>
          <button onClick={() => navigate('/')}>대시보드로</button>
        </div>
      </div>
    );
  }

  const writable = canWrite(currentUserId, account);
  const linkedGoal = goals.find((g) => g.id === account.goalId);
  const txList = transactions
    .filter((t) => t.accountId === account.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 50);

  return (
    <div>
      <div className="row between" style={{ marginBottom: 8 }}>
        <button className="ghost" onClick={() => navigate('/')}>
          ← 대시보드
        </button>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setPropOpen(true)}>⚙ 속성</button>
        </div>
      </div>

      <h2 style={{ margin: '0 0 4px' }}>
        {account.emoji ?? '📒'} {account.name}
      </h2>
      <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
        <span className="chip" style={{ marginRight: 4 }}>
          {ACCOUNT_TYPE_META[account.type ?? '계좌'].emoji} {ACCOUNT_TYPE_META[account.type ?? '계좌'].label}
        </span>
        <span
          className={`chip mode-${account.mode === '누적형' ? 'cumulative' : 'deductive'}`}
          style={{ marginRight: 4 }}
        >
          {account.mode}
        </span>
        <span
          className={`chip sharing-${
            account.sharing === 'private' ? 'private' : account.sharing === 'shared-rw' ? 'rw' : 'r'
          }`}
        >
          {account.sharing}
        </span>
        <span style={{ marginLeft: 8 }}>· 소유: {users.find((u) => u.id === account.ownerId)?.name}</span>
      </div>

      {account.mode === '차감형' ? (
        <DeductiveSummary
          accountId={account.id}
          month={month}
          accounts={accounts}
          transactions={transactions}
          onSettle={() => setSettleOpen(true)}
          settlementDay={account.settlementReminder?.dayOfMonth}
        />
      ) : (
        <CumulativeSummary
          account={account}
          accounts={accounts}
          transactions={transactions}
          goalName={linkedGoal?.name}
          goalTarget={linkedGoal?.targetAmount}
        />
      )}

      <div className="section-title" style={{ marginTop: 24 }}>
        카테고리
      </div>
      <div className="card">
        {account.categories.length === 0 && (
          <div style={{ color: 'var(--text-faint)' }}>카테고리가 없습니다. 속성에서 추가하세요.</div>
        )}
        {account.categories.map((cat) => {
          const allocated = account.budgetAllocations[month]?.[cat] ?? 0;
          const spent = sumSpentInMonth(account.id, month, cat, transactions);
          const inflow = sumInflowInMonth(account.id, month, cat, transactions);
          if (account.mode === '차감형') {
            const pct = allocated > 0 ? spent / allocated : 0;
            const fillClass = pct > 1 ? 'danger' : pct > 0.8 ? 'warn' : '';
            return (
              <div key={cat} className="category-row">
                <div>{cat}</div>
                <div>
                  {allocated > 0 ? (
                    <div className="progress">
                      <div
                        className={`fill ${fillClass}`}
                        style={{ width: `${Math.min(pct * 100, 100)}%` }}
                      />
                    </div>
                  ) : (
                    <span style={{ color: 'var(--text-faint)', fontSize: 12 }}>미배정</span>
                  )}
                </div>
                <div className="meta">
                  {formatKRW(spent)} / {formatKRW(allocated)}
                </div>
              </div>
            );
          }
          // 누적형: 카테고리별 입금 합
          return (
            <div key={cat} className="category-row">
              <div>{cat}</div>
              <div></div>
              <div className="meta">+{formatKRW(inflow)}</div>
            </div>
          );
        })}
      </div>

      <div className="section-title">최근 거래</div>
      <div className="card">
        {txList.length === 0 && <div className="empty">거래가 없어요.</div>}
        {txList.map((t) => {
          const authorName = users.find((u) => u.id === t.authorId)?.name ?? '—';
          const editable = canEditTransaction(currentUserId, account, t);
          const deletable = canDeleteTransaction(currentUserId, t);
          const clickable = editable || deletable;
          return (
            <div
              key={t.id}
              className="tx-row"
              onClick={clickable ? () => setTxOpen({ txId: t.id }) : undefined}
              style={clickable ? { cursor: 'pointer' } : undefined}
              title={clickable ? '클릭하여 수정/삭제' : undefined}
            >
              <div className="date">{t.date.slice(5)}</div>
              <div className="cat">{t.category ?? (t.amount > 0 ? t.source ?? '입금' : '-')}</div>
              <div className="memo">
                {t.memo ?? (t.autoGenerated ? `정기입금 (${t.source ?? ''})` : '')}
                {t.isSupplement && (
                  <span
                    className="chip mode-cumulative"
                    style={{ marginLeft: 6, fontSize: 10 }}
                  >
                    💰 추경
                  </span>
                )}
                <span className="author" style={{ marginLeft: 8 }}>· {authorName}</span>
              </div>
              <div className={`amount ${t.amount >= 0 ? 'positive' : 'negative'}`}>
                {t.amount >= 0 ? '+' : ''}
                {formatKRW(t.amount)}
              </div>
            </div>
          );
        })}
      </div>

      {writable && (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button
            className="primary"
            onClick={() => setTxOpen({})}
          >
            + 거래 기록
          </button>
        </div>
      )}
      {!writable && (
        <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: 12 }}>
          👁 읽기 전용 계좌입니다.
        </div>
      )}

      {txOpen && (
        <TransactionModal
          defaultAccountId={account.id}
          transactionId={txOpen.txId}
          onClose={() => setTxOpen(null)}
        />
      )}
      {propOpen && <PropertyPanel accountId={account.id} onClose={() => setPropOpen(false)} />}
      {settleOpen && (
        <SettlementModal
          accountId={account.id}
          month={month}
          onClose={() => setSettleOpen(false)}
        />
      )}
    </div>
  );
}

function DeductiveSummary({
  accountId,
  month,
  accounts,
  transactions,
  onSettle,
  settlementDay,
}: {
  accountId: string;
  month: string;
  accounts: any[];
  transactions: any[];
  onSettle: () => void;
  settlementDay?: number;
}) {
  const r = remainingBudget(accountId, month, accounts, transactions);
  const initSpent = Math.min(r.spent, r.initialAllocated);
  const overflowSpent = Math.max(0, r.spent - r.initialAllocated);
  const pctInit = r.initialAllocated > 0 ? initSpent / r.initialAllocated : 0;
  const pctSupp = r.supplemented > 0 ? Math.min(overflowSpent / r.supplemented, 1) : 0;
  const initFull = r.spent >= r.initialAllocated && r.initialAllocated > 0;
  const suppExceeded = overflowSpent > r.supplemented;
  return (
    <div className="card">
      <div className="grid-2">
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>총 예산</div>
          <div className="big-stat muted">{formatKRW(r.allocated)}</div>
          {r.supplemented > 0 && (
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>
              초기 {formatKRW(r.initialAllocated)} + 추경 {formatKRW(r.supplemented)}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>남음</div>
          <div className="big-stat" style={{ color: r.remaining < 0 ? 'var(--danger)' : 'var(--accent)' }}>
            {formatKRW(r.remaining)}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginBottom: 4,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>
            📋 초기배정 {formatKRW(r.initialAllocated)}
          </span>
          <span>
            사용 {formatKRW(initSpent)} · {Math.round(pctInit * 100)}%
          </span>
        </div>
        <div className="progress">
          <div
            className={`fill ${initFull ? 'danger' : pctInit > 0.8 ? 'warn' : ''}`}
            style={{ width: `${Math.min(pctInit * 100, 100)}%` }}
          />
        </div>
      </div>

      {r.supplemented > 0 && (
        <div style={{ marginTop: 10 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginBottom: 4,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <span>💰 추경 {formatKRW(r.supplemented)}</span>
            <span>
              사용 {formatKRW(Math.min(overflowSpent, r.supplemented))}
              {suppExceeded && ` (초과 ${formatKRW(overflowSpent - r.supplemented)})`}
            </span>
          </div>
          <div className="progress">
            <div
              className={`fill blue ${suppExceeded ? 'danger' : ''}`}
              style={{ width: `${pctSupp * 100}%` }}
            />
          </div>
        </div>
      )}

      {r.regularInflow > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 10 }}>
          💵 일반 입금 {formatKRW(r.regularInflow)} (예산 미반영, 기록용)
        </div>
      )}
      <hr />
      <div className="row between">
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          📅 정산일: {settlementDay ? `매월 ${settlementDay === 31 ? '말일' : settlementDay + '일'}` : '없음'}
        </div>
        <button onClick={onSettle}>정산하기</button>
      </div>
    </div>
  );
}

function CumulativeSummary({
  account,
  accounts,
  transactions,
  goalName,
  goalTarget,
}: {
  account: any;
  accounts: any[];
  transactions: any[];
  goalName?: string;
  goalTarget?: number;
}) {
  const bal = cumulativeBalance(account.id, accounts, transactions);
  const pct = goalTarget ? bal / goalTarget : 0;
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>현재</div>
      <div className="big-stat">{formatKRW(bal)}</div>
      {goalName && goalTarget && (
        <>
          <div className="progress" style={{ marginTop: 12 }}>
            <div
              className="fill blue"
              style={{ width: `${Math.min(pct * 100, 100)}%` }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            목표: {goalName} · {formatKRW(goalTarget)} ({Math.round(pct * 100)}%)
          </div>
        </>
      )}
    </div>
  );
}
