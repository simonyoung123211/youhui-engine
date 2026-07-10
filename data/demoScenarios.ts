import { PromoInstance, SimulationItem } from '../types';
import { Product } from '../types';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  highlight: string;
  cartItems: SimulationItem[];
  /** promo instance id -> optional target item id */
  selectedPromos: { instanceId: string; targetItemId?: string }[];
  suggestedChannel?: 'POS' | 'APP';
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'item_mutex',
    name: '场景 A：共享不叠加',
    description: '同一商品同时使用「金牌会员专享价」与「热菜8折券」，演示单品级共享不叠加规则。',
    highlight: '会员价 vs 折扣券 · ITEM_MUTEX',
    cartItems: [
      { id: 'p_crayfish', name: '招牌麻辣小龙虾', price: 99, qty: 1 },
      { id: 'p_fish', name: '酸菜鱼', price: 68, qty: 1 },
    ],
    selectedPromos: [
      { instanceId: 'mem_gold_price', targetItemId: 'p_crayfish' },
      { instanceId: 'cpn_item_disc_8', targetItemId: 'p_crayfish' },
      { instanceId: 'mem_gold_price', targetItemId: 'p_fish' },
    ],
  },
  {
    id: 'dual_channel',
    name: '场景 B：双端价差',
    description: '整单叠加「夏季满减」+「员工内部5折(POS)」，对比 B 端收银台与 C 端小程序的最终实付差异。',
    highlight: 'POS 专属优惠 · 渠道差异',
    cartItems: [
      { id: 'p_crayfish', name: '招牌麻辣小龙虾', price: 99, qty: 2 },
      { id: 'p_tea', name: '珍珠奶茶', price: 18, qty: 2 },
    ],
    selectedPromos: [
      { instanceId: 'act_summer_2024' },
      { instanceId: 'emp_internal' },
    ],
    suggestedChannel: 'POS',
  },
];

export const resolveScenarioBenchPromos = (
  scenario: DemoScenario,
  allInstances: PromoInstance[]
): PromoInstance[] => {
  const ids = new Set(scenario.selectedPromos.map(p => p.instanceId));
  return allInstances.filter(i => ids.has(i.id));
};

export const resolveScenarioBenchProducts = (
  scenario: DemoScenario,
  allProducts: Product[]
): Product[] => {
  const ids = new Set(scenario.cartItems.map(i => i.id));
  const fromDb = allProducts.filter(p => ids.has(p.id));
  const missing = scenario.cartItems.filter(
    ci => !fromDb.some(p => p.id === ci.id)
  );
  return [
    ...fromDb,
    ...missing.map(ci => ({
      id: ci.id,
      name: ci.name,
      price: ci.price,
      category: 'HOT' as const,
      image: '🍽️',
    })),
  ];
};
