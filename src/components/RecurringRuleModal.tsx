import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { RECURRING_INTERVAL_META, RecurringInterval, RecurringRule } from '../types';
import { canWrite, visibleAccounts } from '../utils/selectors';
import { todayISO } from '../utils/format';
import { formatCategoryPath } from '../utils/category';
import CategoryPickerModal from './CategoryPickerModal';
import NumericInput from './NumericInput';

const INTERVAL_ORDER: RecurringInterval[] = [
  'daily',
  'weekdays',
  'weekends',
  'weekly',
  'biweekly',
  'every4weeks',
  'monthly',
  'every2months',
  'every3months',
  'every4months',
  'every5months',
  'every6months',
  'yearly',
];

export default function RecurringRuleModal({
  ruleId,
  onClose,
}: {
  ruleId?: string;
  onClose: () => void;
}) {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const rules = useStore((s) => s.recurringRules);
  const taxonomy = useStore((s) => s.categoryTaxonomy);
  const addRule = useStore((s) => s.addRecurringRule);
  const updateRule = useStore((s) => s.updateRecurringRule);
  const deleteRule = useStore((s) => s.deleteRecurringRule);
  const materialize = useStore((s) => s.materializeRecurringRules);

  const editing = ruleId ? rules.find((r) => r.id === ruleId) : undefined;
  const isEdit = !!editing;

  const writable = useMemo(
    () => visibleAccounts(currentUserId, accounts).filter((a) => canWrite(currentUserId, a)),
    [currentUserId, accounts],
  );

  const [accountId, setAccountId] = useState<string>(
    editing?.accountId ?? writable[0]?.id ?? '',
  );
  const acc = accounts.find((a) => a.id === accountId);
  const [kind, setKind] = useState<'expense' | 'deposit'>(
    editing?.kind ?? (acc?.mode === '누적형' ? 'deposit' : 'expense'),
  );
  const [amount, setAmount] = useState<number>(editing?.amount ?? 0);
  const [interval, setInterval] = useState<RecurringInterval>(editing?.interval ?? 'monthly');
  const [startDate, setStartDate] = useState<string>(editing?.startDate ?? todayISO());
  const [endDate, setEndDate] = useState<string>(editing?.endDate ?? '');
  const [category, setCategory] = useState<string>(editing?.category ?? '');
  const [source, setSource] = useState<string>(editing?.source ?? '');
  const [memo, setMemo] = useState<string>(editing?.memo ?? '');
  const [isSupplement, setIsSupplement] = useState<boolean>(editing?.isSupplement ?? false);
  const [enabled, setEnabled] = useState<boolean>(editing?.enabled ?? true);

  const selectedCategory = category || '';
  const [catPickerOpen, setCatPickerOpen] = useState(false);

  const validEnd = !endDate || endDate >= startDate;

  const handleSave = () => {
    if (!acc || !amount || !validEnd) return;
    const patch: Omit<RecurringRule, 'id' | 'createdAt' | 'lastRunDate'> = {
      ownerId: currentUserId,
      accountId,
      kind,
      amount: Math.abs(amount),
      interval,
      startDate,
      endDate: endDate || undefined,
      category: selectedCategory || undefined,
      source: source || undefined,
      memo: memo || undefined,
      isSupplement:
        kind === 'deposit' && acc.mode === '차감형' && isSupplement ? true : undefined,
      enabled,
    };
    if (isEdit && editing) {
      updateRule(editing.id, patch);
    } else {
      addRule(patch);
    }
    // 저장 직후 즉시 적용
    materialize();
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    const removeGenerated = confirm(
      '이 반복 규칙을 삭제합니다.\n\n[확인] 지금까지 자동 생성된 거래도 함께 삭제\n[취소] 거래는 남기고 규칙만 삭제',
    );
    deleteRule(editing.id, removeGenerated);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? '반복 규칙 수정' : '반복 규칙 추가'}</h3>
          <button className="ghost" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body">
          <label className="field">
            <span className="label-text">계좌</span>
            <select
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                const a = accounts.find((x) => x.id === e.target.value);
                if (a && kind === 'expense' && a.mode === '누적형') {
                  setKind('deposit');
                  setCategory('');
                }
              }}
            >
              {writable.length === 0 && <option value="">쓰기 가능한 계좌 없음</option>}
              {writable.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.emoji} {a.name} ({a.mode})
                </option>
              ))}
            </select>
          </label>

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
                <div style={{ fontSize: 13 }}>
                  💰 추경 — 각 발생 건을 그 달 예산에 합산
                </div>
              </div>
            </label>
          )}

          <label className="field">
            <span className="label-text">금액</span>
            <NumericInput
              value={amount}
              allowNegative={false}
              onChange={setAmount}
            />
          </label>

          <label className="field">
            <span className="label-text">반복 주기</span>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value as RecurringInterval)}
            >
              {INTERVAL_ORDER.map((iv) => (
                <option key={iv} value={iv}>
                  {RECURRING_INTERVAL_META[iv].label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="label-text">시작일</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="label-text">종료일 (선택, 비우면 무기한)</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {!validEnd && (
              <div className="hint" style={{ color: 'var(--danger)' }}>
                종료일은 시작일 이후여야 합니다.
              </div>
            )}
          </label>

          <label className="field">
            <span className="label-text">카테고리 (선택)</span>
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
          </label>

          {kind === 'deposit' && (
            <label className="field">
              <span className="label-text">출처 (선택)</span>
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="월급 / 부업 / 배당 ..."
              />
            </label>
          )}

          <label className="field">
            <span className="label-text">메모</span>
            <input value={memo} onChange={(e) => setMemo(e.target.value)} />
          </label>

          <label className="field">
            <div className="row" style={{ gap: 8, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span style={{ fontSize: 13 }}>규칙 활성화 (체크 해제 시 자동 생성 중단)</span>
            </div>
          </label>
        </div>
        <div className="modal-footer">
          {isEdit && (
            <button className="danger" onClick={handleDelete} style={{ marginRight: 'auto' }}>
              🗑 삭제
            </button>
          )}
          <button onClick={onClose}>취소</button>
          <button
            className="primary"
            onClick={handleSave}
            disabled={!acc || !amount || !validEnd}
          >
            {isEdit ? '수정' : '추가'}
          </button>
        </div>
      </div>
      {catPickerOpen && (
        <CategoryPickerModal
          kind={kind === 'deposit' ? 'income' : 'expense'}
          value={selectedCategory || undefined}
          onSelect={setCategory}
          onClose={() => setCatPickerOpen(false)}
        />
      )}
    </div>
  );
}
