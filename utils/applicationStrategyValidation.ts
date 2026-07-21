import {
  clampCouponLimit,
  clampGroupBuyVoucherLimit,
} from '../data/defaultApplicationStrategy';
import {
  ApplicationStrategyConfig,
  OrderOptimizationMode,
  StrategyValidationIssue,
} from '../types/applicationStrategy';

const VALID_ORDER_MODES: OrderOptimizationMode[] = [
  'CART_AUTO_APPLY',
  'SUBMIT_AUTO_APPLY',
  'USER_CHOICE',
];

export function validateApplicationStrategy(
  config: ApplicationStrategyConfig
): StrategyValidationIssue[] {
  const issues: StrategyValidationIssue[] = [];

  const orderMode = config.miniProgram.orderOptimalDiscount.couponAutoApplyStage;
  if (!VALID_ORDER_MODES.includes(orderMode)) {
    issues.push({
      field: 'miniProgram.orderOptimalDiscount.couponAutoApplyStage',
      message: '请选择推荐优惠券的自动应用时机',
    });
  }

  const limit = clampCouponLimit(config.miniProgram.maxCouponsPerOrder);
  if (limit !== config.miniProgram.maxCouponsPerOrder) {
    issues.push({
      field: 'miniProgram.maxCouponsPerOrder',
      message: '每单使用优惠券限制须在 1–50 张之间',
    });
  }

  const gbLimit = clampGroupBuyVoucherLimit(config.miniProgram.maxGroupBuyVouchersPerOrder);
  if (gbLimit !== config.miniProgram.maxGroupBuyVouchersPerOrder) {
    issues.push({
      field: 'miniProgram.maxGroupBuyVouchersPerOrder',
      message: '每单使用团购券限制须在 1–10 张之间',
    });
  }

  return issues;
}

export function areApplicationStrategiesEqual(
  a: ApplicationStrategyConfig,
  b: ApplicationStrategyConfig
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
