import { useState } from 'react';
import { useStore } from '../store';
import { sumSpentInMonth } from '../utils/selectors';
import { formatKRW } from '../utils/format';
import { SettlementDecision } from '../types';

export default function SettlementModal({
  accountId,
  month,
  onClose,
}: {
  accountId: string;
  month: string;
  onClose: () => void;
}) {
  const account = useStore((s) => s.accounts.find((a) => a.id === accountId));
  const transactions = useStore((s) => s.transactions);
  const settle = useStore((s) => s.settle);

  const allocs = account?.budgetAllocations[month] ?? {};
  const eligible = Object.entries(allocs).filter(([cat, amt]) => {
    const spent = sumSpentInMonth(accountId, month, cat, transactions);
    return amt - spent > 0;
  });

  const [decisions, setDecisions] = useState<Record<string, SettlementDecision>>(
    () => {
      const init: Record<string, SettlementDecision> = {};
      for (const [cat] of eligible) init[cat] = { type: 'keep' };
      return init;
    },
  );

  if (!account) return null;

  const handleConfirm = () => {
    settle(accountId, month, decisions);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📅 {month} 정산 · {account.name}</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          {eligible.length === 0 && (
            <div className="empty">이월/반환할 남은 예산이 없어요.</div>
          )}
          {eligible.map(([cat, allocated]) => {
            const spent = sumSpentInMonth(accountId, month, cat, transactions);
            const remaining = allocated - spent;
            const dec = decisions[cat];
            return (
              <div key={cat} className="card" style={{ marginBottom: 8 }}>
                <div className="row between" style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 600 }}>{cat}</div>
                  <div style={{ color: 'var(--accent)' }}>
                    남은 {formatKRW(remaining)}
                  </div>
                </div>
                <div className="radio-group">
                  <label className={dec.type === 'keep' ? 'selected' : ''}>
                    <input
                      type="radio"
                      checked={dec.type === 'keep'}
                      onChange={() =>
                        setDecisions((cur) => ({ ...cur, [cat]: { type: 'keep' } }))
                      }
                    />
                    같은 카테고리 유지
                  </label>
                  <label className={dec.type === 'move' ? 'selected' : ''}>
                    <input
                      type="radio"
                      checked={dec.type === 'move'}
                      onChange={() =>
                        setDecisions((cur) => ({
                          ...cur,
                          [cat]: { type: 'move', toCategory: account.categories.find((c) => c !== cat) ?? '' },
                        }))
                      }
                    />
                    다른 카테고리로
                  </label>
                  <label className={dec.type === 'return' ? 'selected' : ''}>
                    <input
                      type="radio"
                      checked={dec.type === 'return'}
                      onChange={() =>
                        setDecisions((cur) => ({ ...cur, [cat]: { type: 'return' } }))
                      }
                    />
                    계좌로 반환
                  </label>
                </div>
                {dec.type === 'move' && (
                  <div style={{ marginTop: 8 }}>
                    <select
                      value={dec.toCategory}
                      onChange={(e) =>
                        setDecisions((cur) => ({
                          ...cur,
                          [cat]: { type: 'move', toCategory: e.target.value },
                        }))
                      }
                    >
                      {account.categories
                        .filter((c) => c !== cat)
                        .map((c) => (
                          <option key={c} value={c}>
                            → {c}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>취소</button>
          <button
            className="primary"
            onClick={handleConfirm}
            disabled={eligible.length === 0}
          >
            정산 완료
          </button>
        </div>
      </div>
    </div>
  );
}
