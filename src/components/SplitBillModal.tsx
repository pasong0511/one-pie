import { useEffect, useState } from 'react';
import { SplitDebtor, User } from '../types';
import { formatKRW } from '../utils/format';
import NumericInput from './NumericInput';

// 정산서 작성/편집용 모달.
// - debtor (가족 / 외부인 / 미분류) + amount + memo + autoCreateInflowTx 토글
// - apply 시 부모에 draft 데이터 전달. 부모가 store 액션으로 SplitBill 생성/갱신.
export type SplitBillDraft = {
  debtor: SplitDebtor;
  amount: number;
  memo?: string;
  autoCreateInflowTx?: boolean;
};

type Props = {
  // 거래 절대 금액 (default amount)
  totalAmount: number;
  // 가족 그룹의 다른 멤버 (본인 제외, 비어있을 수 있음)
  familyMembers: User[];
  initial?: SplitBillDraft;
  // 청구 해제 (= 기존 정산서 삭제) 가능 여부 — 편집 모드에서만 노출
  canRemove?: boolean;
  onApply: (draft: SplitBillDraft) => void;
  onRemove?: () => void;
  onClose: () => void;
};

type DebtorTab = 'user' | 'external' | 'memo';

export default function SplitBillModal({
  totalAmount,
  familyMembers,
  initial,
  canRemove,
  onApply,
  onRemove,
  onClose,
}: Props) {
  const [tab, setTab] = useState<DebtorTab>(initial?.debtor.kind ?? (familyMembers.length > 0 ? 'user' : 'external'));
  const [userId, setUserId] = useState<string>(
    initial?.debtor.kind === 'user' ? initial.debtor.userId : familyMembers[0]?.id ?? '',
  );
  const [externalName, setExternalName] = useState<string>(
    initial?.debtor.kind === 'external' ? initial.debtor.name : '',
  );
  const [externalContact, setExternalContact] = useState<string>(
    initial?.debtor.kind === 'external' ? initial.debtor.contact ?? '' : '',
  );
  const [memoLabel, setMemoLabel] = useState<string>(
    initial?.debtor.kind === 'memo' ? initial.debtor.label ?? '' : '',
  );
  const [amount, setAmount] = useState<number>(initial?.amount ?? Math.abs(totalAmount));
  const [memo, setMemo] = useState<string>(initial?.memo ?? '');
  const [autoCreate, setAutoCreate] = useState<boolean>(initial?.autoCreateInflowTx ?? true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const debtor: SplitDebtor =
    tab === 'user'
      ? { kind: 'user', userId }
      : tab === 'external'
        ? { kind: 'external', name: externalName.trim(), contact: externalContact.trim() || undefined }
        : { kind: 'memo', label: memoLabel.trim() || undefined };

  const debtorValid =
    (tab === 'user' && !!userId) ||
    (tab === 'external' && externalName.trim().length > 0) ||
    tab === 'memo';

  const amountValid = amount > 0 && amount <= Math.abs(totalAmount);
  const canSubmit = debtorValid && amountValid;

  const handleApply = () => {
    if (!canSubmit) return;
    onApply({
      debtor,
      amount,
      memo: memo.trim() || undefined,
      autoCreateInflowTx: tab === 'user' ? undefined : autoCreate,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop sheet" onClick={onClose}>
      <div className="modal split-bill-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cat-picker-header">
          <button className="ghost" onClick={onClose} aria-label="닫기">
            ✕
          </button>
          <h3 style={{ margin: 0 }}>🤝 정산하기</h3>
          <div style={{ width: 36 }} />
        </div>

        <div className="split-bill-body">
          {/* debtor 종류 탭 */}
          <div className="page-subtitle" style={{ margin: '0 0 8px' }}>
            누구에게 청구할까요?
          </div>
          <div className="split-debtor-tabs">
            <button
              type="button"
              className={`split-debtor-tab ${tab === 'user' ? 'on' : ''}`}
              onClick={() => setTab('user')}
              disabled={familyMembers.length === 0}
              title={familyMembers.length === 0 ? '가족 그룹에 다른 멤버가 없어요' : undefined}
            >
              👨‍👩‍👧 가족
            </button>
            <button
              type="button"
              className={`split-debtor-tab ${tab === 'external' ? 'on' : ''}`}
              onClick={() => setTab('external')}
            >
              🧑 외부인
            </button>
            <button
              type="button"
              className={`split-debtor-tab ${tab === 'memo' ? 'on' : ''}`}
              onClick={() => setTab('memo')}
            >
              📝 미분류
            </button>
          </div>

          {tab === 'user' && (
            <div className="split-member-row" style={{ marginTop: 10 }}>
              {familyMembers.length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                  가족 그룹에 다른 멤버가 없어요. 외부인 / 미분류로 청구하세요.
                </span>
              )}
              {familyMembers.map((u) => (
                <button
                  type="button"
                  key={u.id}
                  className={`split-member-chip ${userId === u.id ? 'on' : ''}`}
                  onClick={() => setUserId(u.id)}
                >
                  <span>{u.emoji ?? '👤'}</span>
                  <span>{u.name}</span>
                </button>
              ))}
            </div>
          )}

          {tab === 'external' && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                placeholder="이름 (예: 친구 이름)"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
              />
              <input
                placeholder="연락처 / 메모 (선택)"
                value={externalContact}
                onChange={(e) => setExternalContact(e.target.value)}
              />
            </div>
          )}

          {tab === 'memo' && (
            <div style={{ marginTop: 10 }}>
              <input
                placeholder="라벨 (선택, 예: 회식 정산)"
                value={memoLabel}
                onChange={(e) => setMemoLabel(e.target.value)}
              />
              <div className="hint" style={{ marginTop: 6 }}>
                받을 사람이 없거나 단순 기록용으로 쓰는 모드. 정산 추적만 하고 받기 처리는 직접.
              </div>
            </div>
          )}

          {/* 청구액 */}
          <div className="page-subtitle" style={{ margin: '16px 0 6px' }}>
            청구 금액
          </div>
          <NumericInput value={amount} allowNegative={false} onChange={setAmount} />
          <div className="hint" style={{ marginTop: 4 }}>
            거래 금액 {formatKRW(Math.abs(totalAmount))} 이내. 일부만 청구해도 됩니다.
          </div>
          {!amountValid && (
            <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>
              ⚠ 0원보다 크고 거래 금액을 넘지 않아야 해요.
            </div>
          )}

          {/* 메모 */}
          <div className="page-subtitle" style={{ margin: '16px 0 6px' }}>
            메모 (선택)
          </div>
          <input
            placeholder="청구 사유 / 메시지에 들어갈 내용"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />

          {/* 자동 입금 거래 토글 — 외부/미분류만 의미 */}
          {tab !== 'user' && (
            <div className="split-settle-box" style={{ marginTop: 16 }}>
              <label className="row" style={{ gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={autoCreate}
                  onChange={(e) => setAutoCreate(e.target.checked)}
                  style={{ width: 'auto', marginTop: 3 }}
                />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>받으면 자동으로 입금 거래 추가</div>
                  <div className="hint" style={{ marginTop: 2 }}>
                    체크 시 정산 완료 처리할 때 본인 계좌에 +{formatKRW(amount)} 입금이 자동 기록됩니다.
                    단순 기록용이면 끄세요.
                  </div>
                </div>
              </label>
            </div>
          )}
          {tab === 'user' && (
            <div className="split-settle-box" style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              가족 케이스는 정산 완료 시 양쪽 계좌에 ↔ 이체 거래 한 쌍이 자동 생성됩니다.
            </div>
          )}
        </div>

        <div className="modal-footer">
          {canRemove && onRemove && (
            <button
              className="ghost"
              onClick={() => {
                onRemove();
                onClose();
              }}
              style={{ marginRight: 'auto' }}
            >
              정산서 삭제
            </button>
          )}
          <button onClick={onClose}>취소</button>
          <button className="primary" onClick={handleApply} disabled={!canSubmit}>
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
