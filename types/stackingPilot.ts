/**
 * 折上折叠加
 *
 * 默认规则中的「共享且叠加」按商品原价分别计算各项优惠；
 * 开启后，指定的一组优惠改为在前一项优惠的折后价上继续计算（折上折），
 * 券的满额门槛同样按折后价判定。
 * 本期仅开放「限时折扣 + 折扣券」一组，后续再并入默认规则。
 */

export interface StackingPilotPair {
  id: string;
  /** 先算的优惠类型 id */
  leadCategoryId: string;
  /** 后算的优惠类型 id */
  followCategoryId: string;
  /** 是否启用本组叠加 */
  enabled: boolean;
}

export interface StackingPilotConfig {
  pairs: StackingPilotPair[];
}

/** 试算器输入（仅用于配置弹框预览，不参与持久化） */
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

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** 试算：先算 lead（限时折扣），再用 follow（折扣券）在折后价上继续计算。 */
export function calcStackingPreview(
  input: StackingPreviewInput,
  pair: StackingPilotPair,
  leadName: string,
  followName: string
): StackingPreviewResult {
  const price = Math.max(0, input.originalPrice);
  const afterLead = round2(price * (clampRate(input.leadDiscountRate) / 10));
  const leadSaving = round2(price - afterLead);

  const rows: StackingPreviewRow[] = [
    { label: leadName, base: price, result: afterLead, saving: leadSaving },
  ];

  if (!pair.enabled) {
    return { rows, totalSaving: leadSaving, finalPrice: afterLead };
  }

  const finalPrice = round2(afterLead * (clampRate(input.followDiscountRate) / 10));
  rows.push({
    label: followName,
    base: afterLead,
    result: finalPrice,
    saving: round2(afterLead - finalPrice),
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
