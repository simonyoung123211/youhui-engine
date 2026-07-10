import { useCallback, useEffect, useRef, useState } from 'react';
import { PromoInstance } from '../types';
import {
  InstanceQueryParams,
  InstanceStatusFilter,
  queryInstances,
} from '../utils/instanceQuery';
import { useDebouncedValue } from './useDebouncedValue';

const DEFAULT_PAGE_SIZE = 50;

export function usePaginatedInstances(
  pool: PromoInstance[],
  categoryId: string | null,
  keyword: string,
  status: InstanceStatusFilter,
  enabled: boolean
) {
  const [items, setItems] = useState<PromoInstance[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const requestIdRef = useRef(0);

  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const reset = useCallback(() => {
    setPage(1);
    setItems([]);
    setTotal(0);
    setHasMore(false);
  }, []);

  useEffect(() => {
    reset();
  }, [categoryId, debouncedKeyword, status, enabled, reset]);

  useEffect(() => {
    if (!enabled || !categoryId) {
      setItems([]);
      setTotal(0);
      setHasMore(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    const params: InstanceQueryParams = {
      categoryId,
      keyword: debouncedKeyword,
      status,
      page,
      pageSize: DEFAULT_PAGE_SIZE,
    };

    queryInstances(pool, params)
      .then(result => {
        if (requestId !== requestIdRef.current) return;
        setTotal(result.total);
        setHasMore(result.hasMore);
        setItems(prev => (page === 1 ? result.items : [...prev, ...result.items]));
      })
      .finally(() => {
        if (requestId === requestIdRef.current) setLoading(false);
      });
  }, [pool, categoryId, debouncedKeyword, status, page, enabled]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setPage(p => p + 1);
  }, [loading, hasMore]);

  return {
    items,
    total,
    loading,
    hasMore,
    loadMore,
    reset,
    isDebouncing: keyword !== debouncedKeyword,
  };
}
