import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { canEditTransaction, visibleAccounts } from '../utils/selectors';
import { currentMonth, formatCompact, formatKRW, todayISO } from '../utils/format';
import { Account, ACCOUNT_TYPE_META, MainCategory, Transaction, User } from '../types';
import { formatCategoryPath } from '../utils/category';
import TransactionModal from '../components/TransactionModal';
import MonthNavigator from '../components/MonthNavigator';
import { usePageRuntime } from '../stores/runtime';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type ViewMode = 'list' | 'calendar';

export default function Calendar() {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const users = useStore((s) => s.users);
  const taxonomy = useStore((s) => s.categoryTaxonomy);
  const filterAccountIds = usePageRuntime((s) => s.txFilterAccountIds);

  const [cursor, setCursor] = useState<string>(currentMonth()); // 'YYYY-MM'
  const [selected, setSelected] = useState<string>(todayISO());
  const [editTx, setEditTx] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const visibleAccs = useMemo(
    () => visibleAccounts(currentUserId, accounts),
    [currentUserId, accounts],
  );
  const visibleIds = useMemo(() => new Set(visibleAccs.map((a) => a.id)), [visibleAccs]);
  // 헤더 필터: 빈 배열이면 전체, 아니면 선택된 계좌만
  const filterSet = useMemo(() => new Set(filterAccountIds), [filterAccountIds]);
  const myTxs = useMemo(
    () =>
      transactions.filter(
        (t) =>
          visibleIds.has(t.accountId) &&
          (filterSet.size === 0 || filterSet.has(t.accountId)),
      ),
    [transactions, visibleIds, filterSet],
  );

  // 이번 달 거래만
  const monthTxs = useMemo(
    () => myTxs.filter((t) => t.date.startsWith(cursor)),
    [myTxs, cursor],
  );

  // 달력 모드용 날짜별 집계
  const byDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    for (const t of monthTxs) {
      if (!map[t.date]) map[t.date] = { income: 0, expense: 0, count: 0 };
      if (t.amount > 0) map[t.date].income += t.amount;
      else map[t.date].expense += -t.amount;
      map[t.date].count++;
    }
    return map;
  }, [monthTxs]);

  const grid = useMemo(() => buildGrid(cursor), [cursor]);
  const today = todayISO();

  // 선택한 날짜의 거래 목록 (달력 모드)
  const selectedTxs = useMemo(
    () =>
      monthTxs
        .filter((t) => t.date === selected)
        .sort((a, b) => (b.id > a.id ? 1 : -1)),
    [monthTxs, selected],
  );
  const selectedIncome = selectedTxs
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedTxs
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s - t.amount, 0);

  // 리스트 모드용 — 날짜 내림차순 그룹
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const t of monthTxs) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, txs]) => ({
        date,
        txs: txs.sort((a, b) => (a.id < b.id ? 1 : -1)),
        income: txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
        expense: txs
          .filter((t) => t.amount < 0)
          .reduce((s, t) => s + Math.abs(t.amount), 0),
      }));
  }, [monthTxs]);


  return (
    <div>
      {/* 상단: 월 네비 (다른 페이지와 동일) */}
      <MonthNavigator
        month={cursor}
        onChange={(m) => {
          setCursor(m);
          if (m === currentMonth()) setSelected(todayISO());
        }}
      />

      {/* 보기 전환 토글 */}
      <div className="cal-view-toggle">
        <button
          type="button"
          className={`cal-view-tab ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          ☰ 목록
        </button>
        <button
          type="button"
          className={`cal-view-tab ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          📅 달력
        </button>
      </div>

      {viewMode === 'list' && (
        <ListView
          groups={groupedByDate}
          taxonomy={taxonomy}
          accounts={accounts}
          users={users}
          currentUserId={currentUserId}
          today={today}
          onEdit={setEditTx}
        />
      )}

      {viewMode === 'calendar' && (
        <CalendarView
          cursor={cursor}
          grid={grid}
          byDate={byDate}
          today={today}
          selected={selected}
          onSelectDate={setSelected}
          selectedTxs={selectedTxs}
          selectedIncome={selectedIncome}
          selectedExpense={selectedExpense}
          accounts={accounts}
          users={users}
          currentUserId={currentUserId}
          onEdit={setEditTx}
        />
      )}

      {editTx && (
        <TransactionModal
          transactionId={editTx}
          onClose={() => setEditTx(null)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 리스트 뷰: 날짜별 그룹 헤더 + 거래 행 (뱅크샐러드 가계부 스타일)
// ────────────────────────────────────────────────────────────────────────
function ListView(props: {
  groups: { date: string; txs: Transaction[]; income: number; expense: number }[];
  taxonomy: MainCategory[];
  accounts: Account[];
  users: User[];
  currentUserId: string;
  today: string;
  onEdit: (id: string) => void;
}) {
  const { groups, taxonomy, accounts, users, currentUserId, today, onEdit } = props;

  if (groups.length === 0) {
    return <div className="empty" style={{ padding: 32 }}>이번 달 거래가 없어요.</div>;
  }

  return (
    <div>
      {groups.map((g) => (
        <div key={g.date} className="cal-list-group">
          <div className="cal-list-date-header">
            <div className="cal-list-date-label">{formatDayHeader(g.date, today)}</div>
            <div className="cal-list-date-totals">
              {g.income > 0 && (
                <span className="cal-list-total pos">+{formatKRW(g.income)}</span>
              )}
              {g.expense > 0 && (
                <span className="cal-list-total neg">-{formatKRW(g.expense)}</span>
              )}
            </div>
          </div>
          <div className="card cal-list-card">
            {g.txs.map((t) => {
              const acc = accounts.find((a) => a.id === t.accountId);
              const authorName = users.find((u) => u.id === t.authorId)?.name;
              const editable = acc ? canEditTransaction(currentUserId, acc, t) : false;
              const catLabel = t.category
                ? formatCategoryPath(taxonomy, t.category)
                : t.amount > 0
                  ? t.source ?? '입금'
                  : '미분류';
              return (
                <div
                  key={t.id}
                  className="cal-list-row"
                  style={{ cursor: editable ? 'pointer' : 'default' }}
                  onClick={() => editable && onEdit(t.id)}
                >
                  <div className="cal-list-row-icon">
                    {acc?.emoji ?? '📒'}
                  </div>
                  <div className="cal-list-row-body">
                    <div className="cal-list-row-title">{catLabel}</div>
                    <div className="cal-list-row-sub">
                      {acc?.name ?? '—'}
                      {acc?.type ? ` · ${ACCOUNT_TYPE_META[acc.type].label}` : ''}
                      {t.memo ? ` · ${t.memo}` : ''}
                      {authorName ? ` · ${authorName}` : ''}
                      {t.isSupplement && ' · 💰 추경'}
                    </div>
                  </div>
                  <div className={`cal-list-row-amt ${t.amount >= 0 ? 'pos' : 'neg'}`}>
                    {t.amount >= 0 ? '+' : ''}
                    {formatKRW(t.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// 달력 뷰: 그리드 + 선택 날짜 거래 목록 (기존 UI)
// ────────────────────────────────────────────────────────────────────────
function CalendarView(props: {
  cursor: string;
  grid: (string | null)[];
  byDate: Record<string, { income: number; expense: number; count: number }>;
  today: string;
  selected: string;
  onSelectDate: (d: string) => void;
  selectedTxs: Transaction[];
  selectedIncome: number;
  selectedExpense: number;
  accounts: Account[];
  users: User[];
  currentUserId: string;
  onEdit: (id: string) => void;
}) {
  const {
    grid,
    byDate,
    today,
    selected,
    onSelectDate,
    selectedTxs,
    selectedIncome,
    selectedExpense,
    accounts,
    users,
    currentUserId,
    onEdit,
  } = props;

  return (
    <>
      <div className="card cal-card">
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
                onClick={() => onSelectDate(date)}
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
              onClick={() => editable && onEdit(t.id)}
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
    </>
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

// 리스트 뷰의 날짜 헤더 — 오늘이면 "25일 오늘", 아니면 "24일 금요일"
function formatDayHeader(iso: string, today: string): string {
  const [, , dd] = iso.split('-').map(Number);
  if (iso === today) return `${dd}일 오늘`;
  const d = new Date(iso);
  const dow = WEEKDAY_LABELS[d.getDay()];
  return `${dd}일 ${dow}요일`;
}
