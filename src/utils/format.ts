export const formatKRW = (n: number): string => {
  const sign = n < 0 ? '-' : '';
  return sign + Math.abs(n).toLocaleString('ko-KR') + '원';
};

export const formatCompact = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(1)}억`;
  if (abs >= 10_000) return `${sign}${Math.round(abs / 10_000)}만`;
  return `${sign}${abs.toLocaleString('ko-KR')}`;
};

export const todayISO = (): string => new Date().toISOString().slice(0, 10);
export const currentMonth = (): string => new Date().toISOString().slice(0, 7);

export const monthOf = (dateISO: string): string => dateISO.slice(0, 7);

export const addMonths = (ym: string, months: number): string => {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const monthDiff = (from: string, to: string): number => {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
};
