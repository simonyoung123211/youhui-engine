/**
 * 折上折叠加（试点）
 *
 * 默认规则中的「共享且叠加」按商品原价分别计算各项优惠；
 * 试点开启后，指定的一组优惠改为在前一项优惠的折后价上继续计算（折上折）。
 * 本期仅开放「限时折扣 + 折扣券」一组，后续再并入默认规则。
 */

/** 计算基数：原价 / 折后价 */
export type StackingBase = 'ORIGINAL' | 'DISCOUNTED';

export interface StackingPilotPair {
  id: string;
  /** 先算的优惠类型 id */
  leadCategoryId: string;
  /** 后算的优惠类型 id */
  followCategoryId: string;
  /** 是否启用本组叠加 */
  enabled: boolean;
  /** 后一项优惠的计算基数 */
  calcBase: StackingBase;
  /** 后一项优惠的门槛判定基数 */
  thresholdBase: StackingBase;
}

export interface StackingPilotConfig {
  pairs: StackingPilotPair[];
}

/** 试算器输入（仅用于配置页预览，不参与持久化） */
export interface StackingPreviewInput {
  originalPrice: number;
  /** 限时折扣折数，如 8 表示 8 折 */
  leadDiscountRate: number;
  /** 折扣券折数，如 6 表示 6 折 */
  followDiscountRate: number;
}

export interface StackingPreviewRow {
  label: string;
  base: number;
  result: number;
  saving: number;
}

export interface StackingPreviewResult {
  rows: StackingPreviewRow[];
  totalSaving: number;
  finalPrice: number;
}

export const STACKING_BASE_LABEL: Record<StackingBase, string> = {
  ORIGINAL: '商品原价',
  DISCOUNTED: '折后价',
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 试算：先算 lead（限时折扣），再算 follow（折扣券）。
 * calcBase 决定 follow 用原价还是折后价作为基数。
 */
export function calcStackingPreview(
  input: StackingPreviewInput,
  pair: StackingPilotPair,
  leadName: string,
  followName: string
): StackingPreviewResult {
  const price = Math.max(0, input.originalPrice);
  const leadRate = clampRate(input.leadDiscountRate);
  const followRate = clampRate(input.followDiscountRate);

  const afterLead = round2(price * (leadRate / 10));
  const leadSaving = round2(price - afterLead);

  const rows: StackingPreviewRow[] = [
    { label: leadName, base: price, result: afterLead, saving: leadSaving },
  ];

  if (!pair.enabled) {
    return { rows, totalSaving: leadSaving, finalPrice: afterLead };
  }

  const followBase = pair.calcBase === 'DISCOUNTED' ? afterLead : price;
  const followTarget = round2(followBase * (followRate / 10));
  const followSaving = round2(followBase - followTarget);
  const finalPrice = Math.max(0, round2(afterLead - followSaving));

  rows.push({
    label: followName,
    base: followBase,
    result: finalPrice,
    saving: followSaving,
  });

  return {
    rows,
    totalSaving: round2(price - finalPrice),
    finalPrice,
  };
}

function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return 10;
  return Math.min(10, Math.max(0, rate));
}
