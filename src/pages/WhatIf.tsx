import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, accountBalance } from '../store';
import { canWrite, visibleAccounts, goalProgress } from '../utils/selectors';
import { formatKRW, todayISO, addMonths, monthDiff } from '../utils/format';

export default function WhatIf() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const goals = useStore((s) => s.goals);
  const addTransaction = useStore((s) => s.addTransaction);

  const writable = visibleAccounts(currentUserId, accounts).filter((a) =>
    canWrite(currentUserId, a),
  );
  const [amount, setAmount] = useState<number>(2_500_000);
  const [accountId, setAccountId] = useState<string>(writable[0]?.id ?? '');
  const [memo, setMemo] = useState('노트북 구매');
  const [category, setCategory] = useState<string>('');

  const acc = accounts.find((a) => a.id === accountId);
  const linkedGoal = acc?.goalId ? goals.find((g) => g.id === acc.goalId) : null;
  const allFamilyGoals = goals.filter(
    (g) => g.ownerType === 'family' && g.linkedAccountIds.includes(accountId),
  );

  const impactedGoal = linkedGoal ?? allFamilyGoals[0];

  const before = accountId ? accountBalance(accountId, accounts, transactions) : 0;
  const after = before - amount;

  let goalBefore = 0;
  let goalAfter = 0;
  let delayMonths = 0;
  let estimatedBefore = '—';
  let estimatedAfter = '—';

  if (impactedGoal) {
    const p = goalProgress(impactedGoal, accounts, transactions);
    goalBefore = p.current;
    goalAfter = p.current - amount;
    const monthlyAvg = p.monthlyAvg > 0 ? p.monthlyAvg : 1;
    const now = todayISO().slice(0, 7);
    estimatedBefore = p.estimatedMonth ?? '—';
    if (goalAfter < impactedGoal.targetAmount) {
      const monthsNeeded = Math.ceil((impactedGoal.targetAmount - goalAfter) / monthlyAvg);
      estimatedAfter = addMonths(now, monthsNeeded);
      delayMonths = monthDiff(estimatedBefore, estimatedAfter);
    } else {
      estimatedAfter = now;
    }
  }

  const handleRecord = () => {
    if (!acc) return;
    addTransaction({
      accountId,
      authorId: currentUserId,
      date: todayISO(),
      amount: -Math.abs(amount),
      category: category || undefined,
      memo: memo || '지출',
    });
    navigate(`/account/${accountId}`);
  };

  return (
    <div>
      <button className="ghost" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
        ←
      </button>
      <h2 style={{ margin: '0 0 16px' }}>🤔 이 소비 괜찮을까?</h2>

      <div className="card">
        <label className="field">
          <span className="label-text">금액</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ fontSize: 18 }}
          />
        </label>
        <label className="field">
          <span className="label-text">지출 계좌</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            {writable.length === 0 && <option value="">기록 가능한 계좌 없음</option>}
            {writable.map((a) => (
              <option key={a.id} value={a.id}>
                {a.emoji} {a.name} ({a.mode})
              </option>
            ))}
          </select>
          {acc && (
            <div className="hint">
              현재 잔액/남은예산: {formatKRW(before)}
            </div>
          )}
        </label>
        <label className="field">
          <span className="label-text">카테고리 (선택)</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">(없음)</option>
            {acc?.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="label-text">설명</span>
          <input value={memo} onChange={(e) => setMemo(e.target.value)} />
        </label>
      </div>

      <div className="impact-box">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          📉 영향 분석
        </div>
        <div className="impact-row">
          <span>계좌 잔액</span>
          <span>
            {formatKRW(before)} → <b>{formatKRW(after)}</b>
          </span>
        </div>
        {impactedGoal && (
          <>
            <div className="impact-row">
              <span>{impactedGoal.emoji} {impactedGoal.name} 기여 자산</span>
              <span>
                {formatKRW(goalBefore)} → <b>{formatKRW(goalAfter)}</b>
              </span>
            </div>
            <div className="impact-row highlight">
              <span>목표 달성 예상</span>
              <span>
                {estimatedBefore} → {estimatedAfter}
                {delayMonths > 0 && (
                  <span style={{ marginLeft: 6, color: 'var(--danger)' }}>
                    (+{delayMonths}개월 지연)
                  </span>
                )}
              </span>
            </div>
          </>
        )}
        {!impactedGoal && (
          <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
            이 계좌는 가족 목표와 연결되지 않아 목표 영향 없음.
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
        <button onClick={() => navigate(-1)}>취소</button>
        <button className="primary" onClick={handleRecord} disabled={!acc}>
          기록하기
        </button>
      </div>
    </div>
  );
}
