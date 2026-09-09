/**
 * 折上折叠加
 *
 * 默认规则中的「共享且叠加」按商品原价分别计算各项优惠；
 * 开启后，指定的一组优惠改为在前一项优惠的折后价上继续计算（折上折），
 * 券的满额门槛同样按折后价判定。
 * 本期仅开放「限时折扣 + 折扣券」一组，后续再并入默认规则。
 */

export interface StackingPilotPair {
  id: string;
  /** 先算的优惠类型 id */
  leadCategoryId: string;
  /** 后算的优惠类型 id */
  followCategoryId: string;
  /** 是否启用本组叠加 */
  enabled: boolean;
}

export interface StackingPilotConfig {
  pairs: StackingPilotPair[];
}
