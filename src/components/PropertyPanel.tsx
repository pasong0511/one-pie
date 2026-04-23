import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import {
  ACCOUNT_TYPES,
  ACCOUNT_TYPE_META,
  AccountMode,
  AccountType,
  EditPolicy,
  Sharing,
} from '../types';
import { addMonths, formatKRW, currentMonth } from '../utils/format';
import { uid } from '../utils/id';
import CategoryChips from './CategoryChips';
import CategoryManagerModal from './CategoryManagerModal';

export default function PropertyPanel({
  accountId,
  month: monthProp,
  onClose,
}: {
  accountId: string;
  month?: string;          // 편집 대상 월 (기본: 현재 달)
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const account = useStore((s) => s.accounts.find((a) => a.id === accountId));
  const users = useStore((s) => s.users);
  const goals = useStore((s) => s.goals);
  const updateAccount = useStore((s) => s.updateAccount);
  const deleteAccount = useStore((s) => s.deleteAccount);
  const updateGoal = useStore((s) => s.updateGoal);
  const setAllocation = useStore((s) => s.setAllocation);

  const [name, setName] = useState(account?.name ?? '');
  const [emoji, setEmoji] = useState(account?.emoji ?? '📒');
  const [mode, setMode] = useState<AccountMode>(account?.mode ?? '차감형');
  const [accountType, setAccountType] = useState<AccountType>(account?.type ?? '계좌');
  const [sharing, setSharing] = useState<Sharing>(account?.sharing ?? 'private');
  const [sharedWith, setSharedWith] = useState<string[]>(account?.sharedWith ?? []);
  const [editPolicy, setEditPolicy] = useState<EditPolicy>(account?.editPolicy ?? 'author-only');
  const [goalId, setGoalId] = useState<string>(account?.goalId ?? '');
  const [recurring, setRecurring] = useState(account?.recurringDeposits ?? []);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [newDay, setNewDay] = useState<number>(1);
  const [newAmt, setNewAmt] = useState<number>(0);
  const [newSource, setNewSource] = useState<string>('월급');
  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    account?.settlementReminder?.enabled ?? false,
  );
  const [reminderDay, setReminderDay] = useState<number>(
    account?.settlementReminder?.dayOfMonth ?? 31,
  );
  const [alertAmount, setAlertAmount] = useState<number>(
    account?.lowBalanceAlert?.amount ?? 0,
  );
  const [alertPercent, setAlertPercent] = useState<number>(
    account?.lowBalanceAlert?.percent ?? 0,
  );
  const [alertNotify, setAlertNotify] = useState<'owner' | 'all'>(
    account?.lowBalanceAlert?.notify ?? 'owner',
  );
  const month = monthProp ?? currentMonth();
  const [allocs, setAllocs] = useState<Record<string, number>>(
    account?.budgetAllocations[month] ?? {},
  );
  const [monthlyBudget, setMonthlyBudget] = useState<number>(
    account?.monthlyBudget?.[month] ?? 0,
  );
  const [catManagerOpen, setCatManagerOpen] = useState(false);

  // account.categories가 외부(모달)에서 변경되면 allocs 키도 동기화
  const catsKey = (account?.categories ?? []).join('|');
  useEffect(() => {
    if (!account) return;
    setAllocs((cur) => {
      const next: Record<string, number> = {};
      for (const cat of account.categories) {
        next[cat] = cat in cur ? cur[cat] : account.budgetAllocations[month]?.[cat] ?? 0;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catsKey, month]);

  if (!account) {
    return null;
  }

  const otherUsers = users.filter((u) => u.id !== account.ownerId);

  const handleSave = () => {
    const hasAlert = alertAmount > 0 || alertPercent > 0;
    updateAccount(accountId, {
      name,
      emoji,
      type: accountType,
      mode,
      sharing,
      sharedWith: sharing === 'private' ? [] : sharedWith,
      editPolicy,
      goalId: goalId || undefined,
      recurringDeposits: recurring,
      settlementReminder: { dayOfMonth: reminderDay, enabled: reminderEnabled },
      lowBalanceAlert: hasAlert
        ? {
            amount: alertAmount > 0 ? alertAmount : undefined,
            percent: alertPercent > 0 ? alertPercent : undefined,
            notify: alertNotify,
          }
        : undefined,
      monthlyBudget:
        mode === '차감형' && monthlyBudget > 0
          ? { ...(account.monthlyBudget ?? {}), [month]: monthlyBudget }
          : (() => {
              // 차감형 아님 or 0 입력 → 해당 월만 제거
              if (!account.monthlyBudget) return undefined;
              const next = { ...account.monthlyBudget };
              delete next[month];
              return Object.keys(next).length > 0 ? next : undefined;
            })(),
    });
    // sync goal's linkedAccountIds
    if (goalId) {
      const g = goals.find((x) => x.id === goalId);
      if (g && !g.linkedAccountIds.includes(accountId)) {
        updateGoal(goalId, { linkedAccountIds: [...g.linkedAccountIds, accountId] });
      }
    }
    // 예산 배정 업데이트
    for (const [cat, amt] of Object.entries(allocs)) {
      setAllocation(accountId, month, cat, amt);
    }
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`${account.name} 계좌를 삭제할까요? 이 계좌의 모든 거래도 함께 삭제됩니다.`)) {
      deleteAccount(accountId);
      onClose();
      navigate('/');
    }
  };


  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>속성 · {account.name}</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <label className="field">
              <span className="label-text">이름</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span className="label-text">이모지</span>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </label>
          </div>

          <label className="field">
            <span className="label-text">종류</span>
            <div className="radio-group">
              {ACCOUNT_TYPES.map((t) => {
                const meta = ACCOUNT_TYPE_META[t];
                return (
                  <label key={t} className={accountType === t ? 'selected' : ''}>
                    <input
                      type="radio"
                      checked={accountType === t}
                      onChange={() => setAccountType(t)}
                    />
                    {meta.emoji} {meta.label}
                  </label>
                );
              })}
            </div>
            <div className="hint">{ACCOUNT_TYPE_META[accountType].hint}</div>
          </label>

          <label className="field">
            <span className="label-text">mode</span>
            <div className="radio-group">
              <label className={mode === '차감형' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={mode === '차감형'}
                  onChange={() => setMode('차감형')}
                />
                차감형 (이번달 용돈/생활비)
              </label>
              <label className={mode === '누적형' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={mode === '누적형'}
                  onChange={() => setMode('누적형')}
                />
                누적형 (목표 저축)
              </label>
            </div>
          </label>

          <label className="field">
            <span className="label-text">공유</span>
            <div className="radio-group">
              <label className={sharing === 'private' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={sharing === 'private'}
                  onChange={() => setSharing('private')}
                />
                🔒 private
              </label>
              <label className={sharing === 'shared-r' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={sharing === 'shared-r'}
                  onChange={() => setSharing('shared-r')}
                />
                👁 shared-r
              </label>
              <label className={sharing === 'shared-rw' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={sharing === 'shared-rw'}
                  onChange={() => setSharing('shared-rw')}
                />
                🔗 shared-rw
              </label>
            </div>
          </label>

          {sharing !== 'private' && otherUsers.length > 0 && (
            <label className="field">
              <span className="label-text">공유 대상</span>
              <div className="radio-group">
                {otherUsers.map((u) => (
                  <label
                    key={u.id}
                    className={sharedWith.includes(u.id) ? 'selected' : ''}
                  >
                    <input
                      type="checkbox"
                      checked={sharedWith.includes(u.id)}
                      onChange={() =>
                        setSharedWith((cur) =>
                          cur.includes(u.id)
                            ? cur.filter((x) => x !== u.id)
                            : [...cur, u.id],
                        )
                      }
                    />
                    {u.emoji} {u.name}
                  </label>
                ))}
              </div>
            </label>
          )}

          {sharing === 'shared-rw' && (
            <label className="field">
              <span className="label-text">수정 권한 (삭제는 항상 작성자만)</span>
              <div className="radio-group">
                <label className={editPolicy === 'author-only' ? 'selected' : ''}>
                  <input
                    type="radio"
                    checked={editPolicy === 'author-only'}
                    onChange={() => setEditPolicy('author-only')}
                  />
                  작성자만
                </label>
                <label className={editPolicy === 'any-sharer' ? 'selected' : ''}>
                  <input
                    type="radio"
                    checked={editPolicy === 'any-sharer'}
                    onChange={() => setEditPolicy('any-sharer')}
                  />
                  공유자 누구나
                </label>
              </div>
            </label>
          )}

          <label className="field">
            <span className="label-text">목표 연결</span>
            <select value={goalId} onChange={(e) => setGoalId(e.target.value)}>
              <option value="">없음</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.emoji} {g.name} ({formatKRW(g.targetAmount)})
                </option>
              ))}
            </select>
          </label>

          {mode === '차감형' && (() => {
            const prevMonth = addMonths(month, -1);
            const prevTotal = account?.monthlyBudget?.[prevMonth] ?? 0;
            const prevAllocs = account?.budgetAllocations[prevMonth] ?? {};
            const prevAllocSum = Object.values(prevAllocs).reduce((s, v) => s + v, 0);
            const currentEmpty =
              monthlyBudget === 0 &&
              Object.values(allocs).reduce((s, v) => s + v, 0) === 0;
            const canCopy = currentEmpty && (prevTotal > 0 || prevAllocSum > 0);
            const copyFromPrev = () => {
              if (prevTotal > 0) setMonthlyBudget(prevTotal);
              if (prevAllocSum > 0) setAllocs({ ...prevAllocs });
            };
            return (
              <label className="field">
                <div className="cat-field-header">
                  <span className="label-text">{month} 예산</span>
                  {canCopy && (
                    <button
                      type="button"
                      className="cat-gear"
                      onClick={copyFromPrev}
                      title={`${prevMonth} 설정 복사`}
                    >
                      📋 {prevMonth} 복사
                    </button>
                  )}
                </div>
                <div className="row">
                  <input
                    type="number"
                    value={monthlyBudget || ''}
                    placeholder="예: 500000"
                    onChange={(e) => setMonthlyBudget(Number(e.target.value) || 0)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>원</span>
                </div>
                <div className="hint">
                  이 계좌의 {month} 총 예산. 카테고리 배정합(
                  {formatKRW(Object.values(allocs).reduce((s, v) => s + v, 0))})
                  과 별개로 "덩어리 예산"을 지정. 비워두면 카테고리 합이 초기배정이 됩니다.
                </div>
              </label>
            );
          })()}

          <label className="field">
            <div className="cat-field-header">
              <span className="label-text">카테고리</span>
              <button
                type="button"
                className="cat-gear"
                onClick={() => setCatManagerOpen(true)}
                title="카테고리 추가/수정/삭제"
              >
                ⚙ 설정
              </button>
            </div>
            <CategoryChips
              categories={account.categories}
              subtext={
                mode === '차감형'
                  ? (c) => {
                      const v = allocs[c] ?? 0;
                      return v > 0 ? formatKRW(v) : null;
                    }
                  : undefined
              }
            />
            {mode === '차감형' && account.categories.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  이번달({month}) 카테고리별 배정
                </div>
                <div className="stack">
                  {account.categories.map((c) => (
                    <div key={c} className="row">
                      <span style={{ flex: 1, fontSize: 13 }}>· {c}</span>
                      <input
                        type="number"
                        style={{ width: 160 }}
                        placeholder="0"
                        value={allocs[c] || ''}
                        onChange={(e) =>
                          setAllocs((cur) => ({
                            ...cur,
                            [c]: Number(e.target.value) || 0,
                          }))
                        }
                      />
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>원</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </label>

          <label className="field">
            <span className="label-text">정기입금 (선택)</span>
            <div className="stack">
              {recurring.length === 0 && !showRecurringForm && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  정기입금 없음 — 필요할 때만 추가하세요. (예: 매달 월급, 배당 이체 등)
                </div>
              )}
              {recurring.map((r) => (
                <div key={r.id} className="row">
                  <span style={{ flex: 1, fontSize: 13 }}>
                    · 매월 {r.dayOfMonth}일 +{formatKRW(r.amount)} ({r.source})
                  </span>
                  <button
                    className="ghost"
                    onClick={() =>
                      setRecurring((cur) => cur.filter((x) => x.id !== r.id))
                    }
                  >
                    삭제
                  </button>
                </div>
              ))}
              {!showRecurringForm ? (
                <button
                  className="ghost"
                  style={{ alignSelf: 'flex-start', fontSize: 12 }}
                  onClick={() => setShowRecurringForm(true)}
                >
                  + 정기입금 추가
                </button>
              ) : (
                <div
                  className="row"
                  style={{ padding: 8, background: 'var(--bg-hover)', borderRadius: 6 }}
                >
                  <input
                    type="number"
                    style={{ width: 60 }}
                    value={newDay}
                    min={1}
                    max={31}
                    onChange={(e) => setNewDay(Number(e.target.value))}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>일</span>
                  <input
                    type="number"
                    style={{ width: 140 }}
                    value={newAmt || ''}
                    placeholder="금액"
                    onChange={(e) => setNewAmt(Number(e.target.value))}
                  />
                  <input
                    style={{ width: 120 }}
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    placeholder="출처"
                  />
                  <button
                    className="primary"
                    onClick={() => {
                      if (newAmt > 0) {
                        setRecurring([
                          ...recurring,
                          {
                            id: uid('r'),
                            interval: 'monthly',
                            dayOfMonth: newDay,
                            amount: newAmt,
                            source: newSource,
                          },
                        ]);
                        setNewAmt(0);
                        setShowRecurringForm(false);
                      }
                    }}
                  >
                    추가
                  </button>
                  <button
                    className="ghost"
                    onClick={() => {
                      setShowRecurringForm(false);
                      setNewAmt(0);
                    }}
                  >
                    취소
                  </button>
                </div>
              )}
            </div>
          </label>

          <label className="field">
            <span className="label-text">📅 정산 알림</span>
            <div className="row">
              <label className="row" style={{ gap: 4 }}>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  style={{ width: 'auto' }}
                />
                <span>활성화</span>
              </label>
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>매월</span>
              <input
                type="number"
                min={1}
                max={31}
                value={reminderDay}
                onChange={(e) => setReminderDay(Number(e.target.value))}
                style={{ width: 80 }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>일 (31=말일)</span>
            </div>
          </label>

          {mode === '차감형' && (
            <label className="field">
              <span className="label-text">🔔 잔액 임계 알림</span>
              <div className="row" style={{ flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>금액 ≤</span>
                <input
                  type="number"
                  style={{ width: 140 }}
                  value={alertAmount || ''}
                  placeholder="미설정"
                  onChange={(e) => setAlertAmount(Number(e.target.value) || 0)}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>원</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                  또는 비율 ≤
                </span>
                <input
                  type="number"
                  style={{ width: 80 }}
                  min={0}
                  max={100}
                  value={alertPercent || ''}
                  placeholder="미설정"
                  onChange={(e) => setAlertPercent(Number(e.target.value) || 0)}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>%</span>
              </div>
              {(alertAmount > 0 || alertPercent > 0) && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    누구에게 알림을 보낼까요?
                  </div>
                  <div className="radio-group">
                    <label className={alertNotify === 'owner' ? 'selected' : ''}>
                      <input
                        type="radio"
                        checked={alertNotify === 'owner'}
                        onChange={() => setAlertNotify('owner')}
                      />
                      🔒 본인만
                    </label>
                    <label className={alertNotify === 'all' ? 'selected' : ''}>
                      <input
                        type="radio"
                        checked={alertNotify === 'all'}
                        onChange={() => setAlertNotify('all')}
                      />
                      👥 공유받은 사용자 모두
                    </label>
                  </div>
                </div>
              )}
              <div className="hint">
                배정 대비 남은 예산이 임계치 이하로 떨어지면 대시보드에 토스트 알림이 뜹니다.
                둘 중 하나만, 또는 둘 다 설정 가능 (둘 다 설정 시 "둘 중 하나라도 도달"하면 알림).
                0이면 미설정. {sharing === 'private' && '(현재 private 계좌라 본인만 받습니다.)'}
              </div>
            </label>
          )}

          <hr />
          <button className="danger" onClick={handleDelete}>
            계좌 삭제
          </button>
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
      {catManagerOpen && (
        <CategoryManagerModal
          accountId={accountId}
          onClose={() => setCatManagerOpen(false)}
        />
      )}
    </div>
  );
}
