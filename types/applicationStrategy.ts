/** 优惠应用策略 — 渠道/场景如何使用优惠引擎 */

export type StrategyTab = 'miniprogram' | 'pos';

export type AutoExecuteMode = 'AUTO' | 'MANUAL';

export type ActivityScopeMode = 'ALL' | 'SPECIFIED';

export type EstimatedPriceDisplayMode = 'STANDARD' | 'COMPATIBLE';

export type AfterAddToCartBehavior = 'KEEP' | 'HIDE_ALL';

/** 购物车与提交订单页中，推荐优惠券的自动应用时机 */
export type OrderOptimizationMode =
  | 'CART_AUTO_APPLY'
  | 'SUBMIT_AUTO_APPLY'
  | 'USER_CHOICE';

/** 预估到手价兼容标签：仅单品类营销活动 categoryId */
export type SingleItemActivityCategoryId =
  | 'act_item_limited_disc'
  | 'act_item_m_n_disc'
  | 'act_item_bogo'
  | 'act_item_sv_pay_disc'
  | 'act_item_fixed_price';

export interface OrderOptimalDiscountPolicy {
  couponAutoApplyStage: OrderOptimizationMode;
}

export interface MiniProgramEstimatedPrice {
  enabled: boolean;
  /** 小程序堂食（店内就餐）商品列表隐藏预估到手价标签 */
  hideLabelDineIn: boolean;
  /** 小程序外带（打包带走）商品列表隐藏预估到手价标签 */
  hideLabelPack: boolean;
  /** 小程序外卖商品列表隐藏预估到手价标签 */
  hideLabelTakeout: boolean;
  displayMode: EstimatedPriceDisplayMode;
  coexistCategoryIds: SingleItemActivityCategoryId[];
  afterAddToCart: AfterAddToCartBehavior;
}

/** 企迈券：可启用兑换隐藏商品的券类型 */
export type QmaiHiddenRedeemCouponType =
  | 'qmai_product'
  | 'qmai_exchange'
  | 'qmai_times'
  | 'qmai_reduce_to';

/** 团购券：可启用兑换隐藏商品的券类型 */
export type GroupBuyHiddenRedeemCouponType = 'group_combo' | 'group_times';

export type HiddenRedeemCouponTypeId =
  | QmaiHiddenRedeemCouponType
  | GroupBuyHiddenRedeemCouponType;

/** 商品型券核销时是否允许兑换「隐藏商品」 */
export interface CouponHiddenCategoryRedeemPolicy {
  /** 默认关闭 */
  enabled: boolean;
  /**
   * 启用的券类型（商家可自定义；默认全选）。
   * 仅勾选类型可兑换隐藏商品。
   */
  enabledCouponTypes: HiddenRedeemCouponTypeId[];
}

export interface MiniProgramStrategy {
  estimatedPrice: MiniProgramEstimatedPrice;
  orderOptimalDiscount: OrderOptimalDiscountPolicy;
  /** 优惠券核销隐藏商品：是否允许商品型券兑换隐藏商品 */
  couponHiddenCategoryRedeem: CouponHiddenCategoryRedeemPolicy;
  /** 每单可核销优惠券上限，1–50，默认 30 */
  maxCouponsPerOrder: number;
  /** 每单可使用团购券上限（小程序堂食/外带下单），1–5，默认 5 */
  maxGroupBuyVouchersPerOrder: number;
}

export interface PosSpecifiedActivity {
  instanceId: string;
}

export interface PosStrategy {
  autoExecuteOnCheckout: AutoExecuteMode;
  autoExecuteOnOrder: AutoExecuteMode;
  memberBalanceIntegrated: boolean;
  paymentCodeRespectMutex: boolean;
  activityScope: ActivityScopeMode;
  specifiedActivities: PosSpecifiedActivity[];
}

/** @deprecated 旧版本配置结构，字段已迁移至 MiniProgramStrategy，仅用于旧数据读取 */
export interface LegacyBasicStrategy {
  maxCouponsPerOrder?: number;
  maxGroupBuyVouchersPerOrder?: number;
}

export interface ApplicationStrategyConfig {
  miniProgram: MiniProgramStrategy;
  pos: PosStrategy;
}

export interface StrategyValidationIssue {
  field: string;
  message: string;
}

/** @deprecated 仅用于旧配置迁移 */
export interface LegacyCouponPageSettings {
  noCouponOnOrderPage: boolean;
  noCouponOnSubmitPage: boolean;
}

/** @deprecated 仅用于旧配置迁移 */
export interface LegacyMiniProgramBestCombo {
  enabled: boolean;
  dineIn: LegacyCouponPageSettings;
  takeout: LegacyCouponPageSettings;
  payBill: {
    noCouponOnPayPage: boolean;
  };
}

/** @deprecated 仅用于旧配置迁移 */
export type LegacyCartCouponHintMode = 'NONE' | 'BRIEF' | 'DETAIL';

/** @deprecated 仅用于旧配置迁移 */
export interface LegacyCartCouponDisplay {
  hintMode?: LegacyCartCouponHintMode;
  showPotentialSavings?: boolean;
  selectedDisplay?: string;
}

/** @deprecated 仅用于旧配置迁移 */
export interface LegacyCouponApplicationPolicy {
  mode?: 'AUTO_SELECT' | 'USER_CHOICE';
}
