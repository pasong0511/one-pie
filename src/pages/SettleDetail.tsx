import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store';
import { canWrite, visibleAccounts } from '../utils/selectors';
import { describeDebtor, splitBillStatusMeta } from '../types';
import { formatKRW } from '../utils/format';

// 정산서 상세 — 라이프사이클 액션 + 거래 묶음 표시 + 청구 메시지 공유.
export default function SettleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const bill = useStore((s) => s.splitBills.find((b) => b.id === id));
  const users = useStore((s) => s.users);
  const transactions = useStore((s) => s.transactions);
  const accounts = useStore((s) => s.accounts);
  const setStatus = useStore((s) => s.setSplitBillStatus);
  const settleBill = useStore((s) => s.settleSplitBill);
  const removeBill = useStore((s) => s.deleteSplitBill);

  // 가족 정산서: debtor 가 본인이고 status=requested 면 자동으로 seen 처리.
  useEffect(() => {
    if (
      bill &&
      bill.debtor.kind === 'user' &&
      bill.debtor.userId === currentUserId &&
      bill.status === 'requested'
    ) {
      setStatus(bill.id, 'seen');
    }
  }, [bill, currentUserId, setStatus]);

  const originTx = useMemo(
    () => (bill ? transactions.find((t) => t.id === bill.txId) : undefined),
    [bill, transactions],
  );

  const inflowTx = bill?.inflowTxId
    ? transactions.find((t) => t.id === bill.inflowTxId)
    : undefined;
  const outflowTx = bill?.outflowTxId
    ? transactions.find((t) => t.id === bill.outflowTxId)
    : undefined;

  // 정산 처리 폼 상태
  const myWritable = useMemo(
    () => visibleAccounts(currentUserId, accounts).filter((a) => canWrite(currentUserId, a)),
    [currentUserId, accounts],
  );
  const [outflowAccountId, setOutflowAccountId] = useState<string>(() => myWritable[0]?.id ?? '');
  const [inflowAccountId, setInflowAccountId] = useState<string>(() => myWritable[0]?.id ?? '');
  const [settleDate, setSettleDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  if (!bill) {
    return (
      <div className="empty">
        정산서를 찾을 수 없어요.
        <div style={{ marginTop: 8 }}>
          <button onClick={() => navigate(-1)}>뒤로</button>
        </div>
      </div>
    );
  }

  const meta = splitBillStatusMeta(bill.status);
  const debtorLabel = describeDebtor(bill.debtor, users);
  const author = users.find((u) => u.id === bill.authorId);
  const isAuthor = bill.authorId === currentUserId;
  const isDebtorMe = bill.debtor.kind === 'user' && bill.debtor.userId === currentUserId;
  const isFamily = bill.debtor.kind === 'user';

  // 정산 처리 권한:
  //  - 가족 케이스: debtor (받을 사람) — 자신의 계좌에서 출금
  //  - 외부/미분류: author (청구한 본인) — 자신의 계좌로 입금
  const isPending =
    bill.status === 'draft' || bill.status === 'requested' || bill.status === 'seen';
  const canSettle = isPending && (isFamily ? isDebtorMe : isAuthor);
  const needsAccountPick = isFamily || (!isFamily && bill.autoCreateInflowTx);
  const hasAccountChoice = myWritable.length > 0;

  // 청구 메시지
  const shareMessage = useMemo(() => {
    const lines: string[] = [];
    lines.push(`💸 정산 청구 (${author?.name ?? ''})`);
    lines.push(`받을 분: ${debtorLabel}`);
    lines.push(`금액: ${formatKRW(bill.amount)}`);
    if (originTx) {
      const acc = accounts.find((a) => a.id === originTx.accountId);
      const cat = originTx.category ?? '';
      lines.push('');
      lines.push(
        `• ${originTx.date} · ${formatKRW(Math.abs(originTx.amount))} · ${acc?.name ?? ''}${cat ? ` · ${cat}` : ''}${originTx.memo ? ` · ${originTx.memo}` : ''}`,
      );
    }
    if (bill.memo) {
      lines.push('');
      lines.push(`메모: ${bill.memo}`);
    }
    return lines.join('\n');
  }, [bill, originTx, accounts, author, debtorLabel]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text: shareMessage, title: '정산 청구' });
      } else {
        await navigator.clipboard.writeText(shareMessage);
        alert('이 기기는 시스템 공유를 지원하지 않아요. 클립보드에 복사했어요.');
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') console.error(err);
    }
  };

  const handleSettle = () => {
    if (isFamily) {
      if (!outflowAccountId) {
        alert('출금 계좌를 선택해주세요.');
        return;
      }
      settleBill(bill.id, { outflowAccountId, date: settleDate });
    } else {
      if (bill.autoCreateInflowTx && !inflowAccountId) {
        alert('받은 계좌를 선택해주세요.');
        return;
      }
      settleBill(bill.id, { inflowAccountId, date: settleDate });
    }
  };

  const handleCancel = () => {
    const reason = prompt('취소 사유 (선택)') ?? undefined;
    setStatus(bill.id, 'cancelled', { reason });
  };

  const handleReject = () => {
    const reason = prompt('반려 사유 (선택)') ?? undefined;
    setStatus(bill.id, 'rejected', { reason });
  };

  const handleDelete = () => {
    if (!confirm('이 정산서를 삭제할까요? 자동 생성된 거래도 함께 삭제됩니다.')) return;
    removeBill(bill.id);
    navigate('/settle');
  };

  return (
    <div className="settle-detail">
      <div className="settle-detail-header">
        <div className="settle-detail-title">
          <span className="settle-detail-emoji">{meta.emoji}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{formatKRW(bill.amount)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {isAuthor
                ? `${debtorLabel} 에게 청구`
                : `${author?.name ?? '?'} 에게 정산`}
            </div>
          </div>
        </div>
        <span className={`chip ${meta.className}`}>{meta.label}</span>
      </div>

      {bill.memo && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>메모</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{bill.memo}</div>
        </div>
      )}

      <div className="section-title" style={{ marginTop: 16 }}>
        대상 거래
      </div>
      <div className="card" style={{ padding: 0 }}>
        {!originTx ? (
          <div className="empty" style={{ padding: 24 }}>
            연결된 원본 거래가 없어요.
          </div>
        ) : (
          (() => {
            const acc = accounts.find((a) => a.id === originTx.accountId);
            return (
              <div
                className="settle-tx-row"
                onClick={() => navigate(`/tx/${originTx.id}`)}
              >
                <div className="settle-tx-row-icon">{acc?.emoji ?? '📒'}</div>
                <div className="settle-tx-row-body">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {originTx.category ?? (originTx.amount > 0 ? originTx.source ?? '입금' : '지출')}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {originTx.date} · {acc?.name ?? '—'}
                    {originTx.memo ? ` · ${originTx.memo}` : ''}
                  </div>
                </div>
                <div className={`settle-tx-row-amt ${originTx.amount >= 0 ? 'pos' : 'neg'}`}>
                  {originTx.amount >= 0 ? '+' : ''}
                  {formatKRW(originTx.amount)}
                </div>
              </div>
            );
          })()
        )}
      </div>

      {(inflowTx || outflowTx) && (
        <>
          <div className="section-title" style={{ marginTop: 16 }}>
            자동 생성된 정산 거래
          </div>
          <div className="card" style={{ padding: 0 }}>
            {outflowTx && (
              <div
                className="settle-tx-row"
                onClick={() => navigate(`/tx/${outflowTx.id}`)}
              >
                <div className="settle-tx-row-icon">↪</div>
                <div className="settle-tx-row-body">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>정산 출금</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {outflowTx.date} · {accounts.find((a) => a.id === outflowTx.accountId)?.name}
                  </div>
                </div>
                <div className="settle-tx-row-amt neg">{formatKRW(outflowTx.amount)}</div>
              </div>
            )}
            {inflowTx && (
              <div
                className="settle-tx-row"
                onClick={() => navigate(`/tx/${inflowTx.id}`)}
              >
                <div className="settle-tx-row-icon">↩</div>
                <div className="settle-tx-row-body">
                  <div style={{ fontSize: 14, fontWeight: 500 }}>정산 입금</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {inflowTx.date} · {accounts.find((a) => a.id === inflowTx.accountId)?.name}
                  </div>
                </div>
                <div className="settle-tx-row-amt pos">+{formatKRW(inflowTx.amount)}</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 닫힌 상태 사유 표시 */}
      {bill.status === 'cancelled' && bill.cancelledReason && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>취소 사유</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>{bill.cancelledReason}</div>
        </div>
      )}
      {bill.status === 'rejected' && (
        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>반려 사유</div>
          <div style={{ fontSize: 14, marginTop: 4 }}>
            {bill.rejectedReason || '(사유 없음)'}
          </div>
        </div>
      )}

      {/* 정산 처리 폼 — canSettle 일 때 항상 인라인으로 펼침 (별도 버튼 단계 없음) */}
      {canSettle && (
        <div className="card settle-process-card" style={{ marginTop: 16 }}>
          <div className="section-title" style={{ marginTop: 0 }}>
            ✅ 정산 처리
          </div>

          {needsAccountPick && !hasAccountChoice && (
            <div className="warn-box">
              ⚠ 쓰기 가능한 내 계좌가 없어요. 설정 → 계좌에서 먼저 만들어주세요.
            </div>
          )}

          {needsAccountPick && hasAccountChoice && (
            <label className="field">
              <span className="label-text">
                {isFamily ? '출금 계좌 (내 계좌에서 빠져나갈 돈)' : '받은 계좌 (입금될 내 계좌)'}
              </span>
              <select
                value={isFamily ? outflowAccountId : inflowAccountId}
                onChange={(e) =>
                  isFamily
                    ? setOutflowAccountId(e.target.value)
                    : setInflowAccountId(e.target.value)
                }
              >
                <option value="">계좌 선택</option>
                {myWritable.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.emoji} {a.name} ({a.mode})
                  </option>
                ))}
              </select>
              <div className="hint" style={{ marginTop: 4 }}>
                {isFamily
                  ? `여기서 -${formatKRW(bill.amount)} 가 빠지고, 청구한 사람 계좌에 +${formatKRW(bill.amount)} 가 자동 입금됩니다 (이체 한 쌍).`
                  : `+${formatKRW(bill.amount)} 입금 거래가 자동 추가됩니다.`}
              </div>
            </label>
          )}

          {!needsAccountPick && (
            <div className="hint" style={{ marginBottom: 12 }}>
              자동 거래 생성이 꺼져 있어요. 상태만 정산 완료로 바꿉니다.
            </div>
          )}

          <label className="field">
            <span className="label-text">정산 날짜</span>
            <input
              type="date"
              value={settleDate}
              onChange={(e) => setSettleDate(e.target.value)}
            />
          </label>

          <button
            className="primary"
            onClick={handleSettle}
            disabled={needsAccountPick && (!hasAccountChoice || !(isFamily ? outflowAccountId : inflowAccountId))}
            style={{ width: '100%' }}
          >
            ✅ 완료 처리
          </button>
        </div>
      )}

      {/* 보조 액션 영역 — 공유/보내기/반려/취소/삭제 */}
      <div className="settle-actions">
        {isAuthor && isPending && (
          <button onClick={handleShare}>📤 청구 메시지 공유</button>
        )}
        {isAuthor && bill.status === 'draft' && (
          <button className="primary" onClick={() => setStatus(bill.id, 'requested')}>
            보내기
          </button>
        )}
        {/* 반려 — debtor 본인이 가족 케이스에서, 미완료 상태일 때 */}
        {isFamily &&
          isDebtorMe &&
          (bill.status === 'requested' || bill.status === 'seen') && (
            <button className="ghost" onClick={handleReject}>
              🚫 반려하기
            </button>
          )}
        {/* 취소 — author 가 자신의 청구를 거둠 */}
        {isAuthor && isPending && (
          <button className="ghost" onClick={handleCancel}>
            취소
          </button>
        )}
        {isAuthor && (
          <button className="danger" onClick={handleDelete} style={{ marginLeft: 'auto' }}>
            🗑 정산서 삭제
          </button>
        )}
      </div>
    </div>
  );
}
