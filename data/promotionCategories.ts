import {
  CategoryInstanceMode,
  InteractionType,
  PromoGroup,
  PromoInstance,
  PromoScope,
  PromoType,
  PromotionCategory,
  RuleMatrix,
  getDefaultPriority,
} from '../types';

const TYPE_ONLY_MEMBER_IDS = new Set(['mbr_item_privilege', 'mbr_order_topup_bundle']);

function cat(
  id: string,
  group: PromoGroup,
  name: string,
  type: PromoType,
  description: string,
  defaultScope: PromoScope
): PromotionCategory {
  return { id, group, name, type, description, defaultScope };
}

export const INITIAL_CATEGORIES: PromotionCategory[] = [
  // ── 单品 · 营销活动 (5) ──
  cat('act_item_limited_disc', PromoGroup.ACTIVITY, '限时折扣', PromoType.LIMITED_TIME_DISCOUNT, '指定时段单品特价', PromoScope.SINGLE_ITEM),
  cat('act_item_m_n_disc', PromoGroup.ACTIVITY, '满M件N折', PromoType.M_PIECES_N_DISCOUNT, '满件打折', PromoScope.SINGLE_ITEM),
  cat('act_item_bogo', PromoGroup.ACTIVITY, '买1送1', PromoType.BOGO, '单品买赠', PromoScope.SINGLE_ITEM),
  cat('act_item_sv_pay_disc', PromoGroup.ACTIVITY, '储值付优惠', PromoType.STORED_VALUE_PAY_DISCOUNT, '储值支付享单品优惠', PromoScope.SINGLE_ITEM),
  cat('act_item_fixed_price', PromoGroup.ACTIVITY, '一口价', PromoType.FIXED_PRICE, '单品固定特价', PromoScope.SINGLE_ITEM),

  // ── 单品 · 用户权益 (3) ──
  cat('mbr_item_privilege', PromoGroup.MEMBER, '消费特权', PromoType.CONSUMPTION_PRIVILEGE, '会员消费特权价', PromoScope.SINGLE_ITEM),
  cat('mbr_item_price', PromoGroup.MEMBER, '会员价', PromoType.MEMBER_PRICE, '会员专享单品价', PromoScope.SINGLE_ITEM),
  cat('mbr_item_paid_price', PromoGroup.MEMBER, '付费会员价', PromoType.PAID_MEMBER_PRICE, '付费会员专享价', PromoScope.SINGLE_ITEM),

  // ── 单品 · 用户资产 (12) ──
  cat('asset_item_disc_voucher', PromoGroup.ASSET, '折扣券', PromoType.DISCOUNT_VOUCHER, '单品折扣券', PromoScope.SINGLE_ITEM),
  cat('asset_item_goods_voucher', PromoGroup.ASSET, '商品券', PromoType.ITEM_VOUCHER, '指定商品抵扣', PromoScope.SINGLE_ITEM),
  cat('asset_item_buy_a_b', PromoGroup.ASSET, '买A送B券', PromoType.BUY_A_GET_B_VOUCHER, '买赠券', PromoScope.SINGLE_ITEM),
  cat('asset_item_limited_free', PromoGroup.ASSET, '限制数量免单券', PromoType.LIMITED_FREE_VOUCHER, '限量免单', PromoScope.SINGLE_ITEM),
  cat('asset_item_exchange', PromoGroup.ASSET, '兑换券', PromoType.EXCHANGE_VOUCHER, '商品兑换', PromoScope.SINGLE_ITEM),
  cat('asset_item_reduce_to', PromoGroup.ASSET, '减至券', PromoType.REDUCE_TO_VOUCHER, '减至指定价', PromoScope.SINGLE_ITEM),
  cat('asset_item_count', PromoGroup.ASSET, '次券', PromoType.COUNT_VOUCHER, '次卡型券', PromoScope.SINGLE_ITEM),
  cat('asset_item_addon', PromoGroup.ASSET, '加料券', PromoType.ADDON_VOUCHER, '加料抵扣', PromoScope.SINGLE_ITEM),
  cat('asset_item_cash_card', PromoGroup.ASSET, '现金卡', PromoType.CASH_CARD, '现金型卡券', PromoScope.SINGLE_ITEM),
  cat('asset_item_count_card', PromoGroup.ASSET, '商品次卡', PromoType.ITEM_COUNT_CARD, '商品次卡', PromoScope.SINGLE_ITEM),
  cat('asset_item_single_card', PromoGroup.ASSET, '单次卡', PromoType.SINGLE_USE_CARD, '单次使用卡', PromoScope.SINGLE_ITEM),
  cat('asset_item_points', PromoGroup.ASSET, '积分抵现', PromoType.POINTS_DEDUCTION, '积分抵扣单品金额', PromoScope.SINGLE_ITEM),

  // ── 单品 · 企迈POS (3) ──
  cat('pos_item_custom', PromoGroup.POS, '自定义记账', PromoType.POS_ITEM_CUSTOM_ACCOUNT, 'POS单品自定义优惠', PromoScope.SINGLE_ITEM),
  cat('pos_item_fixed', PromoGroup.POS, '固定金额', PromoType.POS_ITEM_FIXED_AMOUNT, 'POS单品固定减免', PromoScope.SINGLE_ITEM),
  cat('pos_item_disc_scheme', PromoGroup.POS, '折扣方案', PromoType.POS_ITEM_DISCOUNT_SCHEME, 'POS单品折扣方案', PromoScope.SINGLE_ITEM),

  // ── 单品 · 平台团购 (6) ──
  cat('plat_item_mt_set', PromoGroup.PLATFORM, '美团套餐券', PromoType.MT_SET_MEAL, '美团套餐核销', PromoScope.SINGLE_ITEM),
  cat('plat_item_mt_count', PromoGroup.PLATFORM, '美团次券', PromoType.MT_COUNT, '美团次卡核销', PromoScope.SINGLE_ITEM),
  cat('plat_item_dy_set', PromoGroup.PLATFORM, '抖音套餐券', PromoType.DY_SET_MEAL, '抖音套餐核销', PromoScope.SINGLE_ITEM),
  cat('plat_item_dy_count', PromoGroup.PLATFORM, '抖音次券', PromoType.DY_COUNT, '抖音次卡核销', PromoScope.SINGLE_ITEM),
  cat('plat_item_alipay_set', PromoGroup.PLATFORM, '支付宝套餐券', PromoType.ALIPAY_SET_MEAL, '支付宝套餐核销', PromoScope.SINGLE_ITEM),
  cat('plat_item_tb_set', PromoGroup.PLATFORM, '淘宝闪购套餐券', PromoType.TB_FLASH_SET_MEAL, '淘宝闪购套餐核销', PromoScope.SINGLE_ITEM),

  // ── 整单 · 营销活动 (5) ──
  cat('act_order_threshold_red', PromoGroup.ACTIVITY, '满减', PromoType.THRESHOLD_REDUCE, '满额立减', PromoScope.ORDER),
  cat('act_order_threshold_gift', PromoGroup.ACTIVITY, '满赠', PromoType.THRESHOLD_GIFT, '满额赠品', PromoScope.ORDER),
  cat('act_order_addon', PromoGroup.ACTIVITY, '特惠加购', PromoType.ADD_ON_DEAL, '加价购优惠', PromoScope.ORDER),
  cat('act_order_delivery', PromoGroup.ACTIVITY, '减配送费', PromoType.DELIVERY_FEE_REDUCE, '减免配送费', PromoScope.ORDER),
  cat('act_order_new_cust', PromoGroup.ACTIVITY, '新客专享', PromoType.NEW_CUSTOMER_EXCLUSIVE, '新客整单优惠', PromoScope.ORDER),

  // ── 整单 · 用户权益 (1) ──
  cat('mbr_order_topup_bundle', PromoGroup.MEMBER, '储值搭售折扣', PromoType.TOP_UP_BUNDLE_DISCOUNT, '储值搭售整单折扣', PromoScope.ORDER),

  // ── 整单 · 用户资产 (2) ──
  cat('asset_order_cash', PromoGroup.ASSET, '代金券', PromoType.CASH_VOUCHER, '整单代金券', PromoScope.ORDER),
  cat('asset_order_delivery', PromoGroup.ASSET, '配送费券', PromoType.DELIVERY_VOUCHER, '配送费减免券', PromoScope.ORDER),

  // ── 整单 · 企迈POS (3) ──
  cat('pos_order_custom', PromoGroup.POS, '自定义记账', PromoType.POS_ORDER_CUSTOM_ACCOUNT, 'POS整单自定义优惠', PromoScope.ORDER),
  cat('pos_order_fixed', PromoGroup.POS, '固定金额', PromoType.POS_ORDER_FIXED_AMOUNT, 'POS整单固定减免', PromoScope.ORDER),
  cat('pos_order_disc_scheme', PromoGroup.POS, '折扣方案', PromoType.POS_ORDER_DISCOUNT_SCHEME, 'POS整单折扣方案', PromoScope.ORDER),

  // ── 整单 · 平台团购 (4) ──
  cat('plat_order_mt_cash', PromoGroup.PLATFORM, '美团代金券', PromoType.MT_CASH_VOUCHER, '美团代金券核销', PromoScope.ORDER),
  cat('plat_order_dy_cash', PromoGroup.PLATFORM, '抖音代金券', PromoType.DY_CASH_VOUCHER, '抖音代金券核销', PromoScope.ORDER),
  cat('plat_order_alipay_cash', PromoGroup.PLATFORM, '支付宝代金券', PromoType.ALIPAY_CASH_VOUCHER, '支付宝代金券核销', PromoScope.ORDER),
  cat('plat_order_tb_cash', PromoGroup.PLATFORM, '淘宝闪购代金券', PromoType.TB_FLASH_CASH_VOUCHER, '淘宝闪购代金券核销', PromoScope.ORDER),

  // ── 支付方式 (3) ──
  cat('pay_balance', PromoGroup.PAYMENT, '储值余额', PromoType.STORED_VALUE_BALANCE, '会员卡储值余额支付', PromoScope.ORDER),
  cat('pay_physical_card', PromoGroup.PAYMENT, '实体储值卡', PromoType.PHYSICAL_STORED_VALUE_CARD, '实体储值卡支付', PromoScope.ORDER),
  cat('pay_pos_settle', PromoGroup.PAYMENT, '企迈POS线下结账', PromoType.POS_OFFLINE_SETTLEMENT, 'POS线下结账方式', PromoScope.ORDER),
];

