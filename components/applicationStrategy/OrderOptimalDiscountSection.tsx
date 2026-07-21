import React from 'react';
import { StrategyRadioGroup } from './ConfigSection';
import {
  OrderOptimalDiscountPolicy,
  OrderOptimizationMode,
} from '../../types/applicationStrategy';

interface OrderOptimalDiscountSectionProps {
  policy: OrderOptimalDiscountPolicy;
  onChange: (policy: OrderOptimalDiscountPolicy) => void;
  readOnly?: boolean;
}

const POLICY_OPTIONS: {
  value: OrderOptimizationMode;
  label: string;
  description: string;
}[] = [
  {
    value: 'CART_AUTO_APPLY',
    label: '购物车起自动优选',
    description:
      '购物车计算最优优惠组合时包含优惠券，推荐券自动应用并计入应付；提交订单页继承并复核。',
  },
  {
    value: 'SUBMIT_AUTO_APPLY',
    label: '提交订单页最终优选',
    description:
      '购物车最优优惠不含优惠券；进入提交订单页后，结合完整订单条件将优惠券纳入最优计算并自动应用。',
  },
  {
    value: 'USER_CHOICE',
    label: '不自动应用，由用户选择',
    description:
      '购物车和提交订单页的系统最优优惠均不含优惠券；用户主动选券后，优惠券计入当前应付。',
  },
];

export function OrderOptimalDiscountSection({
  policy,
  onChange,
  readOnly = false,
}: OrderOptimalDiscountSectionProps) {
  return (
    <section className="strategy-config-section">
      <div className="strategy-config-section__header">
        <div className="strategy-config-section__title-wrap">
          <h3 className="strategy-config-section__title">购物车与提交订单最优优惠</h3>
          <p className="strategy-config-section__desc">
            系统自动计算订单最优优惠组合。促销活动始终参与；可配置推荐优惠券的自动应用时机。
          </p>
        </div>
      </div>
      <div className={`strategy-config-section__body${readOnly ? ' is-disabled' : ''}`}>
        <div className="strategy-policy-scope">
          <span className="strategy-policy-scope__label">影响范围</span>
          <span className="strategy-policy-scope__path">购物车 → 提交订单</span>
        </div>

        <StrategyRadioGroup
          label="推荐优惠券自动应用时机"
          value={policy.couponAutoApplyStage}
          disabled={readOnly}
          onChange={value =>
            onChange({ couponAutoApplyStage: value as OrderOptimizationMode })
          }
          options={POLICY_OPTIONS}
        />

        <div className="strategy-note strategy-note--info">
          优惠券始终进行可用性判断和后台试算，但只有达到所选阶段才自动计入应付。用户主动选择优先；系统自动优选不得导致订单实付上涨。商品预估到手价不受此策略影响。
        </div>
      </div>
    </section>
  );
}
