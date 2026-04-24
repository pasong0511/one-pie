import { MainCategory } from '../types';

// 기본 카테고리 택소노미. 새로 가입한 사용자 / 초기화 시 이 셋이 세팅됨.
// label은 중복되면 안 됨 (같은 kind 내에서). 거래 기록 시 sub label이
// transaction.category에 저장되므로 서브 label 유니크성도 권장.
const m = (
  id: string,
  kind: 'expense' | 'income',
  emoji: string,
  label: string,
  subs: string[],
): MainCategory => ({
  id,
  kind,
  emoji,
  label,
  subs: subs.map((s, i) => ({ id: `${id}_s${i}`, label: s })),
});

export const DEFAULT_CATEGORY_TAXONOMY: MainCategory[] = [
  // 지출
  m('exp_food', 'expense', '🍚', '식비', ['외식', '배달', '카페', '간식', '마트', '편의점']),
  m('exp_transport', 'expense', '🚌', '교통', ['버스', '지하철', '택시', '주유', '차량 유지비', '항공편', '배']),
  m('exp_living', 'expense', '🏠', '생활/주거', ['공과금', '통신비', '관리비', '월세', '생활용품', '가전', '가구']),
  m('exp_fashion', 'expense', '💄', '패션/미용', [
    '의류',
    '화장품',
    '미용실/네일',
    '잡화/액세서리',
    '피부관리/시술',
    '향수',
    '렌즈/안경',
    '패션 구독',
    '스타일링 서비스',
    '성형/시술',
  ]),
  m('exp_leisure', 'expense', '🎬', '여가/문화', [
    '영화',
    '여행',
    '취미',
    '구독서비스',
    '공연/전시',
    '테마파크/체험',
    '문화센터',
    '스포츠 관람',
    '게임/콘텐츠',
    '사진촬영',
    '음악/악기',
  ]),
  m('exp_family', 'expense', '🎁', '가족/경조사', [
    '경조사',
    '축의금',
    '부의금',
    '조의금',
    '선물',
    '생일 선물',
    '부모님 용돈',
    '어린이날/명절 용돈',
    '모임 회비',
    '돌잔치/결혼식',
  ]),
  m('exp_health', 'expense', '💊', '건강', ['병원', '약국', '건강보조식품', '보험료']),
  m('exp_edu', 'expense', '📚', '교육', ['학원비', '도서', '자기계발', '자녀 교육']),
  m('exp_finance', 'expense', '💰', '금융/저축', ['카드대금', '적금', '투자', '기부', '대출금']),
  m('exp_etc', 'expense', '📦', '기타', []),

  // 수입
  m('inc_salary', 'income', '💼', '월급', ['월급']),
  m('inc_side', 'income', '👩‍💻', '부수입', ['중고 거래', '리셀 수익', '디지털 창작 수익', 'N잡 수입']),
  m('inc_allowance', 'income', '🎁', '용돈', ['부모님 용돈', '배우자 용돈', '친구/지인', '현금 선물']),
  m('inc_bonus', 'income', '💵', '상여', ['연말 보너스', '명절 상여', '성과급', '기타 상여금']),
  m('inc_invest', 'income', '📈', '금융소득', ['이자 수익', '배당금', '주식/코인 매도차익', '펀드/ETF 수익']),
  m('inc_carryover', 'income', '📅', '이월', ['이월']),
  m('inc_etc', 'income', '📦', '기타', ['기타 현금 유입', '환급금', '보험금']),
];
