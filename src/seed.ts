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
      linkedAccountIds: [
        'a_dg_goal_apt',
        'a_dg_house',
        'a_sh_house',
      ],
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
      recurringDeposits: [],
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
      name: '4월 생활비',
      emoji: '💰',
      type: '체크카드',
      mode: '차감형',
      recurringDeposits: [
        {
          id: 'r_dg_daily',
          interval: 'monthly',
          dayOfMonth: 1,
          amount: 1_000_000,
          source: '월급',
        },
      ],
      sharing: 'shared-rw',
      sharedWith: ['u_sh'],
      editPolicy: 'any-sharer',
      categories: ['장보기', '공과금', '교통', '외식'],
      budgetAllocations: {
        '2026-04': { 장보기: 250_000, 공과금: 200_000, 교통: 150_000, 외식: 100_000 },
      },
      settlementReminder: { dayOfMonth: 31, enabled: true },
      createdAt: '2026-01-01',
    },
    {
      id: 'a_dg_allow',
      ownerId: 'u_dg',
      name: '4월 용돈',
      emoji: '👛',
      type: '현금',
      mode: '차감형',
      recurringDeposits: [
        {
          id: 'r_dg_allow',
          interval: 'monthly',
          dayOfMonth: 1,
          amount: 500_000,
          source: '월급',
        },
      ],
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['식사비', '의류', '취미', '여유'],
      budgetAllocations: {
        '2026-04': { 식사비: 200_000, 의류: 100_000, 취미: 100_000, 여유: 100_000 },
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
      initialBalance: 30_000_000,
      recurringDeposits: [],
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
      name: '4월 용돈',
      emoji: '👛',
      type: '현금',
      mode: '차감형',
      recurringDeposits: [
        {
          id: 'r_sh_allow',
          interval: 'monthly',
          dayOfMonth: 1,
          amount: 500_000,
          source: '월급',
        },
      ],
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['식사비', '의류', '취미', '여유'],
      budgetAllocations: {
        '2026-04': { 식사비: 200_000, 의류: 150_000, 취미: 100_000, 여유: 50_000 },
      },
      settlementReminder: { dayOfMonth: 31, enabled: true },
      createdAt: '2026-01-01',
    },
    {
      id: 'a_sh_daily',
      ownerId: 'u_sh',
      name: '4월 생활비',
      emoji: '💰',
      type: '체크카드',
      mode: '차감형',
      recurringDeposits: [
        {
          id: 'r_sh_daily',
          interval: 'monthly',
          dayOfMonth: 1,
          amount: 1_000_000,
          source: '월급',
        },
      ],
      sharing: 'shared-rw',
      sharedWith: ['u_dg'],
      editPolicy: 'any-sharer',
      categories: ['장보기', '공과금', '교통', '외식'],
      budgetAllocations: {
        '2026-04': { 장보기: 300_000, 공과금: 300_000, 교통: 200_000, 외식: 200_000 },
      },
      settlementReminder: { dayOfMonth: 31, enabled: true },
      createdAt: '2026-01-01',
    },
    {
      id: 'a_sh_house',
      ownerId: 'u_sh',
      name: '주택자금',
      emoji: '🏦',
      type: '계좌',
      mode: '누적형',
      initialBalance: 20_000_000,
      recurringDeposits: [],
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
      recurringDeposits: [],
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
      recurringDeposits: [],
      sharing: 'private',
      sharedWith: [],
      editPolicy: 'author-only',
      categories: ['월급 적립', '적금 만기'],
      budgetAllocations: {},
      createdAt: '2026-01-15',
    },
  ];

  const transactions: Transaction[] = [
    // 2026-04-01 정기입금 (동건)
    { id: 't01', accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-01', amount: 1_000_000, source: '월급', autoGenerated: true },
    { id: 't02', accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-01', amount: 500_000, source: '월급', autoGenerated: true },
    // 2026-04-01 정기입금 (송희)
    { id: 't03', accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-01', amount: 1_000_000, source: '월급', autoGenerated: true },
    { id: 't04', accountId: 'a_sh_allow', authorId: 'u_sh', date: '2026-04-01', amount: 500_000, source: '월급', autoGenerated: true },
    // 동건 용돈 지출
    { id: 't05', accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-03', amount: -50_000, category: '식사비', memo: '점심 약속' },
    { id: 't06', accountId: 'a_dg_allow', authorId: 'u_dg', date: '2026-04-05', amount: -20_000, category: '의류', memo: '양말/속옷' },
    // 동건 생활비 지출 (공유)
    { id: 't07', accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-10', amount: -80_000, category: '장보기', memo: '이마트' },
    { id: 't08', accountId: 'a_dg_daily', authorId: 'u_dg', date: '2026-04-13', amount: -35_000, category: '외식', memo: '배달' },
    // 송희가 동건 생활비에 기록 (shared-rw)
    { id: 't09', accountId: 'a_dg_daily', authorId: 'u_sh', date: '2026-04-15', amount: -150_000, category: '공과금', memo: '4월 관리비' },
    // 송희 본인 생활비
    { id: 't10', accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-08', amount: -45_000, category: '외식', memo: '친구 식사' },
    { id: 't11', accountId: 'a_sh_daily', authorId: 'u_sh', date: '2026-04-12', amount: -120_000, category: '장보기', memo: '홈플러스' },
    // 송희 맥북 누적
    { id: 't12', accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-03-15', amount: 50_000, category: '월급 적립' },
    { id: 't13', accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-04-08', amount: 100_000, category: '중고판매', memo: '이어폰 처분' },
    { id: 't14', accountId: 'a_sh_mac', authorId: 'u_sh', date: '2026-04-15', amount: 50_000, category: '월급 적립' },
    // 송희 자취 보증금
    { id: 't15', accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-02-01', amount: 500_000, category: '월급 적립' },
    { id: 't16', accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-03-01', amount: 500_000, category: '월급 적립' },
    { id: 't17', accountId: 'a_sh_deposit', authorId: 'u_sh', date: '2026-04-01', amount: 500_000, category: '월급 적립' },
    // 동건 아파트 목표 계좌
    { id: 't18', accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: '2026-02-01', amount: 500_000, category: '월급 적립' },
    { id: 't19', accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: '2026-03-01', amount: 500_000, category: '월급 적립' },
    { id: 't20', accountId: 'a_dg_goal_apt', authorId: 'u_dg', date: '2026-04-01', amount: 500_000, category: '월급 적립' },
  ];

  return { users, familyGroups, accounts, goals, transactions };
}
