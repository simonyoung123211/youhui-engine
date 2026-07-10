import { useCallback, useEffect, useRef, useState } from 'react';
import { SpecialRule } from '../types';
import {
  querySpecialRules,
  SpecialRuleInteractionFilter,
  SpecialRuleQueryStats,
  SpecialRuleScopeFilter,
  SpecialRuleSortBy,
  SpecialRuleSortDir,
  SpecialRuleStatusFilter,
} from '../utils/specialRuleQuery';
import { useDebouncedValue } from './useDebouncedValue';

export const SPECIAL_RULE_PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type SpecialRulePageSize = (typeof SPECIAL_RULE_PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_SPECIAL_RULE_PAGE_SIZE: SpecialRulePageSize = 50;

export interface SpecialRuleListFilters {
  keyword: string;
  status: SpecialRuleStatusFilter;
  relationScope: SpecialRuleScopeFilter;
  interaction: SpecialRuleInteractionFilter;
  expiredOnly: boolean;
  sortBy: SpecialRuleSortBy;
  sortDir: SpecialRuleSortDir;
  page: number;
  pageSize: number;
}

export function usePaginatedSpecialRules(pool: SpecialRule[], filters: SpecialRuleListFilters) {
  const [items, setItems] = useState<SpecialRule[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<SpecialRuleQueryStats>({
    total: 0,
    enabled: 0,
    disabled: 0,
    intraGroup: 0,
    interGroup: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const debouncedKeyword = useDebouncedValue(filters.keyword, 200);

  const refresh = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    querySpecialRules(pool, {
      keyword: debouncedKeyword,
      status: filters.status,
      relationScope: filters.relationScope,
      interaction: filters.interaction,
      expiredOnly: filters.expiredOnly,
      page: filters.page,
      pageSize: filters.pageSize,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    })
      .then(result => {
        if (requestId !== requestIdRef.current) return;
        setItems(result.items);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setStats(result.stats);
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError('加载失败，请重试');
        setItems([]);
        setTotal(0);
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [
    pool,
    debouncedKeyword,
    filters.status,
    filters.relationScope,
    filters.interaction,
    filters.expiredOnly,
    filters.page,
    filters.pageSize,
    filters.sortBy,
    filters.sortDir,
  ]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const retry = useCallback(() => refresh(), [refresh]);

  return {
    items,
    total,
    totalPages,
    pageSize: filters.pageSize,
    stats,
    loading,
    error,
    retry,
    isDebouncing: filters.keyword !== debouncedKeyword,
  };
}

export function getDefaultSortDir(sortBy: SpecialRuleSortBy): SpecialRuleSortDir {
  if (sortBy === 'name' || sortBy === 'priority') return 'asc';
  return 'desc';
}

export function toggleSort(
  current: Pick<SpecialRuleListFilters, 'sortBy' | 'sortDir'>,
  nextSortBy: SpecialRuleSortBy
): Pick<SpecialRuleListFilters, 'sortBy' | 'sortDir'> {
  if (current.sortBy === nextSortBy) {
    return { sortBy: nextSortBy, sortDir: current.sortDir === 'asc' ? 'desc' : 'asc' };
  }
  return { sortBy: nextSortBy, sortDir: getDefaultSortDir(nextSortBy) };
}
