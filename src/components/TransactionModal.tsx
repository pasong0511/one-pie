import { useMemo, useState } from 'react';
import { useStore, remainingBudget } from '../store';
import {
  canDeleteTransaction,
  canEditTransaction,
  canWrite,
  sumSpentInMonth,
  visibleAccounts,
} from '../utils/selectors';
import { formatKRW, todayISO, monthOf } from '../utils/format';
import { formatCategoryPath } from '../utils/category';
import CategoryPickerModal from './CategoryPickerModal';
import CalculatorModal from './CalculatorModal';

export default function TransactionModal({
  defaultAccountId,
  transactionId,
  onClose,
}: {
  defaultAccountId?: string;
  transactionId?: string;
  onClose: () => void;
}) {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const taxonomy = useStore((s) => s.categoryTaxonomy);
  const addTransaction = useStore((s) => s.addTransaction);
  const updateTransaction = useStore((s) => s.updateTransaction);
  const deleteTransaction = useStore((s) => s.deleteTransaction);

  const editingTx = transactionId
    ? transactions.find((t) => t.id === transactionId)
    : undefined;
  const isEdit = !!editingTx;

  const writable = useMemo(
    () => visibleAccounts(currentUserId, accounts).filter((a) => canWrite(currentUserId, a)),
    [currentUserId, accounts],
  );

  const [accountId, setAccountId] = useState<string>(
    editingTx?.accountId ?? defaultAccountId ?? writable[0]?.id ?? '',
  );
  const acc = accounts.find((a) => a.id === accountId);
  const [kind, setKind] = useState<'expense' | 'deposit'>(
    editingTx
      ? editingTx.amount >= 0
        ? 'deposit'
        : 'expense'
      : acc?.mode === '누적형'
        ? 'deposit'
        : 'expense',
  );
  const [amount, setAmount] = useState<number>(editingTx ? Math.abs(editingTx.amount) : 0);
  const [category, setCategory] = useState<string>(editingTx?.category ?? '');
  const [date, setDate] = useState<string>(editingTx?.date ?? todayISO());
  const [memo, setMemo] = useState<string>(editingTx?.memo ?? '');
  const [source, setSource] = useState<string>(editingTx?.source ?? '');
  const [isSupplement, setIsSupplement] = useState<boolean>(editingTx?.isSupplement ?? false);
  const [showWarn, setShowWarn] = useState(false);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);

  const canEdit =
    !isEdit || (acc && editingTx ? canEditTransaction(currentUserId, acc, editingTx) : false);
  const canDelete =
    isEdit && editingTx ? canDeleteTransaction(currentUserId, editingTx) : false;

  const month = monthOf(date);
  const selectedCategory = category || '';

  let warnMsg: string | null = null;
  if (
    acc &&
    kind === 'expense' &&
    selectedCategory &&
    acc.mode === '차감형'
  ) {
    const allocated = acc.budgetAllocations[month]?.[selectedCategory] ?? 0;
    const spent = sumSpentInMonth(acc.id, month, selectedCategory, transactions);
    const remaining = allocated - spent;
    if (allocated > 0 && amount > remaining) {
      warnMsg = `${selectedCategory} 예산 ${formatKRW(amount - remaining)} 초과 (남은 ${formatKRW(remaining)} / 지출 시도 ${formatKRW(amount)})`;
    }
  }

  let lowBalInfo: string | null = null;
  const lowBalNotify = acc?.lowBalanceAlert?.notify ?? 'owner';
  const lowBalRecipient =
    lowBalNotify === 'all' || acc?.ownerId === currentUserId;
  if (
    acc &&
    kind === 'expense' &&
    acc.mode === '차감형' &&
    acc.lowBalanceAlert &&
    amount > 0 &&
    lowBalRecipient
  ) {
    const r = remainingBudget(acc.id, month, accounts, transactions);
    if (r.allocated > 0) {
      let postRemaining = r.remaining - amount;
      if (isEdit && editingTx && editingTx.amount < 0) {
        // 수정 중이면 기존 지출은 되돌린 후 새 지출 적용
        postRemaining = r.remaining + Math.abs(editingTx.amount) - amount;
      }
      const postPct = (postRemaining / r.allocated) * 100;
      const th = acc.lowBalanceAlert;
      const hitAmount = th.amount !== undefined && postRemaining <= th.amount;
      const hitPercent = th.percent !== undefined && postPct <= th.percent;
      if (hitAmount || hitPercent) {
        const parts: string[] = [];
        if (hitAmount) parts.push(`금액 임계 ${formatKRW(th.amount!)}`);
        if (hitPercent) parts.push(`비율 임계 ${th.percent}%`);
        lowBalInfo = `이 지출 후 남음: ${formatKRW(postRemaining)} (${postPct.toFixed(0)}%) — ${parts.join(' / ')} 도달`;
      }
    }
  }

  const handleSave = (force = false) => {
    if (!acc) return;
    if (warnMsg && !force && !showWarn) {
      setShowWarn(true);
      return;
    }
    const signed = kind === 'expense' ? -Math.abs(amount) : Math.abs(amount);
    const supplementFlag =
      kind === 'deposit' && acc.mode === '차감형' && isSupplement ? true : undefined;
    if (isEdit && editingTx) {
      updateTransaction(editingTx.id, {
        date,
        amount: signed,
        category: selectedCategory || undefined,
        source: source || undefined,
        memo: memo || undefined,
        isSupplement: supplementFlag,
      });
    } else {
      addTransaction({
        accountId,
        authorId: currentUserId,
        date,
        amount: signed,
        category: selectedCategory || undefined,
        source: source || undefined,
        memo: memo || undefined,
        isSupplement: supplementFlag,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editingTx) return;
    if (!confirm('이 거래를 삭제할까요?')) return;
    deleteTransaction(editingTx.id);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? '거래 수정' : '거래 추가'}</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span className="label-text">계좌</span>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              disabled={isEdit}
            >
              {writable.length === 0 && <option value="">쓰기 가능한 계좌 없음</option>}
              {writable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.name} ({a.mode} · {a.sharing})
                </option>
              ))}
            </select>
            {isEdit && (
              <div className="hint">거래가 속한 계좌는 변경할 수 없습니다.</div>
            )}
          </label>
          {isEdit && editingTx?.autoGenerated && (
            <div className="warn-box" style={{ marginBottom: 12 }}>
              ⚠ 정기입금으로 자동 생성된 거래입니다. 수정/삭제 시 기록이 달라질 수 있어요.
            </div>
          )}
          {isEdit && !canEdit && (
            <div className="warn-box" style={{ marginBottom: 12 }}>
              이 거래는 수정할 권한이 없습니다 (삭제만 가능).
            </div>
          )}

          <label className="field">
            <span className="label-text">구분</span>
            <div className="radio-group">
              <label className={kind === 'expense' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={kind === 'expense'}
                  onChange={() => {
                    setKind('expense');
                    setCategory('');
                    setShowWarn(false);
                  }}
                />
                지출
              </label>
              <label className={kind === 'deposit' ? 'selected' : ''}>
                <input
                  type="radio"
                  checked={kind === 'deposit'}
                  onChange={() => {
                    setKind('deposit');
                    setCategory('');
                    setShowWarn(false);
                  }}
                />
                입금
              </label>
            </div>
          </label>

          {kind === 'deposit' && acc?.mode === '차감형' && (
            <label className="field">
              <span className="label-text">예산 반영</span>
              <div className="row" style={{ gap: 8, alignItems: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={isSupplement}
                  onChange={(e) => setIsSupplement(e.target.checked)}
                  style={{ width: 'auto', marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: 13 }}>💰 추경 — 이 입금을 이번달 예산에 합산</div>
                  <div className="hint" style={{ marginTop: 2 }}>
                    체크 해제 시 단순 입금(이자/월급 등 기록용)으로 처리되어 예산에 반영되지 않음.
                  </div>
                </div>
              </div>
            </label>
          )}

          <label className="field">
            <span className="label-text">금액</span>
            <div className="amount-row">
              <input
                type="number"
                value={amount || ''}
                onChange={(e) => {
                  setAmount(Number(e.target.value));
                  setShowWarn(false);
                }}
              />
              <button
                type="button"
                className="calc-open-btn"
                onClick={() => setCalcOpen(true)}
                title="계산기 열기"
              >
                🧮
              </button>
            </div>
          </label>

          <label className="field">
            <span className="label-text">카테고리</span>
            <button
              type="button"
              className="cat-picker-trigger"
              onClick={() => setCatPickerOpen(true)}
            >
              {selectedCategory ? (
                <span className="cat-picker-value">
                  {formatCategoryPath(taxonomy, selectedCategory)}
                </span>
              ) : (
                <span className="cat-picker-placeholder">+ 카테고리 선택</span>
              )}
              <span className="cat-picker-chevron">›</span>
            </button>
            {acc && kind === 'expense' && selectedCategory && acc.mode === '차감형' && (
              <div className="hint" style={{ marginTop: 6 }}>
                현재 {selectedCategory} 남은 예산:{' '}
                {formatKRW(
                  (acc.budgetAllocations[month]?.[selectedCategory] ?? 0) -
                    sumSpentInMonth(acc.id, month, selectedCategory, transactions),
                )}
              </div>
            )}
          </label>

          {kind === 'deposit' && (
            <label className="field">
              <span className="label-text">출처 (선택)</span>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="월급 / 부업 / 배당 / 이체 ..."
              />
            </label>
          )}

          <label className="field">
            <span className="label-text">날짜</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>

          <label className="field">
            <span className="label-text">메모</span>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </label>

          {showWarn && warnMsg && (
            <div className="warn-box">
              ⚠ {warnMsg}
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                그대로 기록하면 초과 상태로 저장됩니다 (차단하지 않음).
              </div>
            </div>
          )}

          {lowBalInfo && (
            <div className="warn-box" style={{ marginTop: 8 }}>
              🔔 {lowBalInfo}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {isEdit && canDelete && (
            <button className="danger" onClick={handleDelete} style={{ marginRight: 'auto' }}>
              🗑 삭제
            </button>
          )}
          <button onClick={onClose}>취소</button>
          {showWarn ? (
            <button onClick={() => handleSave(true)} className="primary">
              그대로 {isEdit ? '수정' : '기록'}
            </button>
          ) : (
            <button
              onClick={() => handleSave()}
              className="primary"
              disabled={!acc || !amount || (isEdit && !canEdit)}
            >
              {isEdit ? '수정하기' : '기록하기'}
            </button>
          )}
        </div>
      </div>
      {catPickerOpen && (
        <CategoryPickerModal
          kind={kind === 'deposit' ? 'income' : 'expense'}
          value={selectedCategory || undefined}
          onSelect={(c) => {
            setCategory(c);
            setShowWarn(false);
          }}
          onClose={() => setCatPickerOpen(false)}
        />
      )}
      {calcOpen && (
        <CalculatorModal
          initialValue={amount}
          onApply={(v) => {
            setAmount(v);
            setShowWarn(false);
          }}
          onClose={() => setCalcOpen(false)}
        />
      )}
    </div>
  );
}
