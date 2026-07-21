import { RuleMatrix, InstanceRuleMap, PromoInstance } from '../types';
import { ApplicationStrategyConfig } from '../types/applicationStrategy';

const STORAGE_KEY = 'promo-demo-config-v2';

export interface DemoPersistedState {
  typeMatrix: RuleMatrix;
  instanceRules: InstanceRuleMap;
  priorityList: string[];
  stackingStrategy: 'STATIC_PRIORITY' | 'OPERATION_ORDER';
  instances: PromoInstance[];
  applicationStrategy?: ApplicationStrategyConfig;
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
  } catch {
    // ignore quota errors in demo
  }
};

export const clearDemoState = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
};
