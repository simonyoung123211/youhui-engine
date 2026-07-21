import {
  InteractionType,
  PromoRef,
  RuleMember,
  SpecificityLevel,
  SpecialRule,
} from '../types';

export interface PairResolution {
  pairKey: string;
  promoA: PromoRef;
  promoB: PromoRef;
  interaction: InteractionType | null;
  source: 'SPECIAL_RULE' | 'DEFAULT' | 'NONE';
  winningRule?: SpecialRule;
  candidates: PairRuleCandidate[];
}

export interface PairRuleCandidate {
  rule: SpecialRule;
  specificity: SpecificityLevel;
  matchPath: string;
  reasons: string[];
}

export interface SaveImpactItem {
  pairKey: string;
  promoA: PromoRef;
  promoB: PromoRef;
  promoALabel: string;
  promoBLabel: string;
  currentRule?: SpecialRule;
  currentInteraction: InteractionType;
  newInteraction: InteractionType;
}

export interface IneffectiveItem {
  pairKey: string;
  promoA: PromoRef;
  promoB: PromoRef;
  promoALabel: string;
  promoBLabel: string;
  blockedByRule: SpecialRule;
  reason: string;
}

type MatchLevel = 'INSTANCE' | 'TYPE';

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function interactionLabel(type: InteractionType): string {
  switch (type) {
    case InteractionType.ALLOW:
      return '共享且叠加';
    case InteractionType.ITEM_MUTEX:
      return '共享（不叠加）';
    case InteractionType.MUTEX:
      return '互斥';
    default:
      return type;
  }
}

export function specificityLabel(level: SpecificityLevel): string {
  switch (level) {
    case 3:
      return '实例↔实例';
    case 2:
      return '实例↔类型';
    case 1:
      return '类型↔类型';
  }
}

