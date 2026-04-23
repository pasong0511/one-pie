import { RecurringInterval } from '../types';

// 'YYYY-MM-DD' → 로컬 Date (timezone 없이 날짜만)
export const parseLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const formatLocalDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;
const isWeekday = (d: Date) => !isWeekend(d);

// startDate 이후(포함)에서 interval 조건을 처음 만족하는 날짜
export const firstOccurrence = (startDate: string, interval: RecurringInterval): Date => {
  const d = parseLocalDate(startDate);
  if (interval === 'weekdays') {
    while (!isWeekday(d)) d.setDate(d.getDate() + 1);
  } else if (interval === 'weekends') {
    while (!isWeekend(d)) d.setDate(d.getDate() + 1);
  }
  return d;
};

// current → 다음 발생일
export const nextOccurrence = (current: Date, interval: RecurringInterval): Date => {
  const d = new Date(current);
  switch (interval) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      return d;
    case 'weekdays':
      do {
        d.setDate(d.getDate() + 1);
      } while (!isWeekday(d));
      return d;
    case 'weekends':
      do {
        d.setDate(d.getDate() + 1);
      } while (!isWeekend(d));
      return d;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      return d;
    case 'biweekly':
      d.setDate(d.getDate() + 14);
      return d;
    case 'every4weeks':
      d.setDate(d.getDate() + 28);
      return d;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      return d;
    case 'every2months':
      d.setMonth(d.getMonth() + 2);
      return d;
    case 'every3months':
      d.setMonth(d.getMonth() + 3);
      return d;
    case 'every4months':
      d.setMonth(d.getMonth() + 4);
      return d;
    case 'every5months':
      d.setMonth(d.getMonth() + 5);
      return d;
    case 'every6months':
      d.setMonth(d.getMonth() + 6);
      return d;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      return d;
  }
};

// startDate ~ until 사이(포함)에서 interval 발생일 목록.
// afterDate가 주어지면 afterDate 이후(미포함) 발생일만 반환.
export const occurrencesBetween = (
  startDate: string,
  interval: RecurringInterval,
  until: Date,
  afterDate?: string,
): Date[] => {
  const out: Date[] = [];
  const first = firstOccurrence(startDate, interval);
  if (first > until) return out;

  const afterTime = afterDate ? parseLocalDate(afterDate).getTime() : -Infinity;
  let cur = first;
  // 루프 안전장치: 50,000회 (daily × 100년 커버)
  for (let i = 0; i < 50000; i++) {
    if (cur > until) break;
    if (cur.getTime() > afterTime) out.push(new Date(cur));
    cur = nextOccurrence(cur, interval);
  }
  return out;
};
