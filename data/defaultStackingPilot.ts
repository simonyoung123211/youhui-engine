import { StackingPilotConfig, StackingPilotPair } from '../types/stackingPilot';

/** 本期试点组：限时折扣（先算） + 折扣券（后算） */
export const PILOT_PAIR_ID = 'pilot_limited_disc_x_disc_voucher';

const DEFAULT_PAIR: StackingPilotPair = {
  id: PILOT_PAIR_ID,
  leadCategoryId: 'act_item_limited_disc',
  followCategoryId: 'asset_item_disc_voucher',
  enabled: false,
};

export const DEFAULT_STACKING_PILOT: StackingPilotConfig = {
  pairs: [DEFAULT_PAIR],
};

export function hydrateStackingPilot(
  saved: StackingPilotConfig | undefined
): StackingPilotConfig {
  const savedPair = saved?.pairs?.find(p => p.id === PILOT_PAIR_ID);
  if (!savedPair) return structuredClone(DEFAULT_STACKING_PILOT);
  return {
    pairs: [
      { ...DEFAULT_PAIR, enabled: savedPair.enabled ?? DEFAULT_PAIR.enabled },
    ],
  };
}

export function areStackingPilotsEqual(
  a: StackingPilotConfig,
  b: StackingPilotConfig
): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