function parseTime(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function memberMatchesPromo(member: RuleMember, promo: PromoRef): MatchLevel | null {
  if (member.refType === 'INSTANCE' && promo.refType === 'INSTANCE' && member.refId === promo.id) {
    return 'INSTANCE';
  }
  if (member.refType === 'TYPE') {
    if (promo.refType === 'TYPE' && member.refId === promo.id) return 'TYPE';
    if (promo.refType === 'INSTANCE' && member.refId === promo.typeId) return 'TYPE';
  }
  return null;
}

function levelToSpecificity(a: MatchLevel, b: MatchLevel): SpecificityLevel {
  if (a === 'INSTANCE' && b === 'INSTANCE') return 3;
  if (a === 'TYPE' && b === 'TYPE') return 1;
  return 2;
}

interface MatchPath {
  promoALevel: MatchLevel;
  promoBLevel: MatchLevel;
  description: string;
}

function getMatchPaths(rule: SpecialRule, a: PromoRef, b: PromoRef): MatchPath[] {
  const paths: MatchPath[] = [];

  if (rule.relationScope === 'INTRA_GROUP') {
    for (const am of rule.sideA) {
      const aLevel = memberMatchesPromo(am, a);
      if (!aLevel) continue;
      for (const bm of rule.sideA) {
        const bLevel = memberMatchesPromo(bm, b);
        if (!bLevel) continue;
        if (am.refId === bm.refId && a.id === b.id) continue;
        paths.push({
          promoALevel: aLevel,
          promoBLevel: bLevel,
          description: `${am.refName} ↔ ${bm.refName}`,
        });
      }
    }
    return paths;
  }

  const sideB = rule.sideB ?? [];
  for (const am of rule.sideA) {
    const aLevel = memberMatchesPromo(am, a);
    if (!aLevel) continue;
    for (const bm of sideB) {
      const bLevel = memberMatchesPromo(bm, b);
      if (!bLevel) continue;
      paths.push({
        promoALevel: aLevel,
        promoBLevel: bLevel,
        description: `${am.refName} ↔ ${bm.refName}`,
      });
    }
  }
  for (const am of rule.sideA) {
    const bLevel = memberMatchesPromo(am, b);
    if (!bLevel) continue;
    for (const bm of sideB) {
      const aLevel = memberMatchesPromo(bm, a);
      if (!aLevel) continue;
      paths.push({
        promoALevel: aLevel,
        promoBLevel: bLevel,
        description: `${bm.refName} ↔ ${am.refName}`,
      });
    }
  }
  return paths;
}

/** 规则对某一对的最高具体度（混选取最高命中路径） */
export function matchSpecificity(rule: SpecialRule, a: PromoRef, b: PromoRef): SpecificityLevel | 0 {
  const paths = getMatchPaths(rule, a, b);
  if (paths.length === 0) return 0;
  return Math.max(
    ...paths.map(p => levelToSpecificity(p.promoALevel, p.promoBLevel))
  ) as SpecificityLevel;
}

export function ruleCoversPair(rule: SpecialRule, a: PromoRef, b: PromoRef): boolean {
  if (rule.status !== 'ENABLED') return false;
  return matchSpecificity(rule, a, b) > 0;
}

function compareCandidates(
  a: PairRuleCandidate,
  b: PairRuleCandidate,
  priorityEnabled: boolean
): number {
  if (priorityEnabled) {
    const ap = a.rule.priority ?? 999;
    const bp = b.rule.priority ?? 999;
    if (ap !== bp) return ap - bp;
  }
  if (a.specificity !== b.specificity) return b.specificity - a.specificity;
  return parseTime(b.rule.createdAt) - parseTime(a.rule.createdAt);
}

export function buildCandidate(
  rule: SpecialRule,
  a: PromoRef,
  b: PromoRef
): PairRuleCandidate | null {
  const paths = getMatchPaths(rule, a, b);
  if (paths.length === 0) return null;

  let best = paths[0];
  let bestSpec = levelToSpecificity(best.promoALevel, best.promoBLevel);
  for (const p of paths.slice(1)) {
    const spec = levelToSpecificity(p.promoALevel, p.promoBLevel);
    if (spec > bestSpec) {
      best = p;
      bestSpec = spec;
    }
  }

  const reasons: string[] = [specificityLabel(bestSpec)];
  if (rule.priority != null) reasons.push(`优先级 ${rule.priority}`);
  reasons.push(`创建于 ${rule.createdAt.replace('T', ' ').slice(0, 19)}`);

  return {
    rule,
    specificity: bestSpec,
    matchPath: best.description,
    reasons,
  };
}

/**
 * 解析单对优惠的最终关系。
 * 排序：显式优先级（可选）> 具体度 > 创建时间
 */
export function resolvePair(
  rules: SpecialRule[],
  a: PromoRef,
  b: PromoRef,
  defaultInteraction: InteractionType = InteractionType.MUTEX,
  priorityEnabled = false
): PairResolution {
  const key = pairKey(a.id, b.id);
  const candidates = rules
    .map(r => buildCandidate(r, a, b))
    .filter((c): c is PairRuleCandidate => c !== null && c.rule.status === 'ENABLED')
    .sort((x, y) => compareCandidates(x, y, priorityEnabled));

  if (candidates.length === 0) {
    return {
      pairKey: key,
      promoA: a,
      promoB: b,
      interaction: defaultInteraction,
      source: 'DEFAULT',
      candidates: [],
    };
  }

  const winner = candidates[0];
  return {
    pairKey: key,
    promoA: a,
    promoB: b,
    interaction: winner.rule.interaction,
    source: 'SPECIAL_RULE',
    winningRule: winner.rule,
    candidates,
  };
}

export function resolveOrderPairs(
  rules: SpecialRule[],
  promos: PromoRef[],
  defaultInteraction?: InteractionType,
  priorityEnabled = false
): PairResolution[] {
  const results: PairResolution[] = [];
  for (let i = 0; i < promos.length; i++) {
    for (let j = i + 1; j < promos.length; j++) {
      results.push(
        resolvePair(rules, promos[i], promos[j], defaultInteraction, priorityEnabled)
      );
    }
  }
  return results;
}

export function getPairCoverage(
  rules: SpecialRule[],
  a: PromoRef,
  b: PromoRef,
  priorityEnabled = false
): PairResolution {
  return resolvePair(rules, a, b, InteractionType.MUTEX, priorityEnabled);
}

export function ruleMemberToPromoRef(m: RuleMember, instanceTypeMap?: Record<string, string>): PromoRef {
  if (m.refType === 'TYPE') {
    return { id: m.refId, refType: 'TYPE', typeId: m.refId };
  }
  return {
    id: m.refId,
    refType: 'INSTANCE',
    typeId: instanceTypeMap?.[m.refId] ?? m.refId,
  };
}

function refLabel(m: RuleMember): string {
  return m.refName;
}

/** 将规则展开为成员对（用于预览/冲突检测） */
export function expandRuleMemberPairs(
  rule: SpecialRule
): Array<{ a: RuleMember; b: RuleMember }> {
  const pairs: Array<{ a: RuleMember; b: RuleMember }> = [];

  if (rule.relationScope === 'INTRA_GROUP') {
    for (let i = 0; i < rule.sideA.length; i++) {
      for (let j = i + 1; j < rule.sideA.length; j++) {
        pairs.push({ a: rule.sideA[i], b: rule.sideA[j] });
      }
    }
    return pairs;
  }

  const sideB = rule.sideB ?? [];
  for (const a of rule.sideA) {
    for (const b of sideB) {
      pairs.push({ a, b });
    }
  }
  return pairs;
}

export function expandRulePairs(
  rule: SpecialRule,
  instanceTypeMap?: Record<string, string>
): Array<[PromoRef, PromoRef]> {
  return expandRuleMemberPairs(rule).map(({ a, b }) => [
    ruleMemberToPromoRef(a, instanceTypeMap),
    ruleMemberToPromoRef(b, instanceTypeMap),
  ]);
}

export function countRulePairs(rule: SpecialRule): number {
  return expandRuleMemberPairs(rule).length;
}

function promoLabel(ref: PromoRef, members: RuleMember[]): string {
  const hit = members.find(
    m =>
      (m.refType === 'INSTANCE' && m.refId === ref.id) ||
      (m.refType === 'TYPE' && (m.refId === ref.typeId || m.refId === ref.id))
  );
  return hit?.refName ?? ref.id;
}

/** 保存前：检测覆盖与无效对 */
export function detectSaveImpact(
  existingRules: SpecialRule[],
  draft: SpecialRule,
  priorityEnabled: boolean,
  instanceTypeMap?: Record<string, string>
): { overrides: SaveImpactItem[]; ineffective: IneffectiveItem[] } {
  const others = existingRules.filter(r => r.status === 'ENABLED' && r.id !== draft.id);
  const withDraft = draft.status === 'ENABLED' ? [...others, draft] : others;
  const allMembers = [...draft.sideA, ...(draft.sideB ?? [])];

  const overrides: SaveImpactItem[] = [];
  const ineffective: IneffectiveItem[] = [];

  for (const { a: ma, b: mb } of expandRuleMemberPairs(draft)) {
    const refA = ruleMemberToPromoRef(ma, instanceTypeMap);
    const refB = ruleMemberToPromoRef(mb, instanceTypeMap);
    const key = pairKey(refA.id, refB.id);

    const before = resolvePair(others, refA, refB, InteractionType.MUTEX, priorityEnabled);
    const after = resolvePair(withDraft, refA, refB, InteractionType.MUTEX, priorityEnabled);

    const draftWins = after.winningRule?.id === draft.id;
    const labelA = refLabel(ma);
    const labelB = refLabel(mb);

    if (!draftWins && draft.status === 'ENABLED') {
      ineffective.push({
        pairKey: key,
        promoA: refA,
        promoB: refB,
        promoALabel: labelA,
        promoBLabel: labelB,
        blockedByRule: after.winningRule!,
        reason: `被更具体的规则「${after.winningRule?.name}」覆盖（${specificityLabel(after.candidates[0]?.specificity ?? 1)}）`,
      });
      continue;
    }

    if (
      draftWins &&
      before.source === 'SPECIAL_RULE' &&
      before.winningRule?.id !== draft.id &&
      before.interaction !== draft.interaction
    ) {
      overrides.push({
        pairKey: key,
        promoA: refA,
        promoB: refB,
        promoALabel: labelA,
        promoBLabel: labelB,
        currentRule: before.winningRule,
        currentInteraction: before.interaction!,
        newInteraction: draft.interaction,
      });
    } else if (
      draftWins &&
      before.source === 'SPECIAL_RULE' &&
      before.winningRule?.id !== draft.id &&
      before.interaction === draft.interaction
    ) {
      // same interaction, different winner - still note override for transparency
      overrides.push({
        pairKey: key,
        promoA: refA,
        promoB: refB,
        promoALabel: labelA,
        promoBLabel: labelB,
        currentRule: before.winningRule,
        currentInteraction: before.interaction!,
        newInteraction: draft.interaction,
      });
    }
  }

  return { overrides, ineffective };
}

/** @deprecated 使用 detectSaveImpact */
export function detectPairConflicts(
  existingRules: SpecialRule[],
  draft: SpecialRule
): Array<{
  pairKey: string;
  existingRule: SpecialRule;
  draftInteraction: InteractionType;
  existingInteraction: InteractionType;
}> {
  const { overrides } = detectSaveImpact(existingRules, draft, false);
  return overrides
    .filter(o => o.currentInteraction !== o.newInteraction)
    .map(o => ({
      pairKey: o.pairKey,
      existingRule: o.currentRule!,
      draftInteraction: o.newInteraction,
      existingInteraction: o.currentInteraction,
    }));
}

/** 判断某规则的对在全局是否生效 */
export function getRulePairStatuses(
  rule: SpecialRule,
  allRules: SpecialRule[],
  priorityEnabled: boolean,
  instanceTypeMap?: Record<string, string>
): Array<{
  promoA: PromoRef;
  promoB: PromoRef;
  labelA: string;
  labelB: string;
  ruleInteraction: InteractionType;
  effective: boolean;
  finalInteraction?: InteractionType;
  winningRule?: SpecialRule;
}> {
  if (rule.status !== 'ENABLED') {
    return expandRuleMemberPairs(rule).map(({ a, b }) => ({
      promoA: ruleMemberToPromoRef(a, instanceTypeMap),
      promoB: ruleMemberToPromoRef(b, instanceTypeMap),
      labelA: a.refName,
      labelB: b.refName,
      ruleInteraction: rule.interaction,
      effective: false,
    }));
  }

  return expandRuleMemberPairs(rule).map(({ a, b }) => {
    const refA = ruleMemberToPromoRef(a, instanceTypeMap);
    const refB = ruleMemberToPromoRef(b, instanceTypeMap);
    const res = resolvePair(allRules, refA, refB, InteractionType.MUTEX, priorityEnabled);
    const effective = res.winningRule?.id === rule.id;
    return {
      promoA: refA,
      promoB: refB,
      labelA: a.refName,
      labelB: b.refName,
      ruleInteraction: rule.interaction,
      effective,
      finalInteraction: res.interaction ?? undefined,
      winningRule: res.winningRule,
    };
  });
}
