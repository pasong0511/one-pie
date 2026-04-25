import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useStore } from '../store';
import { visibleAccounts } from '../utils/selectors';
import { addMonths, currentMonth, formatCompact, formatKRW } from '../utils/format';
import MonthNavigator from '../components/MonthNavigator';

type MonthRow = {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

const COLOR = {
  accent: '#2e7d5f',
  danger: '#dc2626',
  blue: '#2563eb',
  warn: '#d97706',
  purple: '#7c3aed',
  muted: '#73726d',
};
const PIE_COLORS = [
  '#2e7d5f',
  '#2563eb',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#65a30d',
  '#ca8a04',
  '#9333ea',
];

export default function Stats() {
  const navigate = useNavigate();
  const currentUserId = useStore((s) => s.currentUserId)!;
  const accounts = useStore((s) => s.accounts);
  const transactions = useStore((s) => s.transactions);
  const goals = useStore((s) => s.goals);
  const [range, setRange] = useState<6 | 12>(6);
  const [month, setMonth] = useState<string>(currentMonth());

  const visibleAccs = useMemo(
    () => visibleAccounts(currentUserId, accounts),
    [currentUserId, accounts],
  );
  const visibleIds = useMemo(() => new Set(visibleAccs.map((a) => a.id)), [visibleAccs]);
  const myTxs = useMemo(
    () => transactions.filter((t) => visibleIds.has(t.accountId)),
    [transactions, visibleIds],
  );

  // 최근 N개월 수입/지출/순익
  const monthly: MonthRow[] = useMemo(() => {
    const rows: MonthRow[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const m = addMonths(month, -i);
      const txs = myTxs.filter((t) => t.date.startsWith(m));
      const income = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const expense = txs.filter((t) => t.amount < 0).reduce((s, t) => s - t.amount, 0);
      rows.push({
        month: m,
        label: m.slice(5) + '월',
        income,
        expense,
        net: income - expense,
      });
    }
    return rows;
  }, [myTxs, month, range]);

  const thisMonth = monthly[monthly.length - 1];
  const net = thisMonth.net;
  const savingsRate = thisMonth.income > 0 ? (net / thisMonth.income) * 100 : 0;

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

  const totalExpense = categoryData.reduce((s, d) => s + d.amount, 0);

  // 결제 수단(type)별 지출
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

  // 목표
  const activeGoals = goals.filter((g) => (g.status ?? '진행중') === '진행중');

  return (
    <div>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div />
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

      <MonthNavigator month={month} onChange={setMonth} />

      {/* 요약 카드 */}
      <div className="section-title">월별 요약</div>
      <div className="stat-grid">
        <StatCard label="총 수입" value={formatKRW(thisMonth.income)} color={COLOR.accent} />
        <StatCard label="총 지출" value={formatKRW(thisMonth.expense)} color={COLOR.danger} />
        <StatCard
          label="순이익"
          value={`${net >= 0 ? '+' : ''}${formatKRW(net)}`}
          color={net >= 0 ? COLOR.accent : COLOR.danger}
        />
        <StatCard
          label="저축률"
          value={`${savingsRate.toFixed(1)}%`}
          color={savingsRate >= 30 ? COLOR.accent : savingsRate >= 0 ? COLOR.warn : COLOR.danger}
        />
      </div>

      {/* 월별 수입 vs 지출 */}
      <div className="section-title">최근 {range}개월 수입 vs 지출</div>
      <div className="card">
        <div className="chart-box">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => formatCompact(Number(v))}
                tick={{ fill: 'var(--text-faint)', fontSize: 10 }}
                width={55}
              />
              <Tooltip
                formatter={(v) => formatKRW(Number(v))}
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="수입" fill={COLOR.accent} radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill={COLOR.danger} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 순이익 추이 */}
      <div className="section-title">순이익 추이</div>
      <div className="card">
        <div className="chart-box" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthly} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
              <YAxis
                tickFormatter={(v) => formatCompact(Number(v))}
                tick={{ fill: 'var(--text-faint)', fontSize: 10 }}
                width={55}
              />
              <Tooltip
                formatter={(v) => formatKRW(Number(v))}
                contentStyle={tooltipStyle}
                labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="net"
                name="순이익"
                stroke={COLOR.blue}
                strokeWidth={2.5}
                dot={{ fill: COLOR.blue, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 카테고리별 지출 — 도넛 */}
      <div className="section-title">카테고리별 지출</div>
      <div className="card">
        {categoryData.length === 0 ? (
          <div className="empty">지출 데이터가 없어요.</div>
        ) : (
          <>
            <div className="chart-box" style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="55%"
                    outerRadius="85%"
                    paddingAngle={2}
                  >
                    {categoryData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v, name) => {
                      const n = Number(v);
                      return [
                        `${formatKRW(n)} (${((n / totalExpense) * 100).toFixed(1)}%)`,
                        String(name),
                      ];
                    }}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                    verticalAlign="bottom"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              총 지출 <strong style={{ color: 'var(--text)' }}>{formatKRW(totalExpense)}</strong>
            </div>
          </>
        )}
      </div>

      {/* 결제 수단별 지출 막대 */}
      <div className="section-title">결제 수단별 지출</div>
      <div className="card">
        {byAccountType.length === 0 ? (
          <div className="empty">거래가 없어요.</div>
        ) : (
          <div className="chart-box" style={{ height: Math.max(160, byAccountType.length * 48) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byAccountType}
                layout="vertical"
                margin={{ top: 6, right: 10, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompact(Number(v))}
                  tick={{ fill: 'var(--text-faint)', fontSize: 10 }}
                />
                <YAxis
                  type="category"
                  dataKey="type"
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  width={70}
                />
                <Tooltip
                  formatter={(v) => formatKRW(Number(v))}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="expense" name="지출" fill={COLOR.danger} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 진행 중 목표 진행률 */}
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
                    : Math.max(0, Math.min(1, (current - start) / (target - start)));
                return (
                  <div key={g.id}>
                    <div
                      className="row between"
                      style={{ fontSize: 13, marginBottom: 4 }}
                    >
                      <span>
                        {g.emoji ?? '🎯'} {g.name}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {formatCompact(current)} / {formatCompact(target)} ({(ratio * 100).toFixed(0)}
                        %)
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

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

const tooltipStyle: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};
