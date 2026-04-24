import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import RecurringRuleModal from '../../components/RecurringRuleModal';
import { formatKRW } from '../../utils/format';
import { RECURRING_INTERVAL_META } from '../../types';

export default function SettingsRecurring() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const recurringRules = useStore((s) => s.recurringRules);
  const materialize = useStore((s) => s.materializeRecurringRules);
  const [ruleEditing, setRuleEditing] = useState<{ id?: string } | null>(null);

  const myRules = recurringRules.filter((r) => r.ownerId === currentUserId);

  return (
    <div>
      <button className="ghost" onClick={() => navigate('/settings')} style={{ marginBottom: 8 }}>
        ← 설정
      </button>
      <div className="row between" style={{ margin: '0 0 16px' }}>
        <h2 style={{ margin: 0 }}>반복 거래</h2>
        <button className="ghost" onClick={() => setRuleEditing({})}>
          + 새 반복 규칙
        </button>
      </div>

      {myRules.length === 0 && (
        <div className="empty">
          반복 규칙이 없어요. 월급, 구독료 등 주기적으로 기록되는 거래를 자동화하세요.
        </div>
      )}
      {myRules.map((r) => {
        const a = accounts.find((x) => x.id === r.accountId);
        const signed = r.kind === 'expense' ? -r.amount : r.amount;
        return (
          <div key={r.id} className="card" style={{ marginBottom: 8 }}>
            <div className="row between">
              <div>
                <div style={{ fontWeight: 600 }}>
                  {r.kind === 'expense' ? '📤 지출' : '📥 입금'} {formatKRW(signed)}
                  {!r.enabled && (
                    <span
                      className="chip"
                      style={{ marginLeft: 6, background: 'var(--bg-hover)' }}
                    >
                      ⏸ 일시중지
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  {a ? `${a.emoji} ${a.name}` : '계좌 없음'} ·{' '}
                  {RECURRING_INTERVAL_META[r.interval].label} · {r.startDate}
                  {r.endDate ? ` ~ ${r.endDate}` : ' ~ 무기한'}
                  {r.category ? ` · ${r.category}` : ''}
                </div>
                {r.memo && (
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                    {r.memo}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setRuleEditing({ id: r.id })}>편집</button>
              </div>
            </div>
          </div>
        );
      })}
      {myRules.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <button
            className="ghost"
            onClick={() => {
              const n = materialize();
              alert(n > 0 ? `${n}건의 거래를 자동 생성했습니다.` : '새로 생성할 거래가 없습니다.');
            }}
          >
            🔄 지금 적용하기
          </button>
        </div>
      )}

      {ruleEditing && (
        <RecurringRuleModal
          ruleId={ruleEditing.id}
          onClose={() => setRuleEditing(null)}
        />
      )}
    </div>
  );
}
