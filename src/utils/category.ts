import { MainCategory, SubCategory } from '../types';

// 서브 label로 메인/서브를 찾음 (첫 매칭). 거래의 category 필드가 서브 label을
// 저장하므로, 화면 표시용으로 메인 정보를 되찾을 때 사용.
export function findCategoryPath(
  taxonomy: MainCategory[],
  subLabel: string | undefined | null,
): { main: MainCategory; sub: SubCategory } | null {
  if (!subLabel) return null;
  for (const m of taxonomy) {
    const sub = m.subs.find((s) => s.label === subLabel);
    if (sub) return { main: m, sub };
  }
  return null;
}

// 거래 category 표시용 — "🍚 식비 · 외식" 포맷. 메인을 못 찾으면 서브만 반환.
export function formatCategoryPath(
  taxonomy: MainCategory[],
  subLabel: string | undefined | null,
): string {
  if (!subLabel) return '';
  const hit = findCategoryPath(taxonomy, subLabel);
  if (!hit) return subLabel;
  return `${hit.main.emoji} ${hit.main.label} · ${hit.sub.label}`;
}
