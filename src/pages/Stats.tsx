import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { visibleAccounts } from '../utils/selectors';
import { addMonths, currentMonth, formatCompact, formatKRW } from '../utils/format';

type MonthRow = {
  month: string;
  income: number;   // 양수 거래 합
  expense: number;  // 음수 거래 절댓값 합
};

export default function Stats() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const goals = useStore((s) => s.goals);
  const [range, setRange] = useState<6 | 12>(6);

  const month = currentMonth();

  const visibleAccs = useMemo(
    () => visibleAccounts(currentUserId, accounts),
    [currentUserId, accounts],
  );
  const visibleIds = useMemo(() => new Set(visibleAccs.map((a) => a.id)), [visibleAccs]);
  const myTxs = useMemo(
    () => transactions.filter((t) => visibleIds.has(t.accountId)),
    [transactions, visibleIds],
  );

  // 최근 N개월 수입/지출
  const monthly: MonthRow[] = useMemo(() => {
    const rows: MonthRow[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const m = addMonths(month, -i);
      const txs = myTxs.filter((t) => t.date.startsWith(m));
      const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
      rows.push({ month: m, income, expense });
    }
    return rows;
  }, [myTxs, month, range]);

  const thisMonth = monthly[monthly.length - 1];
  const net = thisMonth.income - thisMonth.expense;
  const savingsRate =
    thisMonth.income > 0 ? (net / thisMonth.income) * 100 : 0;

  // 이번 달 카테고리별 지출
  const categoryData = useMemo(() => {
    const m: Record<string, number> = {};
    const thisMonthExpenses = myTxs.filter(
      (t) => t.date.startsWith(month) && t.amount < 0,
    );
    for (const t of thisMonthExpenses) {
      const cat = t.category ?? '미분류';
      m[cat] = (m[cat] ?? 0) + -t.amount;
    }
    return Object.entries(m)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [myTxs, month]);

  // 계좌 종류(type)별 지출/수입
  const byAccountType = useMemo(() => {
    const m: Record<string, { income: number; expense: number }> = {};
    const thisMonthTxs = myTxs.filter((t) => t.date.startsWith(month));
    for (const t of thisMonthTxs) {
      const acc = accounts.find((a) => a.id === t.accountId);
      const key = acc?.type ?? '계좌';
      if (!m[key]) m[key] = { income: 0, expense: 0 };
      if (t.amount > 0) m[key].income += t.amount;
      else m[key].expense += -t.amount;
    }
    return Object.entries(m).map(([type, v]) => ({ type, ...v }));
  }, [myTxs, accounts, month]);

  // 목표 진행률 요약
  const activeGoals = goals.filter((g) => (g.status ?? '진행중') === '진행중');

  return (
    <div>
      <div className="row between" style={{ marginBottom: 8 }}>
        <button className="ghost" onClick={() => navigate('/')}>
          ← 대시보드
        </button>
        <div className="row" style={{ gap: 4 }}>
          <button
            className={range === 6 ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setRange(6)}
          >
            6개월
          </button>
          <button
            className={range === 12 ? 'primary' : ''}
            style={{ fontSize: 12, padding: '4px 10px' }}
            onClick={() => setRange(12)}
          >
            12개월
          </button>
        </div>
      </div>

      <h2 style={{ margin: '0 0 16px' }}>📊 통계</h2>

      {/* 이번 달 요약 */}
      <div className="section-title">이번 달 ({month})</div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">총 수입</div>
          <div className="stat-value" style={{ color: 'var(--accent)' }}>
            {formatKRW(thisMonth.income)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">총 지출</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {formatKRW(thisMonth.expense)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">순이익</div>
          <div
            className="stat-value"
            style={{ color: net >= 0 ? 'var(--accent)' : 'var(--danger)' }}
          >
            {net >= 0 ? '+' : ''}
            {formatKRW(net)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">저축률</div>
          <div
            className="stat-value"
            style={{
              color:
                savingsRate >= 30
                  ? 'var(--accent)'
                  : savingsRate >= 0
                    ? 'var(--warn)'
                    : 'var(--danger)',
            }}
          >
            {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* 월별 수입/지출 */}
      <div className="section-title">최근 {range}개월 수입 vs 지출</div>
      <div className="card">
        <MonthlyBarChart data={monthly} />
        <div className="row" style={{ gap: 12, marginTop: 8, fontSize: 12 }}>
          <span>
            <span className="legend-dot" style={{ background: 'var(--accent)' }} />
            수입
          </span>
          <span>
            <span className="legend-dot" style={{ background: 'var(--danger)' }} />
            지출
          </span>
        </div>
      </div>

      {/* 카테고리별 지출 */}
      <div className="section-title">이번 달 카테고리별 지출</div>
      <div className="card">
        {categoryData.length === 0 ? (
          <div className="empty">지출 데이터가 없어요.</div>
        ) : (
          <CategoryBars data={categoryData} />
        )}
      </div>

      {/* 결제 수단별 */}
      <div className="section-title">이번 달 결제 수단별</div>
      <div className="card">
        {byAccountType.length === 0 ? (
          <div className="empty">거래가 없어요.</div>
        ) : (
          <div className="stack" style={{ gap: 10 }}>
            {byAccountType.map((r) => (
              <div key={r.type}>
                <div
                  className="row between"
                  style={{ fontSize: 13, marginBottom: 4 }}
                >
                  <span>{r.type}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    수입 +{formatCompact(r.income)} / 지출 -{formatCompact(r.expense)}
                  </span>
                </div>
                <div className="progress" style={{ height: 6 }}>
                  <div
                    className="fill blue"
                    style={{
                      width: `${r.expense === 0 ? 0 : Math.min((r.expense / (byAccountType[0].expense || 1)) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 진행 중 목표 */}
      {activeGoals.length > 0 && (
        <>
          <div className="section-title">진행 중 목표</div>
          <div className="card">
            <div className="stack" style={{ gap: 12 }}>
              {activeGoals.map((g) => {
                const target = g.targetAmount;
                const start = g.startAmount ?? 0;
                const linkedAccounts = accounts.filter((a) =>
                  g.linkedAccountIds.includes(a.id),
                );
                let current = start;
                for (const a of linkedAccounts) {
                  const init = a.initialBalance ?? 0;
                  const sum = transactions
                    .filter((t) => t.accountId === a.id)
                    .reduce((s, t) => s + t.amount, 0);
                  current += init + sum;
                }
                const ratio =
                  target === start
                    ? 1
                    : Math.max(
                        0,
                        Math.min(1, (current - start) / (target - start)),
                      );
                return (
                  <div key={g.id}>
                    <div className="row between" style={{ fontSize: 13, marginBottom: 4 }}>
                      <span>
                        {g.emoji ?? '🎯'} {g.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatCompact(current)} / {formatCompact(target)} ({(ratio * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="progress">
                      <div
                        className={`fill ${g.mode === '차감형' ? 'blue' : ''}`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// 월별 수입/지출 그룹 막대 (SVG)
// ─────────────────────────────────────
function MonthlyBarChart({ data }: { data: MonthRow[] }) {
  const width = 720;
  const height = 220;
  const pad = { top: 14, right: 14, bottom: 28, left: 48 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const maxVal = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  // 상단이 딱 맞지 않도록 여유
  const niceMax = niceCeil(maxVal);

  const groupW = cw / data.length;
  const barW = Math.max(4, Math.min(26, (groupW - 8) / 2));

  const yFor = (v: number) => pad.top + ch - (v / niceMax) * ch;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', maxHeight: 280 }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 격자 */}
      {yTicks.map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + ch * (1 - t)}
          y2={pad.top + ch * (1 - t)}
          stroke="var(--border)"
          strokeDasharray={t === 0 ? '' : '2 2'}
        />
      ))}
      {/* Y축 라벨 */}
      {yTicks.map((t) => (
        <text
          key={`y-${t}`}
          x={pad.left - 6}
          y={pad.top + ch * (1 - t) + 3}
          textAnchor="end"
          fontSize="10"
          fill="var(--text-faint)"
        >
          {formatCompact(niceMax * t)}
        </text>
      ))}
      {/* 막대 */}
      {data.map((d, i) => {
        const gx = pad.left + i * groupW + groupW / 2;
        const incomeH = (d.income / niceMax) * ch;
        const expenseH = (d.expense / niceMax) * ch;
        const x1 = gx - barW - 2;
        const x2 = gx + 2;
        return (
          <g key={d.month}>
            <rect
              x={x1}
              y={yFor(d.income)}
              width={barW}
              height={incomeH}
              fill="var(--accent)"
              rx={2}
            >
              <title>
                {d.month} 수입 {formatKRW(d.income)}
              </title>
            </rect>
            <rect
              x={x2}
              y={yFor(d.expense)}
              width={barW}
              height={expenseH}
              fill="var(--danger)"
              rx={2}
            >
              <title>
                {d.month} 지출 {formatKRW(d.expense)}
              </title>
            </rect>
            <text
              x={gx}
              y={height - 10}
              textAnchor="middle"
              fontSize="11"
              fill="var(--text-muted)"
            >
              {d.month.slice(5)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────
// 카테고리별 가로 막대
// ─────────────────────────────────────
function CategoryBars({ data }: { data: { name: string; amount: number }[] }) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const max = data[0].amount;
  return (
    <>
      <div className="stack" style={{ gap: 10 }}>
        {data.map((d) => {
          const share = (d.amount / total) * 100;
          const bar = (d.amount / max) * 100;
          return (
            <div key={d.name}>
              <div
                className="row between"
                style={{ fontSize: 13, marginBottom: 4 }}
              >
                <span>{d.name}</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {formatKRW(d.amount)} · {share.toFixed(1)}%
                </span>
              </div>
              <div className="progress">
                <div className="fill" style={{ width: `${bar}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 12,
          borderTop: '1px solid var(--border)',
          paddingTop: 8,
        }}
      >
        총 지출 {formatKRW(total)}
      </div>
    </>
  );
}

// Y축 상단값을 "깔끔한 숫자"로 반올림
function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const base = v / pow;
  const nice = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return nice * pow;
}
