import { PromoChannel, PromoInstance, PromoInstanceStatus, PromoScope } from '../types';

function inst(
  id: string,
  name: string,
  categoryId: string,
  value: number,
  isPercentage: boolean,
  scope: PromoScope,
  opts?: {
    status?: PromoInstanceStatus;
    effectiveStart?: string;
    effectiveEnd?: string;
    channels?: PromoChannel[];
  }
): PromoInstance {
  return {
    id,
    name,
    categoryId,
    value,
    isPercentage,
    scope,
    channels: opts?.channels ?? [PromoChannel.ALL],
    status: opts?.status,
    effectiveStart: opts?.effectiveStart,
    effectiveEnd: opts?.effectiveEnd,
  };
}

function genBulk(
  prefix: string,
  categoryId: string,
  count: number,
  scope: PromoScope,
  nameFn: (i: number) => string,
  optsFn?: (i: number) => Partial<Pick<PromoInstance, 'status' | 'effectiveStart' | 'effectiveEnd' | 'value' | 'isPercentage'>>
): PromoInstance[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const extra = optsFn?.(n) ?? {};
    return inst(
      `${prefix}_${String(n).padStart(4, '0')}`,
      nameFn(n),
      categoryId,
      extra.value ?? 0.8,
      extra.isPercentage ?? true,
      scope,
      {
        status: extra.status,
        effectiveStart: extra.effectiveStart ?? '2025-01-01',
        effectiveEnd: extra.effectiveEnd ?? '2026-12-31',
      }
    );
  });
}

const CORE_INSTANCES: PromoInstance[] = [
  inst('act_summer_2024', '夏季满200减30', 'act_order_threshold_red', 30, false, PromoScope.ORDER, {
    effectiveStart: '2025-06-01',
    effectiveEnd: '2025-09-30',
  }),
  inst('act_new_year', '春节满1000减200', 'act_order_threshold_red', 200, false, PromoScope.ORDER, {
    status: 'DISABLED',
    effectiveStart: '2025-01-20',
    effectiveEnd: '2025-02-10',
  }),
  inst('act_new_cust_15', '新客立减15元', 'act_order_new_cust', 15, false, PromoScope.ORDER, {
    channels: [PromoChannel.APP],
    effectiveStart: '2025-01-01',
    effectiveEnd: '2026-12-31',
  }),
  inst('act_delivery_free', '减配送费活动', 'act_order_delivery', 0, false, PromoScope.ORDER, {
    channels: [PromoChannel.APP],
  }),
  inst('cpn_item_free_001', '招牌菜免单券', 'asset_item_limited_free', 0, false, PromoScope.SINGLE_ITEM),
  inst('cpn_item_disc_8', '热菜8折券', 'asset_item_disc_voucher', 0.8, true, PromoScope.SINGLE_ITEM, {
    effectiveStart: '2025-03-01',
    effectiveEnd: '2026-06-30',
  }),
  inst('cpn_points_10', '1000积分抵10元', 'asset_item_points', 10, false, PromoScope.ORDER),
  inst('act_bogo_coffee', '咖啡买一送一', 'act_item_bogo', 0, false, PromoScope.SINGLE_ITEM),
  inst('act_limited_disc', '午市限时8折', 'act_item_limited_disc', 0.8, true, PromoScope.SINGLE_ITEM, {
    effectiveStart: '2025-01-01',
    effectiveEnd: '2026-12-31',
  }),
  inst('mem_gold_price', '金牌会员价9折', 'mbr_item_price', 0.9, true, PromoScope.SINGLE_ITEM),
  inst('mem_paid_price', '付费会员专享价', 'mbr_item_paid_price', 0.85, true, PromoScope.SINGLE_ITEM),
  inst('cpn_cash_50', '满100减50代金券', 'asset_order_cash', 50, false, PromoScope.ORDER),
  inst('pos_order_emp_5', '员工餐5折', 'pos_order_disc_scheme', 0.5, true, PromoScope.ORDER, {
    channels: [PromoChannel.POS],
  }),
];

/** 演示用活动实例，categoryId 对齐 INITIAL_CATEGORIES */
export const DATABASE_INSTANCES: PromoInstance[] = [
  ...CORE_INSTANCES,
  ...genBulk('cpn_disc', 'asset_item_disc_voucher', 120, PromoScope.SINGLE_ITEM, n => `折扣券活动-${n}`, n => ({
    status: n % 12 === 0 ? 'DISABLED' : n % 17 === 0 ? 'EXPIRED' : 'ENABLED',
    effectiveEnd: n % 17 === 0 ? '2024-12-31' : '2026-12-31',
    value: 0.7 + (n % 3) * 0.1,
  })),
  ...genBulk('act_limited', 'act_item_limited_disc', 120, PromoScope.SINGLE_ITEM, n => `限时折扣-${n}`, n => ({
    status: n % 15 === 0 ? 'PENDING' : 'ENABLED',
    effectiveStart: n % 15 === 0 ? '2026-10-01' : '2025-01-01',
    value: 0.75 + (n % 4) * 0.05,
  })),
  ...genBulk('cpn_goods', 'asset_item_goods_voucher', 108, PromoScope.SINGLE_ITEM, n => `商品券活动-${n}`, n => ({
    status: n % 20 === 0 ? 'DISABLED' : 'ENABLED',
    value: 10 + (n % 5) * 5,
    isPercentage: false,
  })),
  ...genBulk('act_threshold', 'act_order_threshold_red', 105, PromoScope.ORDER, n => `满减活动-${n}`, n => ({
    status: n % 18 === 0 ? 'EXPIRED' : 'ENABLED',
    value: 10 + (n % 8) * 5,
    isPercentage: false,
    effectiveEnd: n % 18 === 0 ? '2024-06-30' : '2026-12-31',
  })),
];
