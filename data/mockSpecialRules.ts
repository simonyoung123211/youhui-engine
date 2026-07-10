import { InteractionType, RuleRelationScope, SpecialRule, SpecialRuleStatus } from '../types';

/** 演示用 A/B/C 三个优惠类型（对应用户举例） */
export const DEMO_TYPE_A = 'demo_type_a';
export const DEMO_TYPE_B = 'demo_type_b';
export const DEMO_TYPE_C = 'demo_type_c';

export const DEMO_TYPE_LABELS: Record<string, string> = {
  [DEMO_TYPE_A]: '优惠类型A（满减）',
  [DEMO_TYPE_B]: '优惠类型B（满赠）',
  [DEMO_TYPE_C]: '优惠类型C（代金券）',
};

export const INITIAL_SPECIAL_RULES: SpecialRule[] = [
  {
    id: '202507010001',
    name: 'ABC组内同享',
    relationScope: 'INTRA_GROUP',
    interaction: InteractionType.ITEM_MUTEX,
    sideA: [
      { refType: 'TYPE', refId: DEMO_TYPE_A, refName: DEMO_TYPE_LABELS[DEMO_TYPE_A] },
      { refType: 'TYPE', refId: DEMO_TYPE_B, refName: DEMO_TYPE_LABELS[DEMO_TYPE_B] },
      { refType: 'TYPE', refId: DEMO_TYPE_C, refName: DEMO_TYPE_LABELS[DEMO_TYPE_C] },
    ],
    status: 'ENABLED',
    priority: 1,
    createdAt: '2025-07-01T10:00:00',
    createdBy: '总部运营 / 10001',
    updatedAt: '2025-07-01T10:00:00',
    updatedBy: '总部运营 / 10001',
  },
  {
    id: '202507020002',
    name: 'AB与C组间互斥',
    relationScope: 'INTER_GROUP',
    interaction: InteractionType.MUTEX,
    sideA: [
      { refType: 'TYPE', refId: DEMO_TYPE_A, refName: DEMO_TYPE_LABELS[DEMO_TYPE_A] },
      { refType: 'TYPE', refId: DEMO_TYPE_B, refName: DEMO_TYPE_LABELS[DEMO_TYPE_B] },
    ],
    sideB: [{ refType: 'TYPE', refId: DEMO_TYPE_C, refName: DEMO_TYPE_LABELS[DEMO_TYPE_C] }],
    status: 'ENABLED',
    priority: 2,
    createdAt: '2025-07-02T14:00:00',
    createdBy: '总部运营 / 10001',
    updatedAt: '2025-07-02T14:00:00',
    updatedBy: '总部运营 / 10001',
  },
  {
    id: '202506220004',
    name: '满减与券互斥',
    relationScope: 'INTER_GROUP',
    interaction: InteractionType.MUTEX,
    sideA: [
      { refType: 'TYPE', refId: 'act_order_threshold_red', refName: '满减' },
      { refType: 'TYPE', refId: 'act_order_threshold_gift', refName: '满赠' },
    ],
    sideB: [{ refType: 'TYPE', refId: 'asset_order_cash', refName: '代金券' }],
    status: 'ENABLED',
    priority: 4,
    createdAt: '2025-06-22T09:12:56',
    createdBy: '李四 / 10003',
    updatedAt: '2025-06-22T09:12:56',
    updatedBy: '李四 / 10003',
  },
  {
    id: '202506180005',
    name: '会员权益组内共享',
    relationScope: 'INTRA_GROUP',
    interaction: InteractionType.ITEM_MUTEX,
    sideA: [
      { refType: 'TYPE', refId: 'mbr_item_price', refName: '会员价' },
      { refType: 'TYPE', refId: 'mbr_item_paid_price', refName: '付费会员价' },
    ],
    status: 'ENABLED',
    priority: 6,
    createdAt: '2025-06-18T17:30:00',
    createdBy: 'YYJ / 10001',
    updatedAt: '2025-06-18T17:30:00',
    updatedBy: 'YYJ / 10001',
  },
  {
    id: '202506120006',
    name: '平台券互斥（含失效活动）',
    relationScope: 'INTER_GROUP',
    interaction: InteractionType.MUTEX,
    sideA: [{ refType: 'TYPE', refId: 'plat_item_mt_set', refName: '美团套餐券' }],
    sideB: [
      { refType: 'INSTANCE', refId: 'act_summer_2024', refName: '夏季满200减30', expired: true },
    ],
    status: 'ENABLED',
    createdAt: '2025-06-12T13:05:42',
    createdBy: '王五 / 10004',
    updatedAt: '2025-06-12T13:05:42',
    updatedBy: '王五 / 10004',
  },
  {
    id: '202506080007',
    name: '早餐次卡共享（已停用）',
    relationScope: 'INTRA_GROUP',
    interaction: InteractionType.ALLOW,
    sideA: [{ refType: 'TYPE', refId: 'asset_item_count_card', refName: '商品次卡' }],
    status: 'DISABLED',
    priority: 7,
    createdAt: '2025-06-08T10:18:27',
    createdBy: 'YYJ / 10001',
    updatedAt: '2025-06-10T11:00:00',
    updatedBy: 'YYJ / 10001',
  },
  {
    id: '202507030003',
    name: '夏季满减与满100券共享（实例级）',
    relationScope: 'INTER_GROUP',
    interaction: InteractionType.ITEM_MUTEX,
    sideA: [{ refType: 'INSTANCE', refId: 'act_summer_2024', refName: '夏季满200减30' }],
    sideB: [{ refType: 'INSTANCE', refId: 'cpn_cash_50', refName: '满100减50代金券' }],
    status: 'ENABLED',
    priority: 3,
    createdAt: '2025-07-03T09:00:00',
    createdBy: '总部运营 / 10001',
    updatedAt: '2025-07-03T09:00:00',
    updatedBy: '总部运营 / 10001',
  },
  {
    id: '202507030004',
    name: '满减类与代金券类互斥（类型级）',
    relationScope: 'INTER_GROUP',
    interaction: InteractionType.MUTEX,
    sideA: [
      { refType: 'TYPE', refId: 'act_order_threshold_red', refName: '满减' },
      { refType: 'INSTANCE', refId: 'act_summer_2024', refName: '夏季满200减30' },
    ],
    sideB: [
      { refType: 'TYPE', refId: 'asset_order_cash', refName: '代金券' },
      { refType: 'INSTANCE', refId: 'cpn_cash_50', refName: '满100减50代金券' },
    ],
    status: 'ENABLED',
    priority: 5,
    createdAt: '2025-07-04T11:00:00',
    createdBy: '总部运营 / 10001',
    updatedAt: '2025-07-04T11:00:00',
    updatedBy: '总部运营 / 10001',
  },
];

