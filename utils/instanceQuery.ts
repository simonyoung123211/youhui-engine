import { PromoInstance, PromoInstanceStatus, PromotionCategory } from '../types';
import { isTypeOnlyCategory } from '../data/promotionCategories';

export type InstanceStatusFilter = 'ALL' | PromoInstanceStatus;

export interface InstanceQueryParams {
  categoryId: string;
  keyword?: string;
  status?: InstanceStatusFilter;
  page: number;
  pageSize: number;
}

export interface InstanceQueryResult {
  items: PromoInstance[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const QUERY_DELAY_MS = 120;

function resolveInstanceStatus(inst: PromoInstance): PromoInstanceStatus {
  if (inst.status === 'DISABLED') return 'DISABLED';
  const now = Date.now();
  const start = inst.effectiveStart ? Date.parse(inst.effectiveStart) : NaN;
  const end = inst.effectiveEnd ? Date.parse(inst.effectiveEnd) : NaN;
  if (Number.isFinite(end) && end < now) return 'EXPIRED';
  if (Number.isFinite(start) && start > now) return 'PENDING';
  return inst.status ?? 'ENABLED';
}

export function filterInstancesLocally(
  pool: PromoInstance[],
  params: Pick<InstanceQueryParams, 'categoryId' | 'keyword' | 'status'>
): PromoInstance[] {
  return filterInstances(pool, params);
}

function filterInstances(
  pool: PromoInstance[],
  params: Pick<InstanceQueryParams, 'categoryId' | 'keyword' | 'status'>
): PromoInstance[] {
  const keyword = params.keyword?.trim().toLowerCase() ?? '';
  return pool.filter(inst => {
    if (inst.categoryId !== params.categoryId) return false;
    if (keyword) {
      const match =
        inst.name.toLowerCase().includes(keyword) || inst.id.toLowerCase().includes(keyword);
      if (!match) return false;
    }
    if (params.status && params.status !== 'ALL' && resolveInstanceStatus(inst) !== params.status) {
      return false;
    }
    return true;
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** 模拟服务端分页查询（可替换为真实 API） */
export async function queryInstances(
  pool: PromoInstance[],
  params: InstanceQueryParams
): Promise<InstanceQueryResult> {
  await delay(QUERY_DELAY_MS);
  const filtered = filterInstances(pool, params);
  const start = (params.page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);
  return {
    items,
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
    hasMore: start + items.length < filtered.length,
  };
}

/** 获取当前筛选条件下的全部实例（用于「全选当前列表」） */
export async function queryAllFilteredInstances(
  pool: PromoInstance[],
  params: Omit<InstanceQueryParams, 'page' | 'pageSize'>
): Promise<PromoInstance[]> {
  await delay(QUERY_DELAY_MS);
  return filterInstances(pool, params);
}

export interface QuickSearchHit {
  kind: 'TYPE' | 'INSTANCE';
  category: PromotionCategory;
  instance?: PromoInstance;
  label: string;
  sublabel: string;
  typeOnly?: boolean;
}

export interface QuickSearchResult {
  types: QuickSearchHit[];
  instances: QuickSearchHit[];
  totalTypes: number;
  totalInstances: number;
}

const QUICK_TYPE_LIMIT = 6;
const QUICK_INSTANCE_LIMIT = 10;

/** 全局快捷搜索（类型 + 实例） */
export async function quickSearchPicker(
  pool: PromoInstance[],
  categories: PromotionCategory[],
  keyword: string,
  groupFilter?: string
): Promise<QuickSearchResult> {
  await delay(80);
  const q = keyword.trim().toLowerCase();
  if (!q) {
    return { types: [], instances: [], totalTypes: 0, totalInstances: 0 };
  }

  const catMap = new Map(categories.map(c => [c.id, c]));
  const typeHits: QuickSearchHit[] = [];
  const instanceHits: QuickSearchHit[] = [];

  categories.forEach(cat => {
    if (groupFilter && groupFilter !== 'ALL' && cat.group !== groupFilter) return;
    const match =
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.group.toLowerCase().includes(q);
    if (match) {
      const typeOnly = isTypeOnlyCategory(cat);
      typeHits.push({
        kind: 'TYPE',
        category: cat,
        label: cat.name,
        sublabel: typeOnly ? `${cat.group} · 仅类型` : cat.group,
        typeOnly,
      });
    }
  });

  pool.forEach(inst => {
    const cat = catMap.get(inst.categoryId);
    if (!cat || isTypeOnlyCategory(cat)) return;
    if (groupFilter && groupFilter !== 'ALL' && cat.group !== groupFilter) return;
    const match = inst.name.toLowerCase().includes(q) || inst.id.toLowerCase().includes(q);
    if (!match) return;
    instanceHits.push({
      kind: 'INSTANCE',
      category: cat,
      instance: inst,
      label: inst.name,
      sublabel: `${cat.name} · ${inst.id}`,
    });
  });

  return {
    types: typeHits.slice(0, QUICK_TYPE_LIMIT),
    instances: instanceHits.slice(0, QUICK_INSTANCE_LIMIT),
    totalTypes: typeHits.length,
    totalInstances: instanceHits.length,
  };
}

export { resolveInstanceStatus };
