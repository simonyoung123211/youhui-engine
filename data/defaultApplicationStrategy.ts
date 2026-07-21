import { PromotionCategory, PromoGroup, PromoScope } from '../types';
import {
  ApplicationStrategyConfig,
  LegacyBasicStrategy,
  LegacyMiniProgramBestCombo,
  OrderOptimizationMode,
  SingleItemActivityCategoryId,
} from '../types/applicationStrategy';

export const SINGLE_ITEM_ACTIVITY_CATEGORY_IDS: SingleItemActivityCategoryId[] = [
  'act_item_limited_disc',
  'act_item_m_n_disc',
  'act_item_bogo',
  'act_item_sv_pay_disc',
  'act_item_fixed_price',
];

export const ESTIMATED_PRICE_CALC_RULES =
  '固定试算适用的单品促销与当前账号真实持有、且单独购买 1 件该 SKU 时可用的优惠券；试算不产生选券状态，不占用、不核销优惠券。与订单选券策略完全解耦。';

export const DEFAULT_APPLICATION_STRATEGY: ApplicationStrategyConfig = {
  miniProgram: {
    estimatedPrice: {
      enabled: true,
      hideLabelDineIn: false,
      hideLabelTakeout: false,
      displayMode: 'COMPATIBLE',
      coexistCategoryIds: ['act_item_limited_disc', 'act_item_m_n_disc', 'act_item_bogo'],
      afterAddToCart: 'KEEP',
    },
    orderOptimalDiscount: {
      couponAutoApplyStage: 'CART_AUTO_APPLY',
    },
    maxCouponsPerOrder: 30,
    maxGroupBuyVouchersPerOrder: 5,
  },
  pos: {
    autoExecuteOnCheckout: 'MANUAL',
    autoExecuteOnOrder: 'AUTO',
    memberBalanceIntegrated: true,
    paymentCodeRespectMutex: true,
    activityScope: 'SPECIFIED',
    specifiedActivities: [],
  },
};

export function getSingleItemActivityCategories(
  categories: PromotionCategory[]
): PromotionCategory[] {
  return categories.filter(
    c =>
      c.defaultScope === PromoScope.SINGLE_ITEM &&
      c.group === PromoGroup.ACTIVITY &&
      SINGLE_ITEM_ACTIVITY_CATEGORY_IDS.includes(c.id as SingleItemActivityCategoryId)
  );
}

/** POS 可指定的活动实例：营销活动 + 单品会员价类 */
export function isPosSelectableCategory(cat: PromotionCategory): boolean {
  if (cat.group === PromoGroup.ACTIVITY) return true;
  if (cat.group === PromoGroup.MEMBER && cat.defaultScope === PromoScope.SINGLE_ITEM) {
    return cat.id === 'mbr_item_price' || cat.id === 'mbr_item_paid_price';
  }
  return false;
}

function sceneRecommendsCoupons(settings: {
  noCouponOnOrderPage: boolean;
  noCouponOnSubmitPage: boolean;
}): 'RECOMMEND' | 'NO_RECOMMEND' | 'MIXED' {
  const orderRecommends = !settings.noCouponOnOrderPage;
  const submitRecommends = !settings.noCouponOnSubmitPage;
  if (orderRecommends && submitRecommends) return 'RECOMMEND';
  if (!orderRecommends && !submitRecommends) return 'NO_RECOMMEND';
  return 'MIXED';
}

/** 从旧版页面级配置迁移最优优惠策略；高风险或混合组合保守迁移为用户自主选择 */
export function migrateOrderOptimizationFromLegacy(
  bestCombo: LegacyMiniProgramBestCombo | undefined
): OrderOptimizationMode {
  if (!bestCombo?.enabled) return 'USER_CHOICE';

  const dine = sceneRecommendsCoupons(bestCombo.dineIn);
  const takeout = sceneRecommendsCoupons(bestCombo.takeout);

  if (dine === 'RECOMMEND' && takeout === 'RECOMMEND') return 'CART_AUTO_APPLY';
  if (dine === 'NO_RECOMMEND' && takeout === 'NO_RECOMMEND') return 'USER_CHOICE';

  const submitOnly = [bestCombo.dineIn, bestCombo.takeout].every(
    scene => scene.noCouponOnOrderPage && !scene.noCouponOnSubmitPage
  );
  if (submitOnly) return 'SUBMIT_AUTO_APPLY';

  return 'USER_CHOICE';
}

function resolveOrderOptimizationMode(
  rawMp: {
    orderOptimalDiscount?: { couponAutoApplyStage?: OrderOptimizationMode };
    orderCouponPolicy?: { mode?: 'AUTO_SELECT' | 'USER_CHOICE' };
    couponPolicy?: { mode?: 'AUTO_SELECT' | 'USER_CHOICE' };
    bestCombo?: LegacyMiniProgramBestCombo;
  } | undefined
): OrderOptimizationMode {
  const current = rawMp?.orderOptimalDiscount?.couponAutoApplyStage;
  if (
    current === 'CART_AUTO_APPLY' ||
    current === 'SUBMIT_AUTO_APPLY' ||
    current === 'USER_CHOICE'
  ) {
    return current;
  }

  const fromOrder = rawMp?.orderCouponPolicy?.mode;
  if (fromOrder === 'AUTO_SELECT') return 'CART_AUTO_APPLY';
  if (fromOrder === 'USER_CHOICE') return 'USER_CHOICE';

  const fromCoupon = rawMp?.couponPolicy?.mode;
  if (fromCoupon === 'AUTO_SELECT') return 'CART_AUTO_APPLY';
  if (fromCoupon === 'USER_CHOICE') return 'USER_CHOICE';

  return migrateOrderOptimizationFromLegacy(rawMp?.bestCombo);
}

