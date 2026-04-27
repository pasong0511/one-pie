import { useEffect, useMemo, useRef, useState } from 'react';
import { Account, MainCategory, splitBillStatusMeta, SplitBill, Transaction, User } from '../types';
import { useStore } from '../store';
import { formatKRW } from '../utils/format';
import { formatCategoryPath } from '../utils/category';

// 거래 검색 bottom-sheet. 메모/카테고리/금액/날짜/계좌명/출처 부분 일치.
// 결과 클릭 → onPick(거래 id), 모달 닫힘.
export default function TransactionSearchModal({
  transactions,
  accounts,
  users,
  taxonomy,
  onPick,
  onClose,
}: {
  transactions: Transaction[];
  accounts: Account[];
  users: User[];
  taxonomy: MainCategory[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const splitBills: SplitBill[] = useStore((s) => s.splitBills);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return transactions
      .filter((t) => {
        const acc = accounts.find((a) => a.id === t.accountId);
        const accName = acc?.name?.toLowerCase() ?? '';
        const catLabel = t.category
          ? formatCategoryPath(taxonomy, t.category).toLowerCase()
          : '';
        const memo = t.memo?.toLowerCase() ?? '';
        const source = t.source?.toLowerCase() ?? '';
        const amountStr = String(Math.abs(t.amount));
        const kindLabel =
          t.kind === 'transfer'
            ? '이체 transfer'
            : t.kind === 'deposit'
              ? '입금 deposit'
              : t.kind === 'expense'
                ? '지출 expense'
                : '';
        return (
          memo.includes(q) ||
          catLabel.includes(q) ||
          source.includes(q) ||
          accName.includes(q) ||
          amountStr.includes(q) ||
          t.date.includes(q) ||
          kindLabel.includes(q)
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 100);
  }, [query, transactions, accounts, taxonomy]);

  const trimmed = query.trim();

  return (
    <div className="modal-backdrop sheet" onClick={onClose}>
      <div className="modal tx-search" onClick={(e) => e.stopPropagation()}>
        <div className="tx-search-header">
          <div className="tx-search-input-row">
            <span className="tx-search-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              ref={inputRef}
              className="tx-search-input"
              placeholder="메모 / 카테고리 / 금액 / 날짜 / 계좌"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="ghost tx-search-clear"
                onClick={() => setQuery('')}
                aria-label="검색어 지우기"
              >
                ✕
              </button>
            )}
          </div>
          <button className="ghost tx-search-cancel" onClick={onClose}>
            취소
          </button>
        </div>

        <div className="tx-search-body">
          {!trimmed && (
            <div className="empty" style={{ padding: 32 }}>
              검색어를 입력하세요.
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-faint)' }}>
                메모 · 카테고리 · 금액 · 날짜(YYYY-MM-DD) · 계좌명 · 출처 부분 일치
              </div>
            </div>
          )}
          {trimmed && results.length === 0 && (
            <div className="empty" style={{ padding: 32 }}>
              일치하는 거래가 없습니다.
            </div>
          )}
          {results.map((t) => {
            const acc = accounts.find((a) => a.id === t.accountId);
            const authorName = users.find((u) => u.id === t.authorId)?.name;
            const catLabel = t.category
              ? formatCategoryPath(taxonomy, t.category)
              : t.amount > 0
                ? t.source ?? '입금'
                : '미분류';
            return (
              <div
                key={t.id}
                className="tx-search-row"
                onClick={() => {
                  onPick(t.id);
                  onClose();
                }}
              >
                <div className="tx-search-row-icon">{acc?.emoji ?? '📒'}</div>
                <div className="tx-search-row-body">
                  <div className="tx-search-row-title">
                    {catLabel}
                    {t.kind === 'transfer' && t.splitRole !== 'inflow' && t.splitRole !== 'outflow' && (
                      <span className="chip" style={{ marginLeft: 6, fontSize: 10 }}>
                        ↔ 이체
                      </span>
                    )}
                    {t.splitBillId && t.splitRole && (
                      <span className="chip status-done" style={{ marginLeft: 6, fontSize: 10 }}>
                        {t.splitRole === 'inflow' ? '↩ 정산 입금' : '↪ 정산 출금'}
                      </span>
                    )}
                    {(() => {
                      const linked = splitBills.find((b) => b.txId === t.id);
                      if (!linked) return null;
                      const meta = splitBillStatusMeta(linked.status);
                      return (
                        <span
                          className={`chip ${meta.className}`}
                          style={{ marginLeft: 6, fontSize: 10 }}
                        >
                          {meta.emoji} {meta.label}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="tx-search-row-sub">
                    {t.date} · {acc?.name ?? '—'}
                    {t.memo ? ` · ${t.memo}` : ''}
                    {authorName ? ` · ${authorName}` : ''}
                  </div>
                </div>
                <div className={`tx-search-row-amt ${t.amount >= 0 ? 'pos' : 'neg'}`}>
                  {t.amount >= 0 ? '+' : ''}
                  {formatKRW(t.amount)}
                </div>
              </div>
            );
          })}
          {results.length === 100 && (
            <div className="empty" style={{ padding: 16, fontSize: 12 }}>
              상위 100건만 표시 중. 검색어를 좀 더 좁혀보세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
