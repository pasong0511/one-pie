import { ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { canEditTransaction, visibleAccounts } from '../utils/selectors';
import { currentMonth, formatCompact, formatKRW, todayISO } from '../utils/format';
import {
  Account,
  ACCOUNT_TYPE_META,
  MainCategory,
  splitBillStatusMeta,
  SplitBill,
  Transaction,
  User,
} from '../types';
import { formatCategoryPath } from '../utils/category';
import MonthNavigator from '../components/MonthNavigator';
import TransactionSearchModal from '../components/TransactionSearchModal';
import { usePageRuntime } from '../stores/runtime';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type ViewMode = 'list' | 'calendar';

export default function Calendar() {
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const users = useStore((s) => s.users);
  const taxonomy = useStore((s) => s.categoryTaxonomy);
  const splitBills = useStore((s) => s.splitBills);
  const filterAccountIds = usePageRuntime((s) => s.txFilterAccountIds);
  const calendarSections = useStore((s) => s.preferences.calendarSections);
  const navigate = useNavigate();

  // 툴바 항목별 표시 토글 — 미설정/true 모두 표시.
  // 둘 다 꺼지면 툴바 자체가 사라짐.
  const showViewToggle = calendarSections.viewToggle !== false;
  const showSearch = calendarSections.search !== false;
  const showToolbar = showViewToggle || showSearch;

  const [cursor, setCursor] = useState<string>(currentMonth()); // 'YYYY-MM'
  const [selected, setSelected] = useState<string>(todayISO());
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchOpen, setSearchOpen] = useState(false);
  const goEdit = (id: string) => navigate(`/tx/${id}`);

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

  // 달력 모드용 날짜별 집계 — count 는 이체 포함, income/expense 는 이체 제외
  const byDate = useMemo(() => {
    const map: Record<string, { income: number; expense: number; count: number }> = {};
    for (const t of monthTxs) {
      if (!map[t.date]) map[t.date] = { income: 0, expense: 0, count: 0 };
      map[t.date].count++;
      if (t.kind === 'transfer') continue;
      if (t.amount > 0) map[t.date].income += t.amount;
      else map[t.date].expense += -t.amount;
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
  // 선택 날짜 합계 — 이체 제외
  const selectedIncome = selectedTxs
    .filter((t) => t.amount > 0 && t.kind !== 'transfer')
    .reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedTxs
    .filter((t) => t.amount < 0 && t.kind !== 'transfer')
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
        // 이체는 일별 합계에서 제외
        income: txs
          .filter((t) => t.amount > 0 && t.kind !== 'transfer')
          .reduce((s, t) => s + t.amount, 0),
        expense: txs
          .filter((t) => t.amount < 0 && t.kind !== 'transfer')
          .reduce((s, t) => s + Math.abs(t.amount), 0),
      }));
  }, [monthTxs]);


  return (
    <div className="calendar-page">
      {/* MonthNavigator 는 페이지 전역 헤더 — 모든 섹션의 month 컨텍스트 */}
      <MonthNavigator
        month={cursor}
        onChange={(m) => {
          setCursor(m);
          if (m === currentMonth()) setSelected(todayISO());
        }}
      />

      {showToolbar && (
        <section className="page-section page-section-toolbar">
          <div className="cal-toolbar">
            {showViewToggle ? (
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
            ) : (
              <div />
            )}
            {showSearch && (
              <button
                type="button"
                className="cal-toolbar-icon"
                onClick={() => setSearchOpen(true)}
                title="거래 검색"
                aria-label="거래 검색"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
              </button>
            )}
          </div>
        </section>
      )}

      <section className="page-section page-section-content">
        {viewMode === 'list' && (
          <ListView
            groups={groupedByDate}
            taxonomy={taxonomy}
            accounts={accounts}
            users={users}
            splitBills={splitBills}
            currentUserId={currentUserId}
            today={today}
            onEdit={goEdit}
            onSplitClick={(id) => navigate(`/settle/${id}`)}
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
            splitBills={splitBills}
            currentUserId={currentUserId}
            onEdit={goEdit}
            onSplitClick={(id) => navigate(`/settle/${id}`)}
          />
        )}
      </section>

      {searchOpen && (
        <TransactionSearchModal
          transactions={myTxs}
          accounts={accounts}
          users={users}
          taxonomy={taxonomy}
          onPick={goEdit}
          onClose={() => setSearchOpen(false)}
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
  splitBills: SplitBill[];
  currentUserId: string;
  today: string;
  onEdit: (id: string) => void;
  onSplitClick: (billId: string) => void;
}) {
  const { groups, taxonomy, accounts, users, splitBills, currentUserId, today, onEdit, onSplitClick } = props;

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
                      {t.kind === 'transfer' && t.splitRole !== 'inflow' && t.splitRole !== 'outflow' && ' · ↔ 이체'}
                      {renderSplitChips(t, splitBills, onSplitClick)}
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
  splitBills: SplitBill[];
  currentUserId: string;
  onEdit: (id: string) => void;
  onSplitClick: (billId: string) => void;
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
    onSplitClick,
    splitBills,
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
                  {t.kind === 'transfer' && t.splitRole !== 'inflow' && t.splitRole !== 'outflow' && (
                    <span className="chip" style={{ marginLeft: 6, fontSize: 10 }}>
                      ↔ 이체
                    </span>
                  )}
                  {renderSplitChips(t, splitBills, onSplitClick)}
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

// 정산 관련 칩 렌더 — 칩 클릭 시 거래 페이지가 아닌 정산서 상세로 직접 진입.
function renderSplitChips(
  t: Transaction,
  splitBills: SplitBill[],
  onSplitClick: (billId: string) => void,
): ReactNode {
  // 자동 생성된 거래
  if (t.splitBillId && t.splitRole) {
    const billId = t.splitBillId;
    return (
      <span
        className="chip status-done settle-chip-link"
        style={{ marginLeft: 6, fontSize: 10 }}
        onClick={(e) => {
          e.stopPropagation();
          onSplitClick(billId);
        }}
      >
        {t.splitRole === 'inflow' ? '↩ 정산 입금' : '↪ 정산 출금'}
      </span>
    );
  }
  // 원본 거래 — 거래당 정산서 1개 (1:1)
  const linked = splitBills.find((b) => b.txId === t.id);
  if (!linked) return null;
  const meta = splitBillStatusMeta(linked.status);
  return (
    <span
      className={`chip ${meta.className} settle-chip-link`}
      style={{ marginLeft: 6, fontSize: 10 }}
      onClick={(e) => {
        e.stopPropagation();
        onSplitClick(linked.id);
      }}
    >
      {meta.emoji} {meta.label}
    </span>
  );
}
