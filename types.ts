
export enum PromoGroup {
  ACTIVITY = '营销活动',
  MEMBER = '用户权益',
  ASSET = '用户资产',
  POS = '企迈POS',
  PLATFORM = '平台团购',
  PAYMENT = '支付方式',
}

export enum PromoScope {
  ORDER = 'ORDER',
  SINGLE_ITEM = 'SINGLE_ITEM',
}

export enum PromoChannel {
  ALL = 'ALL',
  POS = 'POS',
  APP = 'APP',
}

export enum PromoType {
  // 单品 · 营销活动
  LIMITED_TIME_DISCOUNT = 'LIMITED_TIME_DISCOUNT',
  M_PIECES_N_DISCOUNT = 'M_PIECES_N_DISCOUNT',
  BOGO = 'BOGO',
  STORED_VALUE_PAY_DISCOUNT = 'STORED_VALUE_PAY_DISCOUNT',
  FIXED_PRICE = 'FIXED_PRICE',

  // 单品 · 用户权益
  CONSUMPTION_PRIVILEGE = 'CONSUMPTION_PRIVILEGE',
  MEMBER_PRICE = 'MEMBER_PRICE',
  PAID_MEMBER_PRICE = 'PAID_MEMBER_PRICE',

  // 单品 · 用户资产
  DISCOUNT_VOUCHER = 'DISCOUNT_VOUCHER',
  ITEM_VOUCHER = 'ITEM_VOUCHER',
  BUY_A_GET_B_VOUCHER = 'BUY_A_GET_B_VOUCHER',
  LIMITED_FREE_VOUCHER = 'LIMITED_FREE_VOUCHER',
  EXCHANGE_VOUCHER = 'EXCHANGE_VOUCHER',
  REDUCE_TO_VOUCHER = 'REDUCE_TO_VOUCHER',
  COUNT_VOUCHER = 'COUNT_VOUCHER',
  ADDON_VOUCHER = 'ADDON_VOUCHER',
  CASH_CARD = 'CASH_CARD',
  ITEM_COUNT_CARD = 'ITEM_COUNT_CARD',
  SINGLE_USE_CARD = 'SINGLE_USE_CARD',
  POINTS_DEDUCTION = 'POINTS_DEDUCTION',

  // 单品 · 企迈POS
  POS_ITEM_CUSTOM_ACCOUNT = 'POS_ITEM_CUSTOM_ACCOUNT',
  POS_ITEM_FIXED_AMOUNT = 'POS_ITEM_FIXED_AMOUNT',
  POS_ITEM_DISCOUNT_SCHEME = 'POS_ITEM_DISCOUNT_SCHEME',

  // 单品 · 平台团购
  MT_SET_MEAL = 'MT_SET_MEAL',
  MT_COUNT = 'MT_COUNT',
  DY_SET_MEAL = 'DY_SET_MEAL',
  DY_COUNT = 'DY_COUNT',
  ALIPAY_SET_MEAL = 'ALIPAY_SET_MEAL',
  TB_FLASH_SET_MEAL = 'TB_FLASH_SET_MEAL',

  // 整单 · 营销活动
  THRESHOLD_REDUCE = 'THRESHOLD_REDUCE',
  THRESHOLD_GIFT = 'THRESHOLD_GIFT',
  ADD_ON_DEAL = 'ADD_ON_DEAL',
  DELIVERY_FEE_REDUCE = 'DELIVERY_FEE_REDUCE',
  NEW_CUSTOMER_EXCLUSIVE = 'NEW_CUSTOMER_EXCLUSIVE',

  // 整单 · 用户权益
  TOP_UP_BUNDLE_DISCOUNT = 'TOP_UP_BUNDLE_DISCOUNT',

  // 整单 · 用户资产
  CASH_VOUCHER = 'CASH_VOUCHER',
  DELIVERY_VOUCHER = 'DELIVERY_VOUCHER',

  // 整单 · 企迈POS
  POS_ORDER_CUSTOM_ACCOUNT = 'POS_ORDER_CUSTOM_ACCOUNT',
  POS_ORDER_FIXED_AMOUNT = 'POS_ORDER_FIXED_AMOUNT',
  POS_ORDER_DISCOUNT_SCHEME = 'POS_ORDER_DISCOUNT_SCHEME',

  // 整单 · 平台团购
  MT_CASH_VOUCHER = 'MT_CASH_VOUCHER',
  DY_CASH_VOUCHER = 'DY_CASH_VOUCHER',
  ALIPAY_CASH_VOUCHER = 'ALIPAY_CASH_VOUCHER',
  TB_FLASH_CASH_VOUCHER = 'TB_FLASH_CASH_VOUCHER',

  // 支付方式
  STORED_VALUE_BALANCE = 'STORED_VALUE_BALANCE',
  PHYSICAL_STORED_VALUE_CARD = 'PHYSICAL_STORED_VALUE_CARD',
  POS_OFFLINE_SETTLEMENT = 'POS_OFFLINE_SETTLEMENT',
}

