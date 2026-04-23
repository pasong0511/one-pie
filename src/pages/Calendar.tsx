import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { canEditTransaction, visibleAccounts } from '../utils/selectors';
import { addMonths, currentMonth, formatCompact, formatKRW, todayISO } from '../utils/format';
import { ACCOUNT_TYPE_META } from '../types';
import TransactionModal from '../components/TransactionModal';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar() {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const users = useStore((s) => s.users);

  const [cursor, setCursor] = useState<string>(currentMonth()); // 'YYYY-MM'
  const [selected, setSelected] = useState<string>(todayISO());
  const [editTx, setEditTx] = useState<string | null>(null);

  const visibleAccs = useMemo(
    () => visibleAccounts(currentUserId, accounts),
    [currentUserId, accounts],
  );
  const visibleIds = useMemo(() => new Set(visibleAccs.map((a) => a.id)), [visibleAccs]);
  const myTxs = useMemo(
    () => transactions.filter((t) => visibleIds.has(t.accountId)),
    [transactions, visibleIds],
  );

  // 이번 커서 달의 날짜별 집계
  const byDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    const prefix = cursor;
    for (const t of myTxs) {
      if (!t.date.startsWith(prefix)) continue;
      if (!map[t.date]) map[t.date] = { income: 0, expense: 0, count: 0 };
      if (t.amount > 0) map[t.date].income += t.amount;
      else map[t.date].expense += -t.amount;
      map[t.date].count++;
    }
    return map;
  }, [myTxs, cursor]);

  const grid = useMemo(() => buildGrid(cursor), [cursor]);
  const today = todayISO();

  // 선택한 날짜의 거래 목록
  const selectedTxs = useMemo(
    () =>
      myTxs
        .filter((t) => t.date === selected)
        .sort((a, b) => (b.id > a.id ? 1 : -1)),
    [myTxs, selected],
  );
  const selectedIncome = selectedTxs
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedTxs
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s - t.amount, 0);

  // 월 이동
  const prevMonth = () => setCursor(addMonths(cursor, -1));
  const nextMonth = () => setCursor(addMonths(cursor, 1));
  const jumpToday = () => {
    setCursor(currentMonth());
    setSelected(todayISO());
  };

  const cursorLabel = (() => {
    const [y, m] = cursor.split('-');
    return `${y}년 ${Number(m)}월`;
  })();

  return (
    <div>
      <h2 style={{ margin: '0 0 12px' }}>📅 달력</h2>

      {/* 상단: 달력 */}
      <div className="card cal-card">
        <div className="cal-header">
          <button className="ghost" onClick={prevMonth} aria-label="이전 달">
            ‹
          </button>
          <button className="ghost cal-title" onClick={jumpToday} title="오늘로">
            {cursorLabel}
          </button>
          <button className="ghost" onClick={nextMonth} aria-label="다음 달">
            ›
          </button>
        </div>
        <div className="cal-weekdays">
          {WEEKDAY_LABELS.map((w, i) => (
            <div
              key={w}
              className="cal-weekday"
              style={{
                color: i === 0 ? 'var(--danger)' : i === 6 ? 'var(--blue)' : 'var(--text-muted)',
              }}
            >
              {w}
            </div>
          ))}
        </div>
        <div className="cal-grid">
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} className="cal-cell empty" />;
            const day = Number(date.slice(8));
            const dow = new Date(date).getDay();
            const data = byDate[date];
            const isToday = date === today;
            const isSelected = date === selected;
            const hasIncome = data?.income > 0;
            const hasExpense = data?.expense > 0;
            return (
              <button
                key={date}
                className={`cal-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => setSelected(date)}
              >
                <span
                  className="cal-day"
                  style={
                    isSelected
                      ? undefined
                      : {
                          color:
                            dow === 0
                              ? 'var(--danger)'
                              : dow === 6
                                ? 'var(--blue)'
                                : undefined,
                        }
                  }
                >
                  {day}
                </span>
                <div className="cal-sum">
                  {hasIncome && (
                    <span className="cal-sum-pos">+{formatCompact(data.income)}</span>
                  )}
                  {hasExpense && (
                    <span className="cal-sum-neg">-{formatCompact(data.expense)}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단: 선택한 날짜의 거래 */}
      <div className="section-title" style={{ marginTop: 16 }}>
        {formatDateKo(selected)}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
          {selectedTxs.length > 0 && (
            <>
              {selectedIncome > 0 && (
                <span style={{ color: 'var(--accent)', marginRight: 8 }}>
                  +{formatKRW(selectedIncome)}
                </span>
              )}
              {selectedExpense > 0 && (
                <span style={{ color: 'var(--danger)' }}>
                  -{formatKRW(selectedExpense)}
                </span>
              )}
            </>
          )}
        </span>
      </div>

      <div className="card">
        {selectedTxs.length === 0 && (
          <div className="empty">이 날짜에 거래가 없어요.</div>
        )}
        {selectedTxs.map((t) => {
          const acc = accounts.find((a) => a.id === t.accountId);
          const authorName = users.find((u) => u.id === t.authorId)?.name;
          const typeMeta = acc ? ACCOUNT_TYPE_META[acc.type ?? '계좌'] : null;
          const editable = acc ? canEditTransaction(currentUserId, acc, t) : false;
          return (
            <div
              key={t.id}
              className="cal-tx-item"
              style={{ cursor: editable ? 'pointer' : 'default' }}
              onClick={() => editable && setEditTx(t.id)}
            >
              <div className="cal-tx-left">
                <div className="cal-tx-acc">
                  {typeMeta?.emoji} {acc?.emoji} {acc?.name ?? '—'}
                </div>
                <div className="cal-tx-meta">
                  {t.category ?? (t.amount > 0 ? t.source ?? '입금' : '지출')}
                  {t.memo ? ` · ${t.memo}` : ''}
                  {authorName ? ` · ${authorName}` : ''}
                  {t.isSupplement && (
                    <span className="chip mode-cumulative" style={{ marginLeft: 6, fontSize: 10 }}>
                      💰 추경
                    </span>
                  )}
                </div>
              </div>
              <div className={`cal-tx-amt ${t.amount >= 0 ? 'pos' : 'neg'}`}>
                {t.amount >= 0 ? '+' : ''}
                {formatKRW(t.amount)}
              </div>
            </div>
          );
        })}
      </div>

      {editTx && (
        <TransactionModal
          transactionId={editTx}
          onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}

function buildGrid(ym: string): (string | null)[] {
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const startDay = first.getDay(); // 0=일 ... 6=토
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${ym}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function formatDateKo(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dow = WEEKDAY_LABELS[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dow})`;
}
