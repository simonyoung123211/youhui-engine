import {
  DEFAULT_SPECIAL_RULE_PAGE_SIZE,
  SpecialRulePageSize,
  SPECIAL_RULE_PAGE_SIZE_OPTIONS,
} from '../hooks/usePaginatedSpecialRules';
import { InteractionType } from '../types';
import {
  SpecialRuleInteractionFilter,
  SpecialRuleScopeFilter,
  SpecialRuleSortBy,
  SpecialRuleSortDir,
  SpecialRuleStatusFilter,
} from './specialRuleQuery';

export interface SpecialRuleListUrlState {
  keyword: string;
  status: SpecialRuleStatusFilter;
  relationScope: SpecialRuleScopeFilter;
  interaction: SpecialRuleInteractionFilter;
  expiredOnly: boolean;
  page: number;
  pageSize: number;
  sortBy: SpecialRuleSortBy;
  sortDir: SpecialRuleSortDir;
}

export const DEFAULT_SPECIAL_RULE_LIST_URL_STATE: SpecialRuleListUrlState = {
  keyword: '',
  status: 'ALL',
  relationScope: 'ALL',
  interaction: 'ALL',
  expiredOnly: false,
  page: 1,
  pageSize: DEFAULT_SPECIAL_RULE_PAGE_SIZE,
  sortBy: 'updatedAt',
  sortDir: 'desc',
};

const KEYS = {
  keyword: 'sr_q',
  status: 'sr_status',
  scope: 'sr_scope',
  interaction: 'sr_interaction',
  expired: 'sr_expired',
  page: 'sr_page',
  pageSize: 'sr_ps',
  sortBy: 'sr_sort',
  sortDir: 'sr_dir',
} as const;

const VALID_STATUS = new Set<SpecialRuleStatusFilter>(['ALL', 'ENABLED', 'DISABLED']);
const VALID_SCOPE = new Set<SpecialRuleScopeFilter>(['ALL', 'INTRA_GROUP', 'INTER_GROUP']);
const VALID_INTERACTION = new Set<SpecialRuleInteractionFilter>([
  'ALL',
  InteractionType.MUTEX,
  InteractionType.ITEM_MUTEX,
  InteractionType.ALLOW,
  InteractionType.OVERWRITE,
]);
const VALID_SORT_BY = new Set<SpecialRuleSortBy>(['updatedAt', 'createdAt', 'priority', 'name']);
const VALID_SORT_DIR = new Set<SpecialRuleSortDir>(['asc', 'desc']);

const VALID_PAGE_SIZES = new Set<number>(SPECIAL_RULE_PAGE_SIZE_OPTIONS);

function parsePageSize(raw: string | null): SpecialRulePageSize {
  if (!raw) return DEFAULT_SPECIAL_RULE_PAGE_SIZE;
  const n = Number.parseInt(raw, 10);
  return VALID_PAGE_SIZES.has(n) ? (n as SpecialRulePageSize) : DEFAULT_SPECIAL_RULE_PAGE_SIZE;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function parseSpecialRuleListUrl(search: string): SpecialRuleListUrlState {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const status = params.get(KEYS.status) as SpecialRuleStatusFilter | null;
  const scope = params.get(KEYS.scope) as SpecialRuleScopeFilter | null;
  const interaction = params.get(KEYS.interaction) as SpecialRuleInteractionFilter | null;
  const sortBy = params.get(KEYS.sortBy) as SpecialRuleSortBy | null;
  const sortDir = params.get(KEYS.sortDir) as SpecialRuleSortDir | null;

  return {
    keyword: params.get(KEYS.keyword) ?? DEFAULT_SPECIAL_RULE_LIST_URL_STATE.keyword,
    status: status && VALID_STATUS.has(status) ? status : DEFAULT_SPECIAL_RULE_LIST_URL_STATE.status,
    relationScope:
      scope && VALID_SCOPE.has(scope) ? scope : DEFAULT_SPECIAL_RULE_LIST_URL_STATE.relationScope,
    interaction:
      interaction && VALID_INTERACTION.has(interaction)
        ? interaction
        : DEFAULT_SPECIAL_RULE_LIST_URL_STATE.interaction,
    expiredOnly: params.get(KEYS.expired) === '1',
    page: parsePositiveInt(params.get(KEYS.page), DEFAULT_SPECIAL_RULE_LIST_URL_STATE.page),
    pageSize: parsePageSize(params.get(KEYS.pageSize)),
    sortBy:
      sortBy && VALID_SORT_BY.has(sortBy) ? sortBy : DEFAULT_SPECIAL_RULE_LIST_URL_STATE.sortBy,
    sortDir:
      sortDir && VALID_SORT_DIR.has(sortDir) ? sortDir : DEFAULT_SPECIAL_RULE_LIST_URL_STATE.sortDir,
  };
}

export function serializeSpecialRuleListUrl(state: SpecialRuleListUrlState): string {
  const params = new URLSearchParams();
  const base = DEFAULT_SPECIAL_RULE_LIST_URL_STATE;

  if (state.keyword.trim()) params.set(KEYS.keyword, state.keyword.trim());
  if (state.status !== base.status) params.set(KEYS.status, state.status);
  if (state.relationScope !== base.relationScope) params.set(KEYS.scope, state.relationScope);
  if (state.interaction !== base.interaction) params.set(KEYS.interaction, state.interaction);
  if (state.expiredOnly) params.set(KEYS.expired, '1');
  if (state.page !== base.page) params.set(KEYS.page, String(state.page));
  if (state.pageSize !== base.pageSize) params.set(KEYS.pageSize, String(state.pageSize));
  if (state.sortBy !== base.sortBy) params.set(KEYS.sortBy, state.sortBy);
  if (state.sortDir !== base.sortDir) params.set(KEYS.sortDir, state.sortDir);

  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function applySpecialRuleListUrl(state: SpecialRuleListUrlState): void {
  const qs = serializeSpecialRuleListUrl(state);
  const url = `${window.location.pathname}${qs}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', url);
}

export function readSpecialRuleListUrl(): SpecialRuleListUrlState {
  return parseSpecialRuleListUrl(window.location.search);
}
