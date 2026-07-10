import { PromoGroup, PromoScope, PromotionCategory, getDefaultPriority } from '../types';

export type CalcOrderGroupFilter = 'ALL' | PromoGroup;
export type CalcOrderScopeFilter = 'ALL' | PromoScope;

export interface CalcOrderListItem {
  id: string;
  globalIndex: number;
  category: PromotionCategory;
  defaultGlobalIndex: number;
  isAdjusted: boolean;
}

export function areCalcOrderListsEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

export function buildCalcOrderItems(
  list: string[],
  categories: PromotionCategory[],
  defaultList?: string[]
): CalcOrderListItem[] {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const defaultOrder = defaultList ?? getDefaultPriority(categories);
  const defaultIndexMap = new Map(defaultOrder.map((id, i) => [id, i + 1]));

  return list
    .map((id, i) => {
      const category = catMap.get(id);
      if (!category) return null;
      const defaultGlobalIndex = defaultIndexMap.get(id) ?? i + 1;
      const globalIndex = i + 1;
      return {
        id,
        globalIndex,
        category,
        defaultGlobalIndex,
        isAdjusted: defaultGlobalIndex !== globalIndex,
      };
    })
    .filter((x): x is CalcOrderListItem => x !== null);
}

export function getAdjustedCategoryIds(list: string[], categories: PromotionCategory[]): string[] {
  const defaultList = getDefaultPriority(categories);
  const defaultIndexMap = new Map(defaultList.map((id, i) => [id, i]));
  return list.filter((id, i) => defaultIndexMap.get(id) !== i);
}

export interface CalcOrderPositionChange {
  id: string;
  name: string;
  fromIndex: number;
  toIndex: number;
  scope: PromoScope;
}

export function computeCalcOrderChanges(
  before: string[],
  after: string[],
  categories: PromotionCategory[]
): CalcOrderPositionChange[] {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const beforeIndex = new Map(before.map((id, i) => [id, i + 1]));
  const changes: CalcOrderPositionChange[] = [];

  after.forEach((id, i) => {
    const from = beforeIndex.get(id);
    const to = i + 1;
    if (from !== undefined && from !== to) {
      const cat = catMap.get(id);
      if (cat) {
        changes.push({
          id,
          name: cat.name,
          fromIndex: from,
          toIndex: to,
          scope: cat.defaultScope,
        });
      }
    }
  });

  return changes.sort((a, b) => a.toIndex - b.toIndex);
}

export function reorderCalcOrderByDrag(
  list: string[],
  fromId: string,
  toId: string,
  categories: PromotionCategory[]
): { list: string[]; rejected?: 'CROSS_SCOPE' } {
  if (fromId === toId) return { list };
  const catMap = new Map(categories.map(c => [c.id, c]));
  const fromCat = catMap.get(fromId);
  const toCat = catMap.get(toId);
  if (!fromCat || !toCat) return { list };
  if (fromCat.defaultScope !== toCat.defaultScope) {
    return { list, rejected: 'CROSS_SCOPE' };
  }

  const next = [...list];
  const fromIdx = next.indexOf(fromId);
  const toIdx = next.indexOf(toId);
  if (fromIdx < 0 || toIdx < 0) return { list };
  next.splice(fromIdx, 1);
  next.splice(toIdx, 0, fromId);
  return { list: normalizeCalcOrderByScope(next, categories) };
}

function moveIdsInList(list: string[], ids: string[], targetIndex: number): string[] {
  if (!ids.length) return list;
  const idSet = new Set(ids);
  const picked = list.filter(id => idSet.has(id));
  const rest = list.filter(id => !idSet.has(id));
  const insertAt = Math.max(0, Math.min(targetIndex, rest.length));
  return [...rest.slice(0, insertAt), ...picked, ...rest.slice(insertAt)];
}

export function normalizeCalcOrderByScope(
  list: string[],
  categories: PromotionCategory[]
): string[] {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const itemIds: string[] = [];
  const orderIds: string[] = [];
  const rest: string[] = [];
  list.forEach(id => {
    const scope = catMap.get(id)?.defaultScope;
    if (scope === PromoScope.SINGLE_ITEM) itemIds.push(id);
    else if (scope === PromoScope.ORDER) orderIds.push(id);
    else rest.push(id);
  });
  return [...itemIds, ...orderIds, ...rest];
}

function scopeBounds(
  list: string[],
  categories: PromotionCategory[],
  scope: PromoScope
): { start: number; end: number } {
  const catMap = new Map(categories.map(c => [c.id, c]));
  let start = -1;
  let end = -1;
  list.forEach((id, i) => {
    if (catMap.get(id)?.defaultScope === scope) {
      if (start < 0) start = i;
      end = i;
    }
  });
  if (start < 0) return { start: list.length, end: list.length };
  return { start, end: end + 1 };
}

