import { useState } from 'react';
import { useStore } from '../store';
import { GoalMode, GoalStatus } from '../types';
import { formatKRW, currentMonth, addMonths, monthDiff } from '../utils/format';
import NumericInput from './NumericInput';

export default function GoalEditor({
  goalId,
  onClose,
}: {
  goalId?: string;
  onClose: () => void;
}) {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const users = useStore((s) => s.users);
  const accounts = useStore((s) => s.accounts);
  const goal = useStore((s) =>
    goalId ? s.goals.find((g) => g.id === goalId) : null,
  );
  const addGoal = useStore((s) => s.addGoal);
  const updateGoal = useStore((s) => s.updateGoal);
  const deleteGoal = useStore((s) => s.deleteGoal);

  const me = users.find((u) => u.id === currentUserId)!;
  const hasFamily = !!me.familyGroupId;

  const [name, setName] = useState(goal?.name ?? '');
  const [emoji, setEmoji] = useState(goal?.emoji ?? '🎯');
  const [mode, setMode] = useState<GoalMode>(goal?.mode ?? '누적형');
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? '진행중');
  const [startAmount, setStartAmount] = useState<number>(goal?.startAmount ?? 0);
  const [targetAmount, setTargetAmount] = useState<number>(goal?.targetAmount ?? 0);
  const [startDate, setStartDate] = useState(goal?.startDate ?? currentMonth());
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? addMonths(currentMonth(), 12));
  const [ownerType, setOwnerType] = useState<'user' | 'family'>(
    goal?.ownerType ?? (hasFamily ? 'family' : 'user'),
  );
  const [linkedAccountIds, setLinkedAccountIds] = useState<string[]>(
    goal?.linkedAccountIds ?? [],
  );

  const myAccounts = accounts.filter((a) => a.ownerId === currentUserId);
  const familyAccounts = hasFamily
    ? accounts.filter((a) => {
        const owner = users.find((u) => u.id === a.ownerId);
        return owner?.familyGroupId === me.familyGroupId;
      })
    : myAccounts;
  const linkableAccounts = ownerType === 'family' ? familyAccounts : myAccounts;

  const toggleAccount = (id: string) => {
    setLinkedAccountIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const ownerId =
      ownerType === 'family' && me.familyGroupId ? me.familyGroupId : currentUserId;
    const payload = {
      name: name.trim(),
      emoji,
      mode,
      status,
      startAmount,
      targetAmount,
      startDate,
      targetDate,
      ownerType,
      ownerId,
      linkedAccountIds,
    };
    if (goalId) {
      updateGoal(goalId, payload);
    } else {
      addGoal(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!goalId) return;
    if (confirm(`"${name}" 목표를 삭제할까요? 계좌 연결도 해제됩니다.`)) {
      deleteGoal(goalId);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{goalId ? '목표 편집' : '새 목표'}</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <label className="field">
              <span className="label-text">이름</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 2029 아파트, 유럽 여행, 전세금"
              />
            </label>
            <label className="field">
              <span className="label-text">이모지</span>
              <input value={emoji} onChange={(e) => setEmoji(e.target.value)} />
            </label>
          </div>

          <label className="field">
            <span className="label-text">모드</span>
            <div className="radio-group">
              <label className={mode === '누적형' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={mode === '누적형'}
                  onChange={() => setMode('누적형')}
                />
                📈 누적형 (모으기)
              </label>
              <label className={mode === '차감형' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={mode === '차감형'}
                  onChange={() => setMode('차감형')}
                />
                📉 차감형 (줄이기)
              </label>
            </div>
            <div className="hint">
              {mode === '누적형'
                ? '예) 1억 모으기 · 전세금 4억 만들기'
                : '예) 대출 5천 갚기 · 여행비 500만 쓰기'}
            </div>
          </label>

          <label className="field">
            <span className="label-text">상태</span>
            <div className="radio-group">
              <label className={status === '진행중' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={status === '진행중'}
                  onChange={() => setStatus('진행중')}
                />
                🔄 진행중
              </label>
              <label className={status === '완료' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={status === '완료'}
                  onChange={() => setStatus('완료')}
                />
                ✅ 완료
              </label>
              <label className={status === '실패' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={status === '실패'}
                  onChange={() => setStatus('실패')}
                />
                ❌ 실패
              </label>
            </div>
          </label>

          <div className="grid-2">
            <label className="field">
              <span className="label-text">
                {mode === '누적형' ? '시작 금액 (현재 보유 · 기본 0)' : '시작 금액 (줄여야 할 값)'}
              </span>
              <NumericInput
                value={startAmount}
                allowNegative={false}
                onChange={setStartAmount}
              />
              {startAmount > 0 && <div className="hint">{formatKRW(startAmount)}</div>}
            </label>
            <label className="field">
              <span className="label-text">
                {mode === '누적형' ? '목표 금액 (도달 상한)' : '목표 금액 (도달 하한, 보통 0)'}
              </span>
              <NumericInput
                value={targetAmount}
                allowNegative={false}
                onChange={setTargetAmount}
              />
              {targetAmount > 0 && <div className="hint">{formatKRW(targetAmount)}</div>}
            </label>
          </div>

          {mode === '누적형' && startAmount >= targetAmount && targetAmount > 0 && (
            <div className="warn-box" style={{ marginBottom: 12 }}>
              ⚠ 누적형은 시작 금액이 목표보다 작아야 합니다.
            </div>
          )}
          {mode === '차감형' && startAmount <= targetAmount && (
            <div className="warn-box" style={{ marginBottom: 12 }}>
              ⚠ 차감형은 시작 금액이 목표보다 커야 합니다.
            </div>
          )}

          <div className="grid-2">
            <label className="field">
              <span className="label-text">시작일 (YYYY-MM)</span>
              <input
                type="month"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <div className="hint">목표 추적을 시작하는 시점</div>
            </label>
            <label className="field">
              <span className="label-text">목표 시점 (YYYY-MM)</span>
              <input
                type="month"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
              <div className="hint">
                {startDate && targetDate && `기간: ${monthDiff(startDate, targetDate)}개월`}
              </div>
            </label>
          </div>

          <label className="field">
            <span className="label-text">공유 범위</span>
            <div className="radio-group">
              <label className={ownerType === 'user' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={ownerType === 'user'}
                  onChange={() => setOwnerType('user')}
                />
                🔒 개인 (나만 보기)
              </label>
              <label
                className={ownerType === 'family' ? 'selected' : ''}
                style={{ opacity: hasFamily ? 1 : 0.4 }}
              >
                <input
                  type="radio"
                  checked={ownerType === 'family'}
                  onChange={() => hasFamily && setOwnerType('family')}
                  disabled={!hasFamily}
                />
                👥 가족 공유
              </label>
            </div>
            {!hasFamily && (
              <div className="hint">가족 그룹이 없어 공유 목표를 만들 수 없어요.</div>
            )}
          </label>

          <label className="field">
            <span className="label-text">연결 계좌</span>
            <div className="stack" style={{ gap: 4 }}>
              {linkableAccounts.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  연결 가능한 계좌가 없어요.
                </div>
              )}
              {linkableAccounts.map((a) => {
                const ownerName = users.find((u) => u.id === a.ownerId)?.name;
                const checked = linkedAccountIds.includes(a.id);
                return (
                  <label
                    key={a.id}
                    className="row"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: checked ? 'var(--accent-weak)' : 'var(--bg-hover)',
                      cursor: 'pointer',
                      gap: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAccount(a.id)}
                      style={{ width: 'auto' }}
                    />
                    <span style={{ flex: 1, fontSize: 13 }}>
                      {a.emoji} {a.name}
                      <span
                        style={{
                          color: 'var(--text-faint)',
                          fontSize: 11,
                          marginLeft: 6,
                        }}
                      >
                        · {ownerName} · {a.mode}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="hint">
              누적형 계좌를 주로 연결하세요. 연결된 계좌의 잔액 합이 목표 진행률이 됩니다.
            </div>
          </label>

          {goalId && (
            <>
              <hr />
              <button className="danger" onClick={handleDelete}>
                목표 삭제
              </button>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button onClick={onClose}>취소</button>
          <button
            className="primary"
            onClick={handleSave}
            disabled={
              !name.trim() ||
              targetAmount < 0 ||
              (mode === '누적형' && startAmount >= targetAmount) ||
              (mode === '차감형' && startAmount <= targetAmount)
            }
          >
            {goalId ? '저장' : '생성'}
          </button>
        </div>
      </div>
    </div>
  );
}
