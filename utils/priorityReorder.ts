import { RuleRelationScope, SpecialRule, SpecialRuleStatus } from '../types';

export function sortRulesByPriority(rules: SpecialRule[]): SpecialRule[] {
  return [...rules].sort((a, b) => {
    const pa = a.priority ?? Number.MAX_SAFE_INTEGER;
    const pb = b.priority ?? Number.MAX_SAFE_INTEGER;
    if (pa !== pb) return pa - pb;
    return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
  });
}

export function normalizePriorities(rules: SpecialRule[]): SpecialRule[] {
  return rules.map((r, i) => ({ ...r, priority: i + 1 }));
}

export function preparePriorityDraft(rules: SpecialRule[]): SpecialRule[] {
  return normalizePriorities(sortRulesByPriority(rules));
}

export function arePriorityOrdersEqual(a: SpecialRule[], b: SpecialRule[]): boolean {
  const orderA = preparePriorityDraft(a).map(r => r.id);
  const orderB = preparePriorityDraft(b).map(r => r.id);
  if (orderA.length !== orderB.length) return false;
  return orderA.every((id, i) => id === orderB[i]);
}

export function reorderByDrag(rules: SpecialRule[], fromId: string, toId: string): SpecialRule[] {
  if (fromId === toId) return rules;
  const list = [...rules];
  const fromIdx = list.findIndex(r => r.id === fromId);
  const toIdx = list.findIndex(r => r.id === toId);
  if (fromIdx < 0 || toIdx < 0) return rules;
  const [moved] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, moved);
  return normalizePriorities(list);
}

export function moveRulesToTop(rules: SpecialRule[], ids: string[]): SpecialRule[] {
  if (!ids.length) return rules;
  const idSet = new Set(ids);
  const picked = rules.filter(r => idSet.has(r.id));
  const rest = rules.filter(r => !idSet.has(r.id));
  return normalizePriorities([...picked, ...rest]);
}

export function moveRulesToBottom(rules: SpecialRule[], ids: string[]): SpecialRule[] {
  if (!ids.length) return rules;
  const idSet = new Set(ids);
  const picked = rules.filter(r => idSet.has(r.id));
  const rest = rules.filter(r => !idSet.has(r.id));
  return normalizePriorities([...rest, ...picked]);
}

/** @param targetIndex 0-based，选中块将插入到该位置 */
export function moveRulesToIndex(rules: SpecialRule[], ids: string[], targetIndex: number): SpecialRule[] {
  if (!ids.length) return rules;
  const idSet = new Set(ids);
  const picked = rules.filter(r => idSet.has(r.id));
  const rest = rules.filter(r => !idSet.has(r.id));
  const insertAt = Math.max(0, Math.min(targetIndex, rest.length));
  return normalizePriorities([...rest.slice(0, insertAt), ...picked, ...rest.slice(insertAt)]);
}

export function moveRulesByOffset(rules: SpecialRule[], ids: string[], delta: number): SpecialRule[] {
  if (!ids.length || delta === 0) return rules;
  const idSet = new Set(ids);
  const picked = rules.filter(r => idSet.has(r.id));
  if (!picked.length) return rules;
  const rest = rules.filter(r => !idSet.has(r.id));
  const firstIdx = rules.findIndex(r => idSet.has(r.id));
  const insertAt = Math.max(0, Math.min(firstIdx + delta, rest.length));
  return normalizePriorities([...rest.slice(0, insertAt), ...picked, ...rest.slice(insertAt)]);
}

export type PriorityPanelStatusFilter = 'ALL' | SpecialRuleStatus;
export type PriorityPanelScopeFilter = 'ALL' | RuleRelationScope;

export function filterRulesForPriorityPanel(
  rules: SpecialRule[],
  opts: {
    keyword: string;
    status: PriorityPanelStatusFilter;
    relationScope: PriorityPanelScopeFilter;
  }
): SpecialRule[] {
  const q = opts.keyword.trim().toLowerCase();
  return rules.filter(rule => {
    if (opts.status !== 'ALL' && rule.status !== opts.status) return false;
    if (opts.relationScope !== 'ALL' && rule.relationScope !== opts.relationScope) return false;
    if (!q) return true;
    if (rule.name.toLowerCase().includes(q) || rule.id.toLowerCase().includes(q)) return true;
    const members = [...rule.sideA, ...(rule.sideB ?? [])];
    return members.some(m => m.refName.toLowerCase().includes(q));
  });
}
