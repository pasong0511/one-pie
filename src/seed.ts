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
      startDate: '2026-01',
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
      createdAt: '2026-01-01',
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
      budgetAllocations: {
        '2026-01': { 장보기: 300_000, 공과금: 250_000, 교통: 150_000, 외식: 200_000 },
        '2026-02': { 장보기: 280_000, 공과금: 220_000, 교통: 160_000, 외식: 240_000 },
        '2026-03': { 장보기: 320_000, 공과금: 260_000, 교통: 170_000, 외식: 200_000 },
        '2026-04': { 장보기: 250_000, 공과금: 200_000, 교통: 150_000, 외식: 100_000 },
      },
      monthlyBudget: {
        '2026-01': 1_000_000,
        '2026-02': 1_000_000,
        '2026-03': 1_050_000,
        '2026-04': 1_000_000,
      },
      settlementReminder: { dayOfMonth: 31, enabled: true },
      lowBalanceAlert: { percent: 20, notify: 'owner' },
      createdAt: '2026-01-01',
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
      budgetAllocations: {
        '2026-01': { 식사비: 200_000, 의류: 100_000, 취미: 100_000, 여유: 100_000 },
        '2026-02': { 식사비: 220_000, 의류: 80_000, 취미: 120_000, 여유: 80_000 },
        '2026-03': { 식사비: 200_000, 의류: 150_000, 취미: 100_000, 여유: 50_000 },
        '2026-04': { 식사비: 200_000, 의류: 100_000, 취미: 100_000, 여유: 100_000 },
      },
      monthlyBudget: {
        '2026-01': 500_000,
        '2026-02': 500_000,
        '2026-03': 500_000,
        '2026-04': 500_000,
      },
      settlementReminder: { dayOfMonth: 31, enabled: true },
      createdAt: '2026-01-01',
    },
    {
      id: 'a_dg_house',
      ownerId: 'u_dg',
      name: '주택자금',
      emoji: '🏦',
      type: '계좌',
      mode: '누적형',
      initialBalance: 28_500_000,
      recurringDeposits: [
        { id: 'r_dg_house', interval: 'monthly', dayOfMonth: 25, amount: 800_000, source: '월급 적립' },
      ],
      goalId: 'goal_apt_2029',
      sharing: 'shared-r',
      sharedWith: ['u_sh'],
      editPolicy: 'author-only',
      categories: ['월급 적립', '보너스', '중고판매', '부모님 지원'],
      budgetAllocations: {},
      createdAt: '2026-01-01',
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
      budgetAllocations: {
        '2026-01': { 식사비: 180_000, 의류: 150_000, 취미: 100_000, 여유: 70_000 },
        '2026-02': { 식사비: 200_000, 의류: 120_000, 취미: 100_000, 여유: 80_000 },
        '2026-03': { 식사비: 200_000, 의류: 100_000, 취미: 120_000, 여유: 80_000 },
        '2026-04': { 식사비: 200_000, 의류: 150_000, 취미: 100_000, 여유: 50_000 },
      },
      monthlyBudget: {
        '2026-01': 500_000,
        '2026-02': 500_000,
        '2026-03': 500_000,
        '2026-04': 500_000,
      },
      settlementReminder: { dayOfMonth: 31, enabled: true },
      createdAt: '2026-01-01',
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
      budgetAllocations: {
        '2026-01': { 장보기: 320_000, 공과금: 280_000, 교통: 180_000, 외식: 220_000 },
        '2026-02': { 장보기: 300_000, 공과금: 260_000, 교통: 200_000, 외식: 240_000 },
        '2026-03': { 장보기: 300_000, 공과금: 300_000, 교통: 200_000, 외식: 200_000 },
        '2026-04': { 장보기: 300_000, 공과금: 300_000, 교통: 200_000, 외식: 200_000 },
      },
      monthlyBudget: {
        '2026-01': 1_000_000,
        '2026-02': 1_000_000,
        '2026-03': 1_000_000,
        '2026-04': 1_000_000,
      },
      settlementReminder: { dayOfMonth: 31, enabled: true },
      lowBalanceAlert: { amount: 150_000, notify: 'all' },
      createdAt: '2026-01-01',
    },
    {
      id: 'a_sh_house',
      ownerId: 'u_sh',
      name: '주택자금',
      emoji: '🏦',
      type: '계좌',
      mode: '누적형',
      initialBalance: 18_800_000,
      recurringDeposits: [
        { id: 'r_sh_house', interval: 'monthly', dayOfMonth: 25, amount: 600_000, source: '월급 적립' },
      ],
      goalId: 'goal_apt_2029',
      sharing: 'shared-r',
      sharedWith: ['u_dg'],
      editPolicy: 'author-only',
      categories: ['월급 적립', '보너스', '중고판매'],
      budgetAllocations: {},
      createdAt: '2026-01-01',
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
      createdAt: '2026-01-15',
    },
  ];

  // 월별 트랜잭션을 읽기 쉽게 구성
  let n = 0;
  const tx = (t: Omit<Transaction, 'id'>): Transaction => ({
    id: `t${String(++n).padStart(3, '0')}`,
    ...t,
  });

  const transactions: Transaction[] = [
    // ─────────────────────────────────────────────────────
    // 2026-01 (1월)
    // ─────────────────────────────────────────────────────
    // 정기입금 (월급)
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-01-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-01-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-01-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: '2026-01-01', amount: 500_000, category: '월급 적립', source: '월급', autoGenerated: true }),

    // 동건 생활비 (공유)
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-05', amount: -75_000, category: '장보기', memo: '이마트 첫 장보기' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-09', amount: -42_000, category: '교통', memo: '교통카드 충전' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-13', amount: -95_000, category: '장보기', memo: '홈플러스' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_sh', date: '2026-01-15', amount: -238_000, category: '공과금', memo: '1월 관리비 + 가스' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-18', amount: -68_000, category: '외식', memo: '주말 외식' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-22', amount: -55_000, category: '장보기', memo: '주간 장보기' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-26', amount: -38_000, category: '외식', memo: '배달' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-01-29', amount: -45_000, category: '교통', memo: '택시' }),

    // 동건 용돈
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-01-04', amount: -12_000, category: '식사비', memo: '점심' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-01-07', amount: -85_000, category: '의류', memo: '셔츠' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-01-12', amount: -25_000, category: '취미', memo: '서점' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-01-17', amount: -40_000, category: '식사비', memo: '팀 점심' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-01-23', amount: -65_000, category: '취미', memo: '게임 구독' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-01-28', amount: -30_000, category: '여유', memo: '주말 커피' }),

    // 송희 생활비 (공유)
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-01-06', amount: -88_000, category: '장보기', memo: '새해 장보기' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-01-11', amount: -55_000, category: '외식', memo: '동료 점심' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-01-14', amount: -180_000, category: '공과금', memo: '통신비' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_dg', date: '2026-01-19', amount: -62_000, category: '교통', memo: 'KTX' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-01-24', amount: -108_000, category: '장보기', memo: '마트' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-01-27', amount: -45_000, category: '외식', memo: '저녁' }),

    // 송희 용돈
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-01-05', amount: -15_000, category: '식사비', memo: '샌드위치' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-01-09', amount: -98_000, category: '의류', memo: '겨울 니트' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-01-15', amount: -42_000, category: '취미', memo: '전시회' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-01-20', amount: -25_000, category: '식사비', memo: '브런치' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-01-25', amount: -55_000, category: '취미', memo: '요가 수업' }),

    // 누적형 - 주택자금 월급 적립
    tx({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2026-01-25', amount: 800_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),
    tx({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2026-01-25', amount: 600_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),

    // 누적형 - 자취 보증금
    tx({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-01-15', amount: 500_000, category: '월급 적립' }),

    // ─────────────────────────────────────────────────────
    // 2026-02 (2월)
    // ─────────────────────────────────────────────────────
    // 정기입금
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-02-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-02-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: '2026-02-01', amount: 500_000, category: '월급 적립', source: '월급', autoGenerated: true }),

    // 동건 생활비
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-03', amount: -92_000, category: '장보기', memo: '이마트' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-06', amount: -35_000, category: '외식', memo: '점심 약속' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-10', amount: -50_000, category: '교통', memo: '교통카드' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_sh', date: '2026-02-13', amount: -205_000, category: '공과금', memo: '2월 관리비' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-17', amount: -125_000, category: '외식', memo: '발렌타인 외식' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-20', amount: -78_000, category: '장보기', memo: '마트' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-25', amount: -48_000, category: '외식', memo: '주말 브런치' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-02-27', amount: -115_000, category: '장보기', memo: '월말 장보기' }),

    // 동건 용돈 — 의류 초과 사례 (추경)
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-05', amount: -22_000, category: '식사비', memo: '점심' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-08', amount: -120_000, category: '의류', memo: '겨울 재킷' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-11', amount: 80_000, category: '보너스', source: '부수입', memo: '부수입 추경', isSupplement: true }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-14', amount: -65_000, category: '취미', memo: '콘서트 티켓' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-18', amount: -38_000, category: '식사비', memo: '커피+브런치' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-02-22', amount: -52_000, category: '여유', memo: '친구 생일 선물' }),

    // 송희 생활비
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-02-04', amount: -72_000, category: '장보기', memo: '홈플러스' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-02-07', amount: -52_000, category: '외식', memo: '동료 점심' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-02-12', amount: -195_000, category: '공과금', memo: '통신비+보험' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-02-16', amount: -88_000, category: '교통', memo: '출장 택시' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_dg', date: '2026-02-19', amount: -95_000, category: '장보기', memo: '식재료' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-02-23', amount: -60_000, category: '외식', memo: '저녁 외식' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-02-26', amount: -82_000, category: '장보기', memo: '월말 마트' }),

    // 송희 용돈
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-02-06', amount: -32_000, category: '식사비', memo: '외식' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-02-10', amount: -75_000, category: '의류', memo: '봄 블라우스' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-02-14', amount: -55_000, category: '취미', memo: '도서 구매' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-02-18', amount: -28_000, category: '식사비', memo: '샐러드' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-02-22', amount: -48_000, category: '여유', memo: '엄마 선물' }),

    // 누적형
    tx({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2026-02-25', amount: 800_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),
    tx({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2026-02-25', amount: 600_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),
    tx({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-02-01', amount: 500_000, category: '월급 적립' }),
    tx({ accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-02-15', amount: 80_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),

    // ─────────────────────────────────────────────────────
    // 2026-03 (3월)
    // ─────────────────────────────────────────────────────
    // 정기입금
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-03-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-03-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: '2026-03-01', amount: 500_000, category: '월급 적립', source: '월급', autoGenerated: true }),

    // 동건 생활비 — 추경 포함
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-04', amount: -85_000, category: '장보기', memo: '이마트' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-07', amount: -58_000, category: '교통', memo: '주말 드라이브' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-10', amount: -72_000, category: '외식', memo: '회식 보너스' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_sh', date: '2026-03-14', amount: -248_000, category: '공과금', memo: '3월 관리비' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-17', amount: 150_000, category: '보너스', source: '명절 보너스', memo: '명절 추경', isSupplement: true }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-19', amount: -105_000, category: '외식', memo: '가족 외식' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-22', amount: -110_000, category: '장보기', memo: '명절 장보기' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-26', amount: -48_000, category: '교통', memo: '택시' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-03-29', amount: -82_000, category: '장보기', memo: '월말 장보기' }),

    // 동건 용돈
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-03-05', amount: -18_000, category: '식사비', memo: '점심' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-03-09', amount: -145_000, category: '의류', memo: '봄 재킷' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-03-13', amount: -35_000, category: '취미', memo: '영화' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-03-18', amount: -52_000, category: '식사비', memo: '저녁' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-03-24', amount: -60_000, category: '취미', memo: '게임 구독' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-03-30', amount: -38_000, category: '여유', memo: '부모님 식사' }),

    // 송희 생활비
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-03', amount: -94_000, category: '장보기', memo: '홈플러스' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-06', amount: -48_000, category: '외식', memo: '점심' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-11', amount: -215_000, category: '공과금', memo: '통신비+인터넷' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_dg', date: '2026-03-15', amount: -62_000, category: '교통', memo: '주말 외출' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-19', amount: -112_000, category: '장보기', memo: '식재료 대량' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-23', amount: -78_000, category: '외식', memo: '주말 외식' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-27', amount: -55_000, category: '교통', memo: '택시' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-03-30', amount: -95_000, category: '장보기', memo: '월말 마트' }),

    // 송희 용돈
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-03-04', amount: -28_000, category: '식사비', memo: '브런치' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-03-08', amount: -85_000, category: '의류', memo: '봄 원피스' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-03-14', amount: -65_000, category: '취미', memo: '피아노 레슨' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-03-20', amount: -32_000, category: '식사비', memo: '저녁' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-03-26', amount: -42_000, category: '취미', memo: '요가' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-03-29', amount: -35_000, category: '여유', memo: '친구 선물' }),

    // 누적형 — 보너스 포함
    tx({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2026-03-25', amount: 800_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),
    tx({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2026-03-17', amount: 1_500_000, category: '보너스', source: '명절 보너스', memo: '설 상여' }),
    tx({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2026-03-25', amount: 600_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),
    tx({ accountId: 'a_sh_house', authorId: 'u_sh', date: '2026-03-18', amount: 800_000, category: '보너스', source: '명절 보너스' }),

    // 자취 보증금 — 적금 만기
    tx({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-03-01', amount: 500_000, category: '월급 적립' }),
    tx({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-03-20', amount: 3_000_000, category: '적금 만기', memo: '2년 적금 만기' }),

    // 맥북
    tx({ accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-03-15', amount: 80_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),

    // ─────────────────────────────────────────────────────
    // 2026-04 (4월, 23일까지 — 오늘 기준)
    // ─────────────────────────────────────────────────────
    // 정기입금
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-01', amount: 1_000_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-04-01', amount: 500_000, source: '월급', autoGenerated: true }),
    tx({ accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: '2026-04-01', amount: 500_000, category: '월급 적립', source: '월급', autoGenerated: true }),

    // 동건 생활비
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-03', amount: -68_000, category: '장보기', memo: '이마트' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-05', amount: -45_000, category: '교통', memo: '교통카드' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-10', amount: -80_000, category: '장보기', memo: '이마트' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-13', amount: -35_000, category: '외식', memo: '배달' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_sh', date: '2026-04-15', amount: -150_000, category: '공과금', memo: '4월 관리비' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-18', amount: -42_000, category: '교통', memo: '택시' }),
    tx({ accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-21', amount: -58_000, category: '장보기', memo: '주간 장보기' }),

    // 동건 용돈
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-03', amount: -50_000, category: '식사비', memo: '점심 약속' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-05', amount: -20_000, category: '의류', memo: '양말/속옷' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-09', amount: -38_000, category: '취미', memo: '책' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-14', amount: -55_000, category: '식사비', memo: '저녁' }),
    tx({ accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-19', amount: -65_000, category: '여유', memo: '친구 생일' }),

    // 송희 생활비
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-04', amount: -85_000, category: '장보기', memo: '마트' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-08', amount: -45_000, category: '외식', memo: '친구 식사' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-12', amount: -120_000, category: '장보기', memo: '홈플러스' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-15', amount: -150_000, category: '공과금', memo: '통신비' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-18', amount: -55_000, category: '교통', memo: '택시' }),
    tx({ accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-22', amount: -72_000, category: '외식', memo: '주말 저녁' }),

    // 송희 용돈
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-04-05', amount: -25_000, category: '식사비', memo: '브런치' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-04-10', amount: -65_000, category: '의류', memo: '봄 티셔츠' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-04-16', amount: -45_000, category: '취미', memo: '전시회' }),
    tx({ accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-04-20', amount: -30_000, category: '식사비', memo: '점심' }),

    // 누적형
    tx({ accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-04-01', amount: 500_000, category: '월급 적립' }),
    tx({ accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-04-08', amount: 100_000, category: '중고판매', memo: '이어폰 처분' }),
    tx({ accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-04-15', amount: 80_000, category: '월급 적립', source: '월급 적립', autoGenerated: true }),
    tx({ accountId: 'a_dg_house', authorId: 'u_dg', date: '2026-04-22', amount: 1_000_000, category: '보너스', memo: '분기 보너스' }),
  ];

  return { users, familyGroups, accounts, goals, transactions };
}