const BULK_TYPE_REFS = [
  { refType: 'TYPE' as const, refId: 'act_order_threshold_red', refName: '满减' },
  { refType: 'TYPE' as const, refId: 'act_order_threshold_gift', refName: '满赠' },
  { refType: 'TYPE' as const, refId: 'asset_order_cash', refName: '代金券' },
  { refType: 'TYPE' as const, refId: 'asset_item_disc_voucher', refName: '折扣券' },
  { refType: 'TYPE' as const, refId: 'act_item_limited_disc', refName: '限时折扣' },
  { refType: 'TYPE' as const, refId: 'mbr_item_price', refName: '会员价' },
  { refType: 'TYPE' as const, refId: 'plat_item_mt_set', refName: '美团套餐券' },
  { refType: 'TYPE' as const, refId: 'pay_balance', refName: '储值余额' },
];

function genBulkSpecialRules(count: number, startPriority: number): SpecialRule[] {
  const interactions = [
    InteractionType.MUTEX,
    InteractionType.ITEM_MUTEX,
    InteractionType.ALLOW,
  ];
  const scopes: RuleRelationScope[] = ['INTRA_GROUP', 'INTER_GROUP'];
  const statuses: SpecialRuleStatus[] = ['ENABLED', 'DISABLED'];

  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const scope = scopes[n % scopes.length];
    const interaction = interactions[n % interactions.length];
    const status = statuses[n % 5 === 0 ? 1 : 0];
    const typeA = BULK_TYPE_REFS[n % BULK_TYPE_REFS.length];
    const typeB = BULK_TYPE_REFS[(n + 3) % BULK_TYPE_REFS.length];
    const day = String((n % 28) + 1).padStart(2, '0');
    const createdAt = `2025-0${(n % 6) + 1}-${day}T10:00:00`;
    const updatedAt = `2025-0${(n % 6) + 1}-${day}T${String(10 + (n % 8)).padStart(2, '0')}:30:00`;

    return {
      id: `202501${String(100000 + n).slice(1)}`,
      name:
        scope === 'INTRA_GROUP'
          ? `批量组内规则-${n}`
          : `批量组间规则-${n}`,
      relationScope: scope,
      interaction,
      sideA:
        scope === 'INTRA_GROUP'
          ? [typeA, typeB]
          : [typeA],
      sideB: scope === 'INTER_GROUP' ? [typeB] : undefined,
      status,
      priority: startPriority + i,
      createdAt,
      createdBy: '演示数据 / bulk',
      updatedAt,
      updatedBy: '演示数据 / bulk',
    };
  });
}

/** 演示池：初始规则 + 批量规则（共 520 条，用于列表分页压测） */
export function buildDemoSpecialRulesPool(): SpecialRule[] {
  const bulk = genBulkSpecialRules(512, INITIAL_SPECIAL_RULES.length + 1);
  return [...INITIAL_SPECIAL_RULES, ...bulk];
}

/** 实例 id → 类型 id，供具体度计算 */
export const INSTANCE_TYPE_MAP: Record<string, string> = {
  act_summer_2024: 'act_order_threshold_red',
  cpn_cash_50: 'asset_order_cash',
  cpn_item_free_001: 'asset_item_limited_free',
  cpn_item_disc_8: 'asset_item_disc_voucher',
  mem_gold_price: 'mbr_item_price',
};
