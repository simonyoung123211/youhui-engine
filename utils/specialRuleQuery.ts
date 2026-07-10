import {
  InteractionType,
  RuleRelationScope,
  SpecialRule,
  SpecialRuleStatus,
} from '../types';

export type SpecialRuleStatusFilter = 'ALL' | SpecialRuleStatus;
export type SpecialRuleScopeFilter = 'ALL' | RuleRelationScope;
export type SpecialRuleInteractionFilter = 'ALL' | InteractionType;
export type SpecialRuleSortBy = 'updatedAt' | 'createdAt' | 'priority' | 'name';
export type SpecialRuleSortDir = 'asc' | 'desc';

export interface SpecialRuleQueryParams {
  keyword?: string;
  status?: SpecialRuleStatusFilter;
  relationScope?: SpecialRuleScopeFilter;
  interaction?: SpecialRuleInteractionFilter;
  expiredOnly?: boolean;
  page: number;
  pageSize: number;
  sortBy?: SpecialRuleSortBy;
  sortDir?: SpecialRuleSortDir;
}

export interface SpecialRuleQueryStats {
  total: number;
  enabled: number;
  disabled: number;
  intraGroup: number;
  interGroup: number;
}

export interface SpecialRuleQueryResult {
  items: SpecialRule[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: SpecialRuleQueryStats;
}

const QUERY_DELAY_MS = 100;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function matchesKeyword(rule: SpecialRule, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  if (rule.name.toLowerCase().includes(q) || rule.id.toLowerCase().includes(q)) return true;
  const members = [...rule.sideA, ...(rule.sideB ?? [])];
  return members.some(m => m.refName.toLowerCase().includes(q) || m.refId.toLowerCase().includes(q));
}

export function filterSpecialRulesLocally(
  pool: SpecialRule[],
  params: Pick<
    SpecialRuleQueryParams,
    'keyword' | 'status' | 'relationScope' | 'interaction' | 'expiredOnly'
  >
): SpecialRule[] {
  return pool.filter(rule => {
    if (params.status && params.status !== 'ALL' && rule.status !== params.status) return false;
    if (
      params.relationScope &&
      params.relationScope !== 'ALL' &&
      rule.relationScope !== params.relationScope
    ) {
      return false;
    }
    if (
      params.interaction &&
      params.interaction !== 'ALL' &&
      rule.interaction !== params.interaction
    ) {
      return false;
    }
    if (params.expiredOnly) {
      const hasExpired = [...rule.sideA, ...(rule.sideB ?? [])].some(m => m.expired);
      if (!hasExpired) return false;
    }
    if (!matchesKeyword(rule, params.keyword ?? '')) return false;
    return true;
  });
}

function sortRules(
  rules: SpecialRule[],
  sortBy: SpecialRuleSortBy = 'updatedAt',
  sortDir: SpecialRuleSortDir = 'desc'
): SpecialRule[] {
  const dir = sortDir === 'asc' ? 1 : -1;
  return [...rules].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'zh-CN') * dir;
    }
    if (sortBy === 'priority') {
      const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
      const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
      return (pa - pb) * dir;
    }
    const field = sortBy === 'createdAt' ? 'createdAt' : 'updatedAt';
    return (Date.parse(a[field]) - Date.parse(b[field])) * dir;
  });
}

export function computeSpecialRuleStats(rules: SpecialRule[]): SpecialRuleQueryStats {
  let enabled = 0;
  let disabled = 0;
  let intraGroup = 0;
  let interGroup = 0;
  rules.forEach(r => {
    if (r.status === 'ENABLED') enabled += 1;
    else disabled += 1;
    if (r.relationScope === 'INTRA_GROUP') intraGroup += 1;
    else interGroup += 1;
  });
  return { total: rules.length, enabled, disabled, intraGroup, interGroup };
}

/** 状态 Tab 计数：应用除 status 外的全部筛选 */
export function computeStatusTabCounts(
  pool: SpecialRule[],
  params: Pick<SpecialRuleQueryParams, 'keyword' | 'relationScope' | 'interaction' | 'expiredOnly'>
): { all: number; enabled: number; disabled: number } {
  const filtered = filterSpecialRulesLocally(pool, {
    ...params,
    status: 'ALL',
  });
  let enabled = 0;
  let disabled = 0;
  filtered.forEach(r => {
    if (r.status === 'ENABLED') enabled += 1;
    else disabled += 1;
  });
  return { all: filtered.length, enabled, disabled };
}

/** 模拟服务端分页查询（可替换为真实 API） */
export async function querySpecialRules(
  pool: SpecialRule[],
  params: SpecialRuleQueryParams
): Promise<SpecialRuleQueryResult> {
  await delay(QUERY_DELAY_MS);
  const filtered = sortRules(
    filterSpecialRulesLocally(pool, params),
    params.sortBy,
    params.sortDir
  );
  const stats = computeSpecialRuleStats(filtered);
  const totalPages = Math.max(1, Math.ceil(filtered.length / params.pageSize));
  const page = Math.min(Math.max(1, params.page), totalPages);
  const start = (page - 1) * params.pageSize;
  const items = filtered.slice(start, start + params.pageSize);
  return {
    items,
    total: filtered.length,
    page,
    pageSize: params.pageSize,
    totalPages,
    stats,
  };
}

export { InteractionType };
