import React from 'react';
import {
  ConfigSection,
  StrategyCheckboxRow,
  StrategyRadioGroup,
  StrategySubGroup,
} from './ConfigSection';
import { CoexistLabelPicker } from './CoexistLabelPicker';
import { PriceCaliberSection } from './PriceCaliberSection';
import { OrderOptimalDiscountSection } from './OrderOptimalDiscountSection';
import { CouponLimitStepper } from './CouponLimitStepper';
import { PromotionCategory } from '../../types';
import {
  ApplicationStrategyConfig,
  AfterAddToCartBehavior,
  EstimatedPriceDisplayMode,
} from '../../types/applicationStrategy';
import {
  ESTIMATED_PRICE_CALC_RULES,
  getSingleItemActivityCategories,
} from '../../data/defaultApplicationStrategy';

interface MiniProgramTabProps {
  config: ApplicationStrategyConfig['miniProgram'];
  categories: PromotionCategory[];
  onChange: (next: ApplicationStrategyConfig['miniProgram']) => void;
  readOnly?: boolean;
}

export function MiniProgramTab({
  config,
  categories,
  onChange,
  readOnly = false,
}: MiniProgramTabProps) {
  const activityCategories = getSingleItemActivityCategories(categories);
  const estimatedEnabled = config.estimatedPrice.enabled;
  const sectionDisabled = (enabled: boolean) => readOnly || !enabled;

  const patchEstimated = (
    patch: Partial<ApplicationStrategyConfig['miniProgram']['estimatedPrice']>
  ) => {
    onChange({ ...config, estimatedPrice: { ...config.estimatedPrice, ...patch } });
  };

  return (
    <div className="strategy-tab-content">
      <div className="strategy-section-heading">小程序配置</div>

      <PriceCaliberSection />

      <ConfigSection
        title="商品预估到手价"
        description="统一价格展示类型：销售价/划线价 > 促销价 > 预估到手价。与订单选券策略解耦，仅控制商品曝光层级的展示行为。"
        enabled={estimatedEnabled}
        onEnabledChange={enabled => patchEstimated({ enabled })}
        readOnly={readOnly}
      >
        <div className="strategy-note strategy-note--info">{ESTIMATED_PRICE_CALC_RULES}</div>
        <p className="strategy-row__hint">
          若无适用优惠券，仅展示促销活动后的预估结果；若无任何优惠，可不展示预估到手价。
        </p>

        <StrategySubGroup title="展示范围">
          <StrategyCheckboxRow
            label="小程序堂食：商品列表页隐藏预估到手价标签"
            checked={config.estimatedPrice.hideLabelDineIn}
            disabled={sectionDisabled(estimatedEnabled)}
            onChange={hideLabelDineIn => patchEstimated({ hideLabelDineIn })}
          />
          <StrategyCheckboxRow
            label="小程序外卖：商品列表页隐藏预估到手价标签"
            checked={config.estimatedPrice.hideLabelTakeout}
            disabled={sectionDisabled(estimatedEnabled)}
            onChange={hideLabelTakeout => patchEstimated({ hideLabelTakeout })}
          />
        </StrategySubGroup>

        <StrategyRadioGroup
          label="预估到手价展示模式"
          value={config.estimatedPrice.displayMode}
          disabled={sectionDisabled(estimatedEnabled)}
          onChange={v => patchEstimated({ displayMode: v as EstimatedPriceDisplayMode })}
          options={[
            {
              value: 'STANDARD',
              label: '标准模式',
              description: '预估到手价独占展示，隐藏其他促销标签',
            },
            {
              value: 'COMPATIBLE',
              label: '兼容模式',
              description: '预估到手价可与指定单品促销活动标签共存',
            },
          ]}
        />

        {config.estimatedPrice.displayMode === 'COMPATIBLE' && (
          <div className="strategy-sub-group">
            <div className="strategy-sub-group__title">可与预估到手价共存的单品促销活动</div>
            <p className="strategy-row__hint mb-2">
              仅映射当前项目中的单品类营销活动类型
            </p>
            <CoexistLabelPicker
              categories={activityCategories}
              selectedIds={config.estimatedPrice.coexistCategoryIds}
              disabled={sectionDisabled(estimatedEnabled)}
              onChange={coexistCategoryIds => patchEstimated({ coexistCategoryIds })}
            />
          </div>
        )}

        <StrategyRadioGroup
          label="任意展示预估到手价的商品加入购物车后"
          hint="隐藏标签可避免券与门店促销互斥规则导致用户困惑"
          value={config.estimatedPrice.afterAddToCart}
          disabled={sectionDisabled(estimatedEnabled)}
          onChange={v => patchEstimated({ afterAddToCart: v as AfterAddToCartBehavior })}
          options={[
            {
              value: 'KEEP',
              label: '所有商品预估到手价标签依旧展示',
            },
            {
              value: 'HIDE_ALL',
              label: '所有商品预估到手价标签隐藏',
            },
          ]}
        />
      </ConfigSection>

      <OrderOptimalDiscountSection
        policy={config.orderOptimalDiscount}
        readOnly={readOnly}
        onChange={orderOptimalDiscount => onChange({ ...config, orderOptimalDiscount })}
      />

      <div className="strategy-section-heading">基础规则配置</div>

      <div className={`strategy-config-block${readOnly ? ' is-readonly' : ''}`}>
        <div className="strategy-row">
          <div className="strategy-row__main">
            <div className="strategy-row__label">每单使用优惠券限制</div>
            <p className="strategy-row__hint">
              限制每笔订单可核销的优惠券数量上限，默认为 30 张，可根据实际情况修改，最大可设置为 50 张。小程序（堂食/外卖/买单）点单、自助点餐大屏点单等皆生效。
            </p>
          </div>
          <CouponLimitStepper
            value={config.maxCouponsPerOrder}
            min={1}
            max={50}
            fallback={30}
            disabled={readOnly}
            onChange={maxCouponsPerOrder => onChange({ ...config, maxCouponsPerOrder })}
          />
        </div>

        <div className="strategy-row">
          <div className="strategy-row__main">
            <div className="strategy-row__label">每单使用团购券限制</div>
            <p className="strategy-row__hint">
              限制小程序堂食/外带下单时，每笔订单可使用的平台团购券（套餐券/次券等）数量上限，默认为 5 张，可设置范围 1–10 张。
            </p>
          </div>
          <CouponLimitStepper
            value={config.maxGroupBuyVouchersPerOrder}
            min={1}
            max={10}
            fallback={5}
            disabled={readOnly}
            ariaLabel="每单团购券上限"
            onChange={maxGroupBuyVouchersPerOrder => onChange({ ...config, maxGroupBuyVouchersPerOrder })}
          />
        </div>
      </div>
    </div>
  );
}
