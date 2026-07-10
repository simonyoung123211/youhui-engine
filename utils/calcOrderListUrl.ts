import { PromoGroup } from '../types';
import { CalcOrderGroupFilter } from './calcOrderReorder';

export interface CalcOrderListUrlState {
  keyword: string;
  group: CalcOrderGroupFilter;
  adjustedOnly: boolean;
}

export const DEFAULT_CALC_ORDER_LIST_URL_STATE: CalcOrderListUrlState = {
  keyword: '',
  group: 'ALL',
  adjustedOnly: false,
};

const KEYS = {
  keyword: 'co_q',
  group: 'co_group',
  adjusted: 'co_adj',
} as const;

const VALID_GROUPS = new Set<CalcOrderGroupFilter>(['ALL', ...Object.values(PromoGroup)]);

export function parseCalcOrderListUrl(search: string): CalcOrderListUrlState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const group = params.get(KEYS.group) as CalcOrderGroupFilter | null;
  return {
    keyword: params.get(KEYS.keyword) ?? DEFAULT_CALC_ORDER_LIST_URL_STATE.keyword,
    group: group && VALID_GROUPS.has(group) ? group : DEFAULT_CALC_ORDER_LIST_URL_STATE.group,
    adjustedOnly: params.get(KEYS.adjusted) === '1',
  };
}

export function serializeCalcOrderListUrl(state: CalcOrderListUrlState): string {
  const params = new URLSearchParams();
  const base = DEFAULT_CALC_ORDER_LIST_URL_STATE;
  if (state.keyword.trim()) params.set(KEYS.keyword, state.keyword.trim());
  if (state.group !== base.group) params.set(KEYS.group, state.group);
  if (state.adjustedOnly) params.set(KEYS.adjusted, '1');
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function applyCalcOrderListUrl(state: CalcOrderListUrlState): void {
  const qs = serializeCalcOrderListUrl(state);
  const url = `${window.location.pathname}${qs}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', url);
}

export function readCalcOrderListUrl(): CalcOrderListUrlState {
  return parseCalcOrderListUrl(window.location.search);
}