export function clampTargetIndexToScope(
  list: string[],
  categories: PromotionCategory[],
  ids: string[],
  targetIndex: number
): number {
  if (!ids.length) return targetIndex;
  const catMap = new Map(categories.map(c => [c.id, c]));
  const scope = catMap.get(ids[0])?.defaultScope;
  if (!scope) return targetIndex;
  const { start, end } = scopeBounds(list, categories, scope);
  return Math.max(start, Math.min(targetIndex, end));
}

export function moveCalcOrderToTop(list: string[], ids: string[], categories: PromotionCategory[]): string[] {
  if (!ids.length) return list;
  const catMap = new Map(categories.map(c => [c.id, c]));
  const scope = catMap.get(ids[0])?.defaultScope;
  if (!scope) return list;
  const { start } = scopeBounds(list, categories, scope);
  return moveIdsInList(list, ids, start);
}

export function moveCalcOrderToBottom(list: string[], ids: string[], categories: PromotionCategory[]): string[] {
  if (!ids.length) return list;
  const catMap = new Map(categories.map(c => [c.id, c]));
  const scope = catMap.get(ids[0])?.defaultScope;
  if (!scope) return list;
  const { end } = scopeBounds(list, categories, scope);
  const idSet = new Set(ids);
  const picked = list.filter(id => idSet.has(id));
  const rest = list.filter(id => !idSet.has(id));
  const insertAt = Math.min(end - picked.length, rest.length);
  return normalizeCalcOrderByScope([...rest.slice(0, insertAt), ...picked, ...rest.slice(insertAt)], categories);
}

/** @param targetIndex 0-based，选中块将插入到该位置（限定在同阶段内） */
export function moveCalcOrderToIndex(
  list: string[],
  ids: string[],
  targetIndex: number,
  categories: PromotionCategory[]
): string[] {
  const clamped = clampTargetIndexToScope(list, categories, ids, targetIndex);
  return normalizeCalcOrderByScope(moveIdsInList(list, ids, clamped), categories);
}

export function moveCalcOrderByOffset(
  list: string[],
  ids: string[],
  delta: number,
  categories: PromotionCategory[]
): string[] {
  if (!ids.length || delta === 0) return list;
  const idSet = new Set(ids);
  const firstIdx = list.findIndex(id => idSet.has(id));
  if (firstIdx < 0) return list;
  const target = clampTargetIndexToScope(list, categories, ids, firstIdx + delta);
  return moveCalcOrderToIndex(list, ids, target, categories);
}

export function filterCalcOrderItems(
  items: CalcOrderListItem[],
  opts: {
    keyword: string;
    group: CalcOrderGroupFilter;
    scope: CalcOrderScopeFilter;
    adjustedOnly: boolean;
  }
): CalcOrderListItem[] {
  const q = opts.keyword.trim().toLowerCase();
  return items.filter(item => {
    if (opts.scope !== 'ALL' && item.category.defaultScope !== opts.scope) return false;
    if (opts.group !== 'ALL' && item.category.group !== opts.group) return false;
    if (opts.adjustedOnly && !item.isAdjusted) return false;
    if (!q) return true;
    const c = item.category;
    return (
      c.name.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.group.toLowerCase().includes(q)
    );
  });
}

export function detectNewCategoryIds(
  categories: PromotionCategory[],
  knownIds: Set<string> | undefined
): string[] {
  if (!knownIds) return [];
  return categories.map(c => c.id).filter(id => !knownIds.has(id));
}

export function splitByScope(items: CalcOrderListItem[]): {
  itemLevel: CalcOrderListItem[];
  orderLevel: CalcOrderListItem[];
} {
  return {
    itemLevel: items.filter(i => i.category.defaultScope === PromoScope.SINGLE_ITEM),
    orderLevel: items.filter(i => i.category.defaultScope === PromoScope.ORDER),
  };
}

export const GROUP_PRIORITY_RATIONALE: { group: PromoGroup; itemHint: string; orderHint: string }[] = [
  { group: PromoGroup.MEMBER, itemHint: '改价类优先', orderHint: '权益类靠前' },
  { group: PromoGroup.ACTIVITY, itemHint: '营销活动居中', orderHint: '满减等活动' },
  { group: PromoGroup.ASSET, itemHint: '券/卡类靠后', orderHint: '代金券等' },
  { group: PromoGroup.POS, itemHint: 'POS 自定义', orderHint: 'POS 整单' },
  { group: PromoGroup.PLATFORM, itemHint: '平台团购', orderHint: '平台券' },
  { group: PromoGroup.PAYMENT, itemHint: '支付最后', orderHint: '支付最后' },
];