export function hydrateApplicationStrategy(
  raw: Partial<ApplicationStrategyConfig> & {
    miniProgram?: Partial<ApplicationStrategyConfig['miniProgram']> & {
      bestCombo?: LegacyMiniProgramBestCombo;
      orderCouponPolicy?: { mode?: 'AUTO_SELECT' | 'USER_CHOICE' };
      couponPolicy?: { mode?: 'AUTO_SELECT' | 'USER_CHOICE' };
      cartCouponPrompt?: unknown;
      cartDisplay?: unknown;
      submitOrderConfirm?: unknown;
    };
    /** 旧版本券数限制字段存放在 basic 下，迁移读取 */
    basic?: LegacyBasicStrategy;
  } | undefined | null
): ApplicationStrategyConfig {
  if (!raw) return structuredClone(DEFAULT_APPLICATION_STRATEGY);

  const defaults = DEFAULT_APPLICATION_STRATEGY;
  const rawMp = raw.miniProgram;

  const coexist = (rawMp?.estimatedPrice?.coexistCategoryIds ?? []).filter(
    (id): id is SingleItemActivityCategoryId =>
      SINGLE_ITEM_ACTIVITY_CATEGORY_IDS.includes(id as SingleItemActivityCategoryId)
  );

  const orderOptimizationMode = resolveOrderOptimizationMode(rawMp);

  return {
    miniProgram: {
      estimatedPrice: {
        enabled:
          rawMp?.estimatedPrice?.enabled ?? defaults.miniProgram.estimatedPrice.enabled,
        hideLabelDineIn:
          rawMp?.estimatedPrice?.hideLabelDineIn ??
          defaults.miniProgram.estimatedPrice.hideLabelDineIn,
        hideLabelTakeout:
          rawMp?.estimatedPrice?.hideLabelTakeout ??
          defaults.miniProgram.estimatedPrice.hideLabelTakeout,
        displayMode:
          rawMp?.estimatedPrice?.displayMode ??
          defaults.miniProgram.estimatedPrice.displayMode,
        coexistCategoryIds:
          coexist.length > 0 ? coexist : defaults.miniProgram.estimatedPrice.coexistCategoryIds,
        afterAddToCart:
          rawMp?.estimatedPrice?.afterAddToCart ??
          defaults.miniProgram.estimatedPrice.afterAddToCart,
      },
      orderOptimalDiscount: { couponAutoApplyStage: orderOptimizationMode },
      maxCouponsPerOrder: clampCouponLimit(
        rawMp?.maxCouponsPerOrder ??
          raw.basic?.maxCouponsPerOrder ??
          defaults.miniProgram.maxCouponsPerOrder
      ),
      maxGroupBuyVouchersPerOrder: clampGroupBuyVoucherLimit(
        rawMp?.maxGroupBuyVouchersPerOrder ??
          raw.basic?.maxGroupBuyVouchersPerOrder ??
          defaults.miniProgram.maxGroupBuyVouchersPerOrder
      ),
    },
    pos: {
      autoExecuteOnCheckout:
        raw.pos?.autoExecuteOnCheckout ?? defaults.pos.autoExecuteOnCheckout,
      autoExecuteOnOrder: raw.pos?.autoExecuteOnOrder ?? defaults.pos.autoExecuteOnOrder,
      memberBalanceIntegrated:
        raw.pos?.memberBalanceIntegrated ?? defaults.pos.memberBalanceIntegrated,
      paymentCodeRespectMutex:
        raw.pos?.paymentCodeRespectMutex ?? defaults.pos.paymentCodeRespectMutex,
      activityScope: raw.pos?.activityScope ?? defaults.pos.activityScope,
      specifiedActivities: raw.pos?.specifiedActivities ?? defaults.pos.specifiedActivities,
    },
  };
}

export function clampCouponLimit(value: number): number {
  if (!Number.isFinite(value)) return 30;
  return Math.min(50, Math.max(1, Math.round(value)));
}

export function clampGroupBuyVoucherLimit(value: number): number {
  if (!Number.isFinite(value)) return 5;
  return Math.min(10, Math.max(1, Math.round(value)));
}

export function getOrderOptimizationLabel(mode: OrderOptimizationMode): string {
  switch (mode) {
    case 'CART_AUTO_APPLY':
      return '购物车起自动优选';
    case 'SUBMIT_AUTO_APPLY':
      return '提交订单页最终优选';
    case 'USER_CHOICE':
      return '不自动应用，由用户选择';
  }
}
