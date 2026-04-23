import { Account, FamilyGroup, Goal, Transaction, User } from './types';

export function buildSeed(): {
  users: User[];
  familyGroups: FamilyGroup[];
  accounts: Account[];
  goals: Goal[];
  transactions: Transaction[];
} {
  const users: User[] = [
    { id: 'u_dg', name: '동건', emoji: '👨', familyGroupId: 'fg_01' },
    { id: 'u_sh', name: '송희', emoji: '👩', familyGroupId: 'fg_01' },
  ];

  const familyGroups: FamilyGroup[] = [
    { id: 'fg_01', name: '동건·송희', memberIds: ['u_dg', 'u_sh'] },
  ];

  const goals: Goal[] = [
    {
      id: 'goal_apt_2029',
      ownerType: 'family',
      ownerId: 'fg_01',
      name: '2029 아파트 구매',
      emoji: '🏠',
      targetAmount: 200_000_000,
      startDate: '2025-01',
      targetDate: '2029-12',
      status: '진행중',
      linkedAccountIds: ['a_dg_goal_apt', 'a_dg_house', 'a_sh_house'],
    },
    {
      id: 'goal_mac',
      ownerType: 'user',
      ownerId: 'u_sh',
      name: '맥북 M4 구매',
      emoji: '💻',
      targetAmount: 2_500_000,
      startDate: '2026-02',
      targetDate: '2026-12',
      status: '진행중',
      linkedAccountIds: ['a_sh_mac'],
    },
  ];

  // ── 월 범위: 2025-01 ~ 2026-04 (16개월) ────────────────────
  const allMonths: string[] = [];
  for (let y = 2025; y <= 2026; y++) {
    const endM = y === 2026 ? 4 : 12;
    for (let m = 1; m <= endM; m++) {
      allMonths.push(`${y}-${String(m).padStart(2, '0')}`);
    }
  }
  const CURRENT_MONTH = '2026-04';
  const CURRENT_DAY = 24; // 오늘까지만 데이터 생성

  // 결정적 편차 (월/시드로 -15~+15% 변동)
  const varPct = (month: string, seed: number): number => {
    const [y, m] = month.split('-').map(Number);
    const v = ((y * 37 + m * 11 + seed * 17) % 31) - 15;
    return v / 100;
  };
  const varAmt = (base: number, month: string, seed: number): number => {
    const delta = varPct(month, seed);
    return Math.max(1000, Math.round((base * (1 + delta)) / 1000) * 1000);
  };

  const daysInMonth = (month: string): number => {
    const [y, m] = month.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  };
  const effectiveEndDay = (month: string): number =>
    month === CURRENT_MONTH ? CURRENT_DAY : daysInMonth(month);

  // 월별 allocations 생성 (±8% 변동)
  const makeAllocs = (
    base: Record<string, number>,
    months: string[],
  ): Record<string, Record<string, number>> => {
    const out: Record<string, Record<string, number>> = {};
    for (const month of months) {
      const row: Record<string, number> = {};
      let i = 0;
      for (const [cat, amt] of Object.entries(base)) {
        i += 1;
        const delta = varPct(month, i) * 0.5; // 배정은 지출보다 완만한 변동
        row[cat] = Math.max(10_000, Math.round((amt * (1 + delta)) / 10_000) * 10_000);
      }
      out[month] = row;
    }
    return out;
  };
  const makeMonthlyBudget = (amount: number, months: string[]): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const month of months) out[month] = amount;
    return out;
  };

  const accounts: Account[] = [
    {
      id: 'a_dg_goal_apt',
      ownerId: 'u_dg',
      name: '아파트 목표',
      emoji: '🎯',
      type: '계좌',
      mode: '누적형',
      recurringDeposits: [
        { id: 'r_dg_goal_apt', interval: 'monthly', dayOfMonth: 1, amount: 500_000, source: '월급' },
      ],
      goalId: 'goal_apt_2029',
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['월급 적립', '보너스', '기타'],
      budgetAllocations: {},
      createdAt: '2025-01-01',
    },
    {
      id: 'a_dg_daily',
      ownerId: 'u_dg',
      name: '생활비',
      emoji: '💰',
      type: '체크카드',
      mode: '차감형',
      recurringDeposits: [
        { id: 'r_dg_daily', interval: 'monthly', dayOfMonth: 1, amount: 1_000_000, source: '월급' },
      ],
      sharing: 'shared-rw',
      sharedWith: ['u_sh'],
      editPolicy: 'any-sharer',
      categories: ['장보기', '공과금', '교통', '외식'],
      budgetAllocations: makeAllocs(
        { 장보기: 300_000, 공과금: 250_000, 교통: 150_000, 외식: 200_000 },
        allMonths,
      ),
      monthlyBudget: makeMonthlyBudget(1_000_000, allMonths),
      settlementReminder: { dayOfMonth: 31, enabled: true },
      lowBalanceAlert: { percent: 20, notify: 'owner' },
      createdAt: '2025-01-01',
    },
    {
      id: 'a_dg_allow',
      ownerId: 'u_dg',
      name: '용돈',
      emoji: '👛',
      type: '현금',
      mode: '차감형',
      recurringDeposits: [
        { id: 'r_dg_allow', interval: 'monthly', dayOfMonth: 1, amount: 500_000, source: '월급' },
      ],
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['식사비', '의류', '취미', '여유'],
      budgetAllocations: makeAllocs(
        { 식사비: 180_000, 의류: 120_000, 취미: 120_000, 여유: 80_000 },
        allMonths,
      ),
      monthlyBudget: makeMonthlyBudget(500_000, allMonths),
      settlementReminder: { dayOfMonth: 31, enabled: true },
      createdAt: '2025-01-01',
    },
    {
      id: 'a_dg_house',
      ownerId: 'u_dg',
      name: '주택자금',
      emoji: '🏦',
      type: '계좌',
      mode: '누적형',
      initialBalance: 9_000_000,
      recurringDeposits: [
        { id: 'r_dg_house', interval: 'monthly', dayOfMonth: 25, amount: 800_000, source: '월급 적립' },
      ],
      goalId: 'goal_apt_2029',
      sharing: 'shared-r',
      sharedWith: ['u_sh'],
      editPolicy: 'author-only',
      categories: ['월급 적립', '보너스', '중고판매', '부모님 지원'],
      budgetAllocations: {},
      createdAt: '2025-01-01',
    },
    {
      id: 'a_sh_allow',
      ownerId: 'u_sh',
      name: '용돈',
      emoji: '👛',
      type: '현금',
      mode: '차감형',
      recurringDeposits: [
        { id: 'r_sh_allow', interval: 'monthly', dayOfMonth: 1, amount: 500_000, source: '월급' },
      ],
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['식사비', '의류', '취미', '여유'],
      budgetAllocations: makeAllocs(
        { 식사비: 160_000, 의류: 140_000, 취미: 120_000, 여유: 80_000 },
        allMonths,
      ),
      monthlyBudget: makeMonthlyBudget(500_000, allMonths),
      settlementReminder: { dayOfMonth: 31, enabled: true },
      createdAt: '2025-01-01',
    },
    {
      id: 'a_sh_daily',
      ownerId: 'u_sh',
      name: '생활비',
      emoji: '💰',
      type: '체크카드',
      mode: '차감형',
      recurringDeposits: [
        { id: 'r_sh_daily', interval: 'monthly', dayOfMonth: 1, amount: 1_000_000, source: '월급' },
      ],
      sharing: 'shared-rw',
      sharedWith: ['u_dg'],
      editPolicy: 'any-sharer',
      categories: ['장보기', '공과금', '교통', '외식'],
      budgetAllocations: makeAllocs(
        { 장보기: 320_000, 공과금: 280_000, 교통: 180_000, 외식: 220_000 },
        allMonths,
      ),
      monthlyBudget: makeMonthlyBudget(1_000_000, allMonths),
      settlementReminder: { dayOfMonth: 31, enabled: true },
      lowBalanceAlert: { amount: 150_000, notify: 'all' },
      createdAt: '2025-01-01',
    },
    {
      id: 'a_sh_house',
      ownerId: 'u_sh',
      name: '주택자금',
      emoji: '🏦',
      type: '계좌',
      mode: '누적형',
      initialBalance: 6_000_000,
      recurringDeposits: [
        { id: 'r_sh_house', interval: 'monthly', dayOfMonth: 25, amount: 600_000, source: '월급 적립' },
      ],
      goalId: 'goal_apt_2029',
      sharing: 'shared-r',
      sharedWith: ['u_dg'],
      editPolicy: 'author-only',
      categories: ['월급 적립', '보너스', '중고판매'],
      budgetAllocations: {},
      createdAt: '2025-01-01',
    },
    {
      id: 'a_sh_mac',
      ownerId: 'u_sh',
      name: '맥북 M4 구매',
      emoji: '💻',
      type: '계좌',
      mode: '누적형',
      initialBalance: 0,
      recurringDeposits: [
        { id: 'r_sh_mac', interval: 'monthly', dayOfMonth: 15, amount: 80_000, source: '월급 적립' },
      ],
      goalId: 'goal_mac',
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['월급 적립', '중고판매', '부모님 지원'],
      budgetAllocations: {},
      createdAt: '2026-02-01',
    },
    {
      id: 'a_sh_deposit',
      ownerId: 'u_sh',
      name: '자취 보증금',
      emoji: '🏘️',
      type: '계좌',
      mode: '누적형',
      initialBalance: 0,
      recurringDeposits: [
        { id: 'r_sh_deposit', interval: 'monthly', dayOfMonth: 1, amount: 500_000, source: '월급 적립' },
      ],
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['월급 적립', '적금 만기', '보너스'],
      budgetAllocations: {},
      createdAt: '2025-06-01',
    },
  ];

  // ── 트랜잭션 생성 ──────────────────────────────────────
  let n = 0;
  const mkTx = (t: Omit<Transaction, 'id'>): Transaction => ({
    id: `t${String(++n).padStart(4, '0')}`,
    ...t,
  });
  const transactions: Transaction[] = [];
  const add = (t: Omit<Transaction, 'id'>) => transactions.push(mkTx(t));

  type Spend = { day: number; amt: number; cat: string; memo: string; author?: string };

  // 차감형 지출 패턴 (월별 반복). {M} 은 월 숫자로 치환.
  const dgDailyPattern: Spend[] = [
    { day: 3, amt: 68_000, cat: '장보기', memo: '이마트' },
    { day: 5, amt: 45_000, cat: '교통', memo: '교통카드 충전' },
    { day: 9, amt: 58_000, cat: '외식', memo: '주말 외식' },
    { day: 11, amt: 95_000, cat: '장보기', memo: '홈플러스' },
    { day: 15, amt: 195_000, cat: '공과금', memo: '{M}월 관리비', author: 'u_sh' },
    { day: 18, amt: 38_000, cat: '외식', memo: '배달' },
    { day: 21, amt: 62_000, cat: '장보기', memo: '주간 장보기' },
    { day: 25, amt: 45_000, cat: '교통', memo: '택시' },
    { day: 28, amt: 85_000, cat: '장보기', memo: '월말 장보기' },
  ];

  const dgAllowPattern: Spend[] = [
    { day: 4, amt: 18_000, cat: '식사비', memo: '점심' },
    { day: 7, amt: 85_000, cat: '의류', memo: '의류 구매' },
    { day: 12, amt: 32_000, cat: '취미', memo: '서점' },
    { day: 14, amt: 45_000, cat: '식사비', memo: '저녁 약속' },
    { day: 17, amt: 52_000, cat: '식사비', memo: '팀 점심' },
    { day: 20, amt: 38_000, cat: '여유', memo: '카페' },
    { day: 23, amt: 65_000, cat: '취미', memo: '구독료' },
    { day: 26, amt: 42_000, cat: '의류', memo: '양말/속옷' },
    { day: 29, amt: 28_000, cat: '여유', memo: '주말 커피' },
  ];

  const shDailyPattern: Spend[] = [
    { day: 4, amt: 85_000, cat: '장보기', memo: '홈플러스' },
    { day: 7, amt: 52_000, cat: '외식', memo: '동료 점심' },
    { day: 12, amt: 180_000, cat: '공과금', memo: '{M}월 통신비' },
    { day: 16, amt: 62_000, cat: '교통', memo: '주말 외출', author: 'u_dg' },
    { day: 20, amt: 108_000, cat: '장보기', memo: '마트' },
    { day: 23, amt: 65_000, cat: '외식', memo: '저녁' },
    { day: 26, amt: 52_000, cat: '교통', memo: '택시' },
    { day: 29, amt: 78_000, cat: '장보기', memo: '월말 장보기' },
  ];

  const shAllowPattern: Spend[] = [
    { day: 3, amt: 28_000, cat: '식사비', memo: '점심' },
    { day: 5, amt: 25_000, cat: '식사비', memo: '브런치' },
    { day: 9, amt: 75_000, cat: '의류', memo: '의류' },
    { day: 12, amt: 38_000, cat: '여유', memo: '선물' },
    { day: 15, amt: 45_000, cat: '취미', memo: '전시회' },
    { day: 20, amt: 30_000, cat: '식사비', memo: '점심' },
    { day: 25, amt: 50_000, cat: '취미', memo: '요가 수업' },
    { day: 27, amt: 35_000, cat: '의류', memo: '액세서리' },
  ];

  const applyPattern = (
    accountId: string,
    ownerId: string,
    pattern: Spend[],
    month: string,
  ) => {
    const endDay = effectiveEndDay(month);
    const mm = Number(month.split('-')[1]);
    for (const s of pattern) {
      if (s.day > endDay) continue;
      const date = `${month}-${String(s.day).padStart(2, '0')}`;
      const amt = varAmt(s.amt, month, s.day * 7 + s.cat.charCodeAt(0));
      const memo = s.memo.replace('{M}', String(mm));
      add({
        accountId,
        authorId: s.author ?? ownerId,
        date,
        amount: -amt,
        category: s.cat,
        memo,
      });
    }
  };

  for (const month of allMonths) {
    const endDay = effectiveEndDay(month);

    // 정기입금 (1일) — 차감형 + goal 적립
    add({ accountId: 'a_dg_daily', authorId: 'u_dg', date: `${month}-01`, amount: 1_000_000, source: '월급', autoGenerated: true });
    add({ accountId: 'a_dg_allow', authorId: 'u_dg', date: `${month}-01`, amount: 500_000, source: '월급', autoGenerated: true });
    add({ accountId: 'a_sh_daily', authorId: 'u_sh', date: `${month}-01`, amount: 1_000_000, source: '월급', autoGenerated: true });
    add({ accountId: 'a_sh_allow', authorId: 'u_sh', date: `${month}-01`, amount: 500_000, source: '월급', autoGenerated: true });
    add({ accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: `${month}-01`, amount: 500_000, category: '월급 적립', source: '월급', autoGenerated: true });

    // 주택자금 월 적립 (25일)
    if (endDay >= 25) {
      add({ accountId: 'a_dg_house', authorId: 'u_dg', date: `${month}-25`, amount: 800_000, category: '월급 적립', source: '월급 적립', autoGenerated: true });
      add({ accountId: 'a_sh_house', authorId: 'u_sh', date: `${month}-25`, amount: 600_000, category: '월급 적립', source: '월급 적립', autoGenerated: true });
    }

    // 자취 보증금 적립 (2025-06 부터)
    if (month >= '2025-06') {
      add({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: `${month}-01`, amount: 500_000, category: '월급 적립', source: '월급 적립', autoGenerated: true });
    }

    // 맥북 적립 (2026-02 부터, 15일)
    if (month >= '2026-02' && endDay >= 15) {
      add({ accountId: 'a_sh_mac', authorId: 'u_sh', date: `${month}-15`, amount: 80_000, category: '월급 적립', source: '월급 적립', autoGenerated: true });
    }

    // 차감형 지출
    applyPattern('a_dg_daily', 'u_dg', dgDailyPattern, month);
    applyPattern('a_dg_allow', 'u_dg', dgAllowPattern, month);
    applyPattern('a_sh_daily', 'u_sh', shDailyPattern, month);
    applyPattern('a_sh_allow', 'u_sh', shAllowPattern, month);
  }

  // ── 특별 이벤트 ─────────────────────────────────────────
  // 2025년 명절/성과급
  add({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2025-02-14', amount: 1_200_000, category: '보너스', memo: '설 상여' });
  add({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2025-02-14', amount: 800_000, category: '보너스', memo: '설 상여' });
  add({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2025-06-28', amount: 1_800_000, category: '보너스', memo: '상반기 성과급' });
  add({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2025-06-28', amount: 1_000_000, category: '보너스', memo: '상반기 성과급' });
  add({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2025-09-29', amount: 1_500_000, category: '보너스', memo: '추석 상여' });
  add({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2025-09-29', amount: 1_000_000, category: '보너스', memo: '추석 상여' });
  add({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2025-12-26', amount: 2_500_000, category: '보너스', memo: '연말 성과급' });
  add({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2025-12-28', amount: 1_500_000, category: '보너스', memo: '연말 성과급' });

  // 2026년 명절/성과급
  add({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2026-02-13', amount: 1_500_000, category: '보너스', memo: '설 상여' });
  add({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2026-02-13', amount: 800_000, category: '보너스', memo: '설 상여' });
  add({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2026-04-22', amount: 1_000_000, category: '보너스', memo: '분기 보너스' });

  // 중고판매/기타 누적형 입금
  add({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2025-05-20', amount: 300_000, category: '중고판매', memo: '노트북 처분' });
  add({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2025-08-11', amount: 200_000, category: '중고판매', memo: '옷 처분' });

  // 자취 보증금 — 적금 만기 2건
  add({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2025-08-15', amount: 2_000_000, category: '적금 만기', memo: '1년 적금 만기' });
  add({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-03-20', amount: 3_000_000, category: '적금 만기', memo: '2년 적금 만기' });

  // 맥북 중고판매
  add({ accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-03-22', amount: 50_000, category: '중고판매', memo: '책 판매' });
  add({ accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-04-08', amount: 100_000, category: '중고판매', memo: '이어폰 처분' });

  // 추경 (isSupplement) — 차감형에 예산 확장
  add({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2025-03-15', amount: 120_000, source: '부수입', memo: '3월 부수입 추경', isSupplement: true });
  add({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2025-07-10', amount: 80_000, source: '부수입', memo: '여름 부수입 추경', isSupplement: true });
  add({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2025-09-30', amount: 150_000, source: '추석 보너스', memo: '명절 추경', isSupplement: true });
  add({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2025-12-23', amount: 100_000, source: '부수입', memo: '연말 추경', isSupplement: true });
  add({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-11', amount: 80_000, source: '부수입', memo: '부수입 추경', isSupplement: true });
  add({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-17', amount: 150_000, source: '명절 보너스', memo: '명절 추경', isSupplement: true });

  // 날짜순 정렬 (타임라인 자연스러움)
  transactions.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  return { users, familyGroups, accounts, goals, transactions };
}
