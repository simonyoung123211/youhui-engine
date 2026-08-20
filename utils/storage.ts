import { RuleMatrix, InstanceRuleMap, PromoInstance } from '../types';
import { ApplicationStrategyConfig } from '../types/applicationStrategy';

const STORAGE_KEY = 'promo-demo-config-v2';
/** 供消费者端 Demo 跨端口读取（localhost cookie 不区分端口） */
export const SHARED_MINI_PROGRAM_STRATEGY_COOKIE = 'qmai_mp_application_strategy';
export const SHARED_MINI_PROGRAM_STRATEGY_KEY = 'qmai.shared.miniProgramStrategy';

export interface DemoPersistedState {
  typeMatrix: RuleMatrix;
  instanceRules: InstanceRuleMap;
  priorityList: string[];
  stackingStrategy: 'STATIC_PRIORITY' | 'OPERATION_ORDER';
  instances: PromoInstance[];
  applicationStrategy?: ApplicationStrategyConfig;
}

/** 发布小程序应用策略摘要，供点餐优惠计算 Demo 读取 */
export function publishSharedMiniProgramStrategy(
  strategy: ApplicationStrategyConfig['miniProgram'] | undefined
): void {
  if (typeof document === 'undefined' || !strategy) return;
  const payload = {
    couponHiddenCategoryRedeem: strategy.couponHiddenCategoryRedeem,
    orderOptimalDiscount: strategy.orderOptimalDiscount,
    maxCouponsPerOrder: strategy.maxCouponsPerOrder,
    maxGroupBuyVouchersPerOrder: strategy.maxGroupBuyVouchersPerOrder,
    estimatedPriceEnabled: strategy.estimatedPrice?.enabled,
  };
  try {
    const raw = JSON.stringify(payload);
    localStorage.setItem(SHARED_MINI_PROGRAM_STRATEGY_KEY, raw);
    document.cookie = `${SHARED_MINI_PROGRAM_STRATEGY_COOKIE}=${encodeURIComponent(raw)}; path=/; max-age=604800; SameSite=Lax`;
  } catch {
    // ignore quota / cookie errors in demo
  }
}

export const loadDemoState = (): Partial<DemoPersistedState> | null => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoPersistedState;
  } catch {
    return null;
  }
};

export const saveDemoState = (state: DemoPersistedState): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    publishSharedMiniProgramStrategy(state.applicationStrategy?.miniProgram);
  } catch {
    // ignore quota errors in demo
  }
};

export const clearDemoState = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
};