export interface PromotionCategory {
  id: string;
  group: PromoGroup;
  name: string;
  type: PromoType;
  description: string;
  defaultScope: PromoScope;
}

/** 优惠类型是否支持活动实例维度（特例规则可选 INSTANCE 引用） */
export type CategoryInstanceMode = 'INSTANCE' | 'TYPE_ONLY';

export enum InteractionType {
  ALLOW = 'ALLOW',
  ITEM_MUTEX = 'ITEM_MUTEX',
  MUTEX = 'MUTEX',
  OVERWRITE = 'OVERWRITE',
}

export interface RuleMatrix {
  [key: string]: {
    [key: string]: InteractionType;
  };
}

export type PromoInstanceStatus = 'ENABLED' | 'DISABLED' | 'EXPIRED' | 'PENDING';

export interface PromoInstance {
  id: string;
  name: string;
  categoryId: string;
  scope: PromoScope;
  value: number;
  isPercentage: boolean;
  channels: PromoChannel[];
  isStaticType?: boolean;
  /** 活动状态；未传时由生效时间推断 */
  status?: PromoInstanceStatus;
  /** 生效开始时间 ISO 字符串 */
  effectiveStart?: string;
  /** 生效结束时间 ISO 字符串 */
  effectiveEnd?: string;
}

export interface InstanceRuleMap {
  [instanceId: string]: {
    [targetInstanceId: string]: InteractionType;
  };
}

/** 特例规则 · 成员引用（优惠类型或活动实例） */
export type RuleMemberRefType = 'TYPE' | 'INSTANCE';

export interface RuleMember {
  refType: RuleMemberRefType;
  refId: string;
  refName: string;
  expired?: boolean;
}

export type RuleRelationScope = 'INTRA_GROUP' | 'INTER_GROUP';
export type SpecialRuleStatus = 'ENABLED' | 'DISABLED';

/** 具体度：3=实例↔实例, 2=实例↔类型, 1=类型↔类型 */
export type SpecificityLevel = 3 | 2 | 1;

/** 特例规则实体（CRUD 主数据） */
export interface SpecialRule {
  id: string;
  name: string;
  relationScope: RuleRelationScope;
  interaction: InteractionType;
  sideA: RuleMember[];
  sideB?: RuleMember[];
  status: SpecialRuleStatus;
  priority?: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

/** P2 预留：关系对物化态 */
export interface PairWriteRecord {
  ruleId: string;
  ruleName: string;
  interaction: InteractionType;
  specificity: SpecificityLevel;
  writtenAt: string;
  action: 'WRITE' | 'DISABLE' | 'DELETE';
}

export interface PairState {
  pairKey: string;
  interaction: InteractionType;
  winningRuleId: string;
  specificity: SpecificityLevel;
  createdAt: string;
  history: PairWriteRecord[];
}

/** 算价上下文中的优惠引用（用于解析） */
export interface PromoRef {
  id: string;
  refType: RuleMemberRefType;
  typeId: string;
}

export interface SimulationItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface ActivePromo extends PromoInstance {
  targetItemId?: string;
  rejectReason?: string;
}

export interface CalculationResult {
  original: number;
  final: number;
  items: any[];
  applied: ActivePromo[];
  rejected: ActivePromo[];
  conflicts: string[];
}

export interface Product {
  id: string;
  category: 'HOT' | 'STAPLE' | 'DRINK' | 'SNACK';
  name: string;
  price: number;
  image: string;
}

/** 业务分组在计算顺序中的默认权重（数值越小越先执行） */
const GROUP_PRIORITY: Record<PromoGroup, { item: number; order: number }> = {
  [PromoGroup.MEMBER]: { item: 0, order: 90 },
  [PromoGroup.ACTIVITY]: { item: 20, order: 100 },
  [PromoGroup.ASSET]: { item: 40, order: 110 },
  [PromoGroup.POS]: { item: 50, order: 120 },
  [PromoGroup.PLATFORM]: { item: 60, order: 130 },
  [PromoGroup.PAYMENT]: { item: 200, order: 200 },
};

export const getDefaultPriority = (cats: PromotionCategory[]): string[] => {
  const getScore = (c: PromotionCategory) => {
    const base = GROUP_PRIORITY[c.group];
    const scopeBase = c.defaultScope === PromoScope.SINGLE_ITEM ? base.item : base.order;
    // 同组内按名称稳定排序
    return scopeBase;
  };
  return [...cats]
    .sort((a, b) => {
      const diff = getScore(a) - getScore(b);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name, 'zh-CN');
    })
    .map(c => c.id);
};

/** 侧边栏/筛选使用的分组顺序 */
export const PROMO_GROUP_ORDER: PromoGroup[] = [
  PromoGroup.ACTIVITY,
  PromoGroup.MEMBER,
  PromoGroup.ASSET,
  PromoGroup.POS,
  PromoGroup.PLATFORM,
  PromoGroup.PAYMENT,
];

/** 同一订单中通常唯一的分组（矩阵对角线无需配置） */
export const SINGLETON_PROMO_GROUPS: PromoGroup[] = [PromoGroup.PAYMENT];