export function hydratePriorityList(
  saved: string[] | undefined,
  cats: PromotionCategory[]
): string[] {
  const defaultList = getDefaultPriority(cats);
  if (!saved?.length) return defaultList;
  const validIds = new Set(cats.map(c => c.id));
  const kept = saved.filter(id => validIds.has(id));
  const keptSet = new Set(kept);
  const missing = defaultList.filter(id => !keptSet.has(id));
  return [...kept, ...missing];
}

export function hydrateMatrix(
  saved: RuleMatrix | undefined,
  cats: PromotionCategory[]
): RuleMatrix {
  const base = generateInitialMatrix(cats);
  if (!saved) return base;
  cats.forEach(row => {
    cats.forEach(col => {
      const v = saved[row.id]?.[col.id];
      if (v !== undefined) base[row.id][col.id] = v;
    });
  });
  return base;
}

export function hydrateInstances(
  saved: PromoInstance[] | undefined,
  fallback: PromoInstance[],
  cats: PromotionCategory[]
): PromoInstance[] {
  const validCatIds = new Set(cats.map(c => c.id));
  if (!saved?.length) return fallback;
  const valid = saved.filter(i => validCatIds.has(i.categoryId));
  return valid.length ? valid : fallback;
}

/** 判定优惠类型是否仅有类型维度、无活动实例 */
export function getCategoryInstanceMode(cat: PromotionCategory): CategoryInstanceMode {
  if (cat.group === PromoGroup.PAYMENT || cat.group === PromoGroup.PLATFORM) {
    return 'TYPE_ONLY';
  }
  if (TYPE_ONLY_MEMBER_IDS.has(cat.id)) {
    return 'TYPE_ONLY';
  }
  return 'INSTANCE';
}

export function isTypeOnlyCategory(cat: PromotionCategory): boolean {
  return getCategoryInstanceMode(cat) === 'TYPE_ONLY';
}

export function countInstanceCapableCategories(categories: PromotionCategory[]): number {
  return categories.filter(c => getCategoryInstanceMode(c) === 'INSTANCE').length;
}

export function generateInitialMatrix(cats: PromotionCategory[]): RuleMatrix {
  const matrix: RuleMatrix = {};
  cats.forEach(row => {
    matrix[row.id] = {};
    cats.forEach(col => {
      if (row.id === col.id) {
        if (row.defaultScope === PromoScope.SINGLE_ITEM) {
          matrix[row.id][col.id] = InteractionType.ITEM_MUTEX;
        } else {
          matrix[row.id][col.id] = InteractionType.MUTEX;
        }
      } else if (
        row.defaultScope === PromoScope.SINGLE_ITEM &&
        col.defaultScope === PromoScope.SINGLE_ITEM
      ) {
        matrix[row.id][col.id] = InteractionType.ITEM_MUTEX;
      } else {
        matrix[row.id][col.id] = InteractionType.MUTEX;
      }
    });
  });
  return matrix;
}
