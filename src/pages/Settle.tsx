import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { describeDebtor, splitBillStatusMeta, SplitBill } from '../types';
import { formatKRW } from '../utils/format';

// 정산 통합 뷰 — 받을 정산 / 보낼 정산 / 완료 탭.
// 받을: 본인이 청구한 정산서 (authorId === me) 중 미완료
// 보낼: 본인이 받을 입장인 가족 정산서 (debtor.kind=user && userId === me) 중 미완료
// 완료: settled / cancelled 모두
export default function Settle() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const splitBills = useStore((s) => s.splitBills);
  const users = useStore((s) => s.users);
  const transactions = useStore((s) => s.transactions);
  const accounts = useStore((s) => s.accounts);

  const [tab, setTab] = useState<'receive' | 'pay' | 'done'>('receive');

  const buckets = useMemo(() => {
    const receive: SplitBill[] = [];
    const pay: SplitBill[] = [];
    const done: SplitBill[] = [];
    for (const b of splitBills) {
      const isDone =
        b.status === 'settled' || b.status === 'cancelled' || b.status === 'rejected';
      if (isDone) {
        if (b.authorId === currentUserId) done.push(b);
        else if (b.debtor.kind === 'user' && b.debtor.userId === currentUserId) done.push(b);
        continue;
      }
      if (b.authorId === currentUserId) {
        receive.push(b);
      } else if (b.debtor.kind === 'user' && b.debtor.userId === currentUserId) {
        pay.push(b);
      }
    }
    return { receive, pay, done };
  }, [splitBills, currentUserId]);

  const list = tab === 'receive' ? buckets.receive : tab === 'pay' ? buckets.pay : buckets.done;
  const totals = {
    receive: buckets.receive.reduce((s, b) => s + b.amount, 0),
    pay: buckets.pay.reduce((s, b) => s + b.amount, 0),
  };

  return (
    <div>
      <div className="settle-tabs">
        <button
          type="button"
          className={`settle-tab ${tab === 'receive' ? 'active' : ''}`}
          onClick={() => setTab('receive')}
        >
          받을 정산
          <span className="settle-tab-count">{buckets.receive.length}</span>
        </button>
        <button
          type="button"
          className={`settle-tab ${tab === 'pay' ? 'active' : ''}`}
          onClick={() => setTab('pay')}
        >
          보낼 정산
          <span className="settle-tab-count">{buckets.pay.length}</span>
        </button>
        <button
          type="button"
          className={`settle-tab ${tab === 'done' ? 'active' : ''}`}
          onClick={() => setTab('done')}
        >
          완료
          <span className="settle-tab-count">{buckets.done.length}</span>
        </button>
      </div>

      {tab === 'receive' && buckets.receive.length > 0 && (
        <div className="settle-summary">
          받을 합계 <strong>{formatKRW(totals.receive)}</strong>
        </div>
      )}
      {tab === 'pay' && buckets.pay.length > 0 && (
        <div className="settle-summary">
          보낼 합계 <strong>{formatKRW(totals.pay)}</strong>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {list.length === 0 && (
          <div className="empty" style={{ padding: 32 }}>
            {tab === 'receive'
              ? '받을 정산이 없어요.'
              : tab === 'pay'
                ? '보낼 정산이 없어요.'
                : '완료된 정산이 없어요.'}
          </div>
        )}
        {list.map((b) => {
          const meta = splitBillStatusMeta(b.status);
          const debtorLabel = describeDebtor(b.debtor, users);
          const author = users.find((u) => u.id === b.authorId);
          const tx = transactions.find((t) => t.id === b.txId);
          const acc = tx ? accounts.find((a) => a.id === tx.accountId) : undefined;
          const dateLabel = tx?.date ?? '';
          const isReceiver = b.authorId === currentUserId;
          return (
            <div
              key={b.id}
              className="settle-row"
              onClick={() => navigate(`/settle/${b.id}`)}
            >
              <div className="settle-row-icon">{meta.emoji}</div>
              <div className="settle-row-body">
                <div className="settle-row-title">
                  {isReceiver
                    ? `${debtorLabel} 에게 청구`
                    : `${author?.name ?? '?'} 에게 정산`}
                  <span className={`chip ${meta.className}`} style={{ marginLeft: 6, fontSize: 10 }}>
                    {meta.label}
                  </span>
                </div>
                <div className="settle-row-sub">
                  {dateLabel}
                  {acc ? ` · ${acc.name}` : ''}
                  {tx?.category ? ` · ${tx.category}` : ''}
                  {b.memo ? ` · ${b.memo}` : ''}
                </div>
              </div>
              <div className={`settle-row-amt ${isReceiver ? 'pos' : 'neg'}`}>
                {isReceiver ? '+' : '-'}
                {formatKRW(b.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
