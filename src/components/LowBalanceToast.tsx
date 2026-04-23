import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { remainingBudget, useStore } from '../store';
import { visibleAccounts } from '../utils/selectors';
import { currentMonth, formatKRW } from '../utils/format';

const DISMISS_KEY = (month: string) => `one-pie-lowbal-dismissed-${month}`;

function loadDismissed(month: string): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISS_KEY(month));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveDismissed(month: string, ids: Set<string>) {
  localStorage.setItem(DISMISS_KEY(month), JSON.stringify(Array.from(ids)));
}

export default function LowBalanceToast() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId);
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const month = currentMonth();
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed(month));

  if (!currentUserId) return null;

  const alerts = visibleAccounts(currentUserId, accounts)
    .filter((a) => {
      if (a.mode !== '차감형' || !a.lowBalanceAlert || dismissed.has(a.id)) return false;
      const notify = a.lowBalanceAlert.notify ?? 'owner';
      if (notify === 'owner' && a.ownerId !== currentUserId) return false;
      return true;
    })
    .map((a) => {
      const r = remainingBudget(a.id, month, accounts, transactions);
      if (r.allocated <= 0) return null;
      const th = a.lowBalanceAlert!;
      const pct = (r.remaining / r.allocated) * 100;
      const hitAmount = th.amount !== undefined && r.remaining <= th.amount;
      const hitPercent = th.percent !== undefined && pct <= th.percent;
      if (!hitAmount && !hitPercent) return null;
      return { account: a, remaining: r.remaining, allocated: r.allocated, pct, hitAmount, hitPercent };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (alerts.length === 0) return null;

  const dismissOne = (id: string) => {
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    saveDismissed(month, next);
  };

  return (
    <div className="alert-stack">
      {alerts.map(({ account, remaining, allocated, pct, hitAmount, hitPercent }) => {
        const th = account.lowBalanceAlert!;
        const isOver = remaining < 0;
        return (
          <div
            key={account.id}
            className={`alert-item ${isOver ? 'danger' : ''}`}
            onClick={() => navigate(`/account/${account.id}`)}
          >
            <span className="alert-icon">{isOver ? '🚨' : '⚠'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div>
                <strong>
                  {account.emoji} {account.name}
                </strong>{' '}
                — 남은 예산 <strong>{formatKRW(remaining)}</strong> / {formatKRW(allocated)} ({pct.toFixed(0)}%)
              </div>
              <div style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>
                {hitAmount && `금액 임계치(${formatKRW(th.amount!)}) 도달`}
                {hitAmount && hitPercent && ' · '}
                {hitPercent && `비율 임계치(${th.percent}%) 도달`}
              </div>
            </div>
            <button
              className="ghost alert-close"
              title="이번 달 동안 숨기기"
              onClick={(e) => {
                e.stopPropagation();
                dismissOne(account.id);
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
