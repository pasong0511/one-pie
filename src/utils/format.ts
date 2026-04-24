// 통화/로케일 설정. 외국 확장 시 여기서 프로필을 갈아끼우면
// 입력 포매터와 표시 포매터가 같이 동작을 바꿈.
export type CurrencyLocale = {
  locale: string;         // Intl 로케일 ('ko-KR', 'en-US' 등)
  thousandSep: string;    // 세자리 구분자 (',' | '.' | ' ')
  decimalSep: string;     // 소수점 구분자 ('.' | ',')
  symbol: string;         // 표시용 기호/접미사 ('원', '$', '€')
  symbolPosition: 'prefix' | 'suffix';
  fractionDigits: number; // 입력/표시 소수 자릿수 (KRW=0)
};

const LOCALE_PROFILES: Record<string, CurrencyLocale> = {
  KRW: {
    locale: 'ko-KR',
    thousandSep: ',',
    decimalSep: '.',
    symbol: '원',
    symbolPosition: 'suffix',
    fractionDigits: 0,
  },
  USD: {
    locale: 'en-US',
    thousandSep: ',',
    decimalSep: '.',
    symbol: '$',
    symbolPosition: 'prefix',
    fractionDigits: 2,
  },
  EUR: {
    locale: 'de-DE',
    thousandSep: '.',
    decimalSep: ',',
    symbol: '€',
    symbolPosition: 'suffix',
    fractionDigits: 2,
  },
  JPY: {
    locale: 'ja-JP',
    thousandSep: ',',
    decimalSep: '.',
    symbol: '¥',
    symbolPosition: 'prefix',
    fractionDigits: 0,
  },
};

// 현재 앱 로케일. 설정 UI가 붙기 전까지 기본 KRW.
let currentCurrency: CurrencyLocale = LOCALE_PROFILES.KRW;

export const setCurrencyLocale = (key: keyof typeof LOCALE_PROFILES): void => {
  const profile = LOCALE_PROFILES[key];
  if (profile) currentCurrency = profile;
};
export const getCurrencyLocale = (): CurrencyLocale => currentCurrency;

export const formatKRW = (n: number): string => {
  const c = currentCurrency;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n).toLocaleString(c.locale, {
    minimumFractionDigits: c.fractionDigits,
    maximumFractionDigits: c.fractionDigits,
  });
  return c.symbolPosition === 'prefix'
    ? `${sign}${c.symbol}${abs}`
    : `${sign}${abs}${c.symbol}`;
};

// 입력 필드용 — 정수/소수를 현재 로케일 구분자에 맞춰 포맷.
// 빈 값, 음수 부호, 소수점 입력 중인 상태를 모두 허용.
// 예) 1234567 → "1,234,567" (KRW) / "1.234.567" (EUR)
export const formatAmountInput = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '';
  const c = currentCurrency;
  const raw = String(value);
  // 현재 포맷된 문자열을 다시 받아도 동작하도록 구분자/기호 제거 후 표준화
  const normalized = raw
    .replace(new RegExp(`\\${c.thousandSep}`, 'g'), '')
    .replace(c.decimalSep, '.')
    .replace(/[^\d.-]/g, '');
  if (!normalized || normalized === '-' || normalized === '.') return normalized;
  const isNeg = normalized.startsWith('-');
  const body = normalized.replace(/^-/, '');
  const [intPart, ...frac] = body.split('.');
  const fracStr = frac.length > 0 ? frac.join('').slice(0, c.fractionDigits) : '';
  const intClean = intPart.replace(/^0+(?=\d)/, '') || '0';
  const intWithSep = intClean.replace(/\B(?=(\d{3})+(?!\d))/g, c.thousandSep);
  const hasTrailingDot = raw.endsWith(c.decimalSep) && c.fractionDigits > 0;
  const joined = fracStr
    ? `${intWithSep}${c.decimalSep}${fracStr}`
    : hasTrailingDot
      ? `${intWithSep}${c.decimalSep}`
      : intWithSep;
  return (isNeg ? '-' : '') + joined;
};

// 포맷된 문자열 → 숫자. 빈 값/부호만 입력 중이면 0.
// 소수점 허용은 현재 로케일의 fractionDigits에 따름.
export const parseAmountInput = (s: string): number => {
  if (!s) return 0;
  const c = currentCurrency;
  const cleaned = s
    .replace(new RegExp(`\\${c.thousandSep}`, 'g'), '')
    .replace(c.decimalSep, '.')
    .replace(/[^\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
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
