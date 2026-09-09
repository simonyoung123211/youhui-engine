import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/admin.css';
import { Layers, Pencil, Save, X } from 'lucide-react';
import { PromotionCategory } from '../types';
import {
  StackingBase,
  StackingPilotConfig,
  StackingPilotPair,
  STACKING_BASE_LABEL,
  calcStackingPreview,
} from '../types/stackingPilot';
import {
  areStackingPilotsEqual,
  hydrateStackingPilot,
} from '../data/defaultStackingPilot';
import { ConfigSection, StrategyRadioGroup, StrategySubGroup } from './applicationStrategy/ConfigSection';

interface StackingPilotPageProps {
  config: StackingPilotConfig;
  onConfigChange: (config: StackingPilotConfig) => void;
  categories: PromotionCategory[];
  onSave?: () => void;
  onToast?: (message: string) => void;
  onViewDefaultRules?: () => void;
  onViewCalcOrder?: () => void;
}

const BASE_OPTIONS: { value: StackingBase; label: string; description: string }[] = [
  {
    value: 'DISCOUNTED',
    label: '折后价（折上折）',
    description: '在前一项优惠算完后的价格上继续打折，本期推荐',
  },
  {
    value: 'ORIGINAL',
    label: '商品原价',
    description: '两项优惠各自按原价计算后相加扣减，优惠力度更大',
  },
];

const THRESHOLD_OPTIONS: { value: StackingBase; label: string; description: string }[] = [
  {
    value: 'DISCOUNTED',
    label: '折后价',
    description: '用限时折扣算完后的价格判断券是否达到使用门槛',
  },
  {
    value: 'ORIGINAL',
    label: '商品原价',
    description: '用商品原价判断券是否达到使用门槛',
  },
];

function formatMoney(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function StackingPilotPage({
  config,
  onConfigChange,
  categories,
  onSave,
  onToast,
  onViewDefaultRules,
  onViewCalcOrder,
}: StackingPilotPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<StackingPilotConfig>(() => hydrateStackingPilot(config));
  const [savedSnapshot, setSavedSnapshot] = useState<StackingPilotConfig>(() =>
    hydrateStackingPilot(config)
  );
  const [previewPrice, setPreviewPrice] = useState(10);
  const [previewLeadRate, setPreviewLeadRate] = useState(8);
  const [previewFollowRate, setPreviewFollowRate] = useState(6);

  useEffect(() => {
    if (isEditing) return;
    const hydrated = hydrateStackingPilot(config);
    setDraft(hydrated);
    setSavedSnapshot(hydrated);
  }, [config, isEditing]);

  const pair = draft.pairs[0];
  const nameOf = useCallback(
    (id: string) => categories.find(c => c.id === id)?.name ?? id,
    [categories]
  );
  const leadName = nameOf(pair.leadCategoryId);
  const followName = nameOf(pair.followCategoryId);

  const isDirty = useMemo(
    () => !areStackingPilotsEqual(draft, savedSnapshot),
    [draft, savedSnapshot]
  );

  const patchPair = useCallback((patch: Partial<StackingPilotPair>) => {
    setDraft(prev => ({
      pairs: prev.pairs.map(p => (p.id === prev.pairs[0].id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const preview = useMemo(
    () =>
      calcStackingPreview(
        {
          originalPrice: previewPrice,
          leadDiscountRate: previewLeadRate,
          followDiscountRate: previewFollowRate,
        },
        pair,
        leadName,
        followName
      ),
    [previewPrice, previewLeadRate, previewFollowRate, pair, leadName, followName]
  );

  const handleStartEdit = () => {
    setDraft(structuredClone(savedSnapshot));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(structuredClone(savedSnapshot));
    setIsEditing(false);
    onToast?.('已取消修改');
  };

  const handleSave = () => {
    if (!isDirty) {
      setIsEditing(false);
      return;
    }
    onConfigChange(structuredClone(draft));
    setSavedSnapshot(structuredClone(draft));
    setIsEditing(false);
    onSave?.();
  };

  const readOnly = !isEditing;

  return (
    <div className={`page-card page-card--list h-full flex flex-col overflow-hidden${isEditing ? ' strategy-page--editing' : ''}`}>
      <header className="list-page-header list-page-header--compact shrink-0">
        <div className="list-page-header__main">
          <div className="list-page-header__title-row">
            <Layers size={20} className="text-brand-600 shrink-0" aria-hidden />
            <h1 className="list-page-header__title">折上折叠加（试点）</h1>
            {isEditing && <span className="strategy-editing-badge">编辑中</span>}
          </div>
          <p className="list-page-header__desc">
            默认规则里的「共享且叠加」按商品原价分别计算各项优惠。开启本试点后，指定的一组优惠改为折上折计算。
            {isEditing ? ' 修改完成后请保存，或取消放弃本次编辑。' : ' 点击右上角「编辑配置」开始调整。'}
          </p>
        </div>
        <div className="list-page-header__actions">
          {readOnly ? (
            <button type="button" className="btn btn--primary btn--icon" onClick={handleStartEdit}>
              <Pencil size={14} aria-hidden />
              编辑配置
            </button>
          ) : (
            <>
              <button type="button" className="btn btn--default btn--icon" onClick={handleCancel}>
                <X size={14} aria-hidden />
                取消修改
              </button>
              <button
                type="button"
                className="btn btn--primary btn--icon"
                disabled={!isDirty}
                onClick={handleSave}
              >
                <Save size={14} aria-hidden />
                保存
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4">
        <div className="strategy-note strategy-note--amber">
          本期仅开放 <strong>{leadName} + {followName}</strong> 一组，其余优惠类型仍按
          <button type="button" className="stacking-link" onClick={onViewDefaultRules}>
            默认规则
          </button>
          执行。后续验证稳定后再扩展到更多类型。
        </div>

        <div className="strategy-note strategy-note--muted">
          优惠引擎只按优惠类型判定能否叠加，不判断使用者身份。谁能拿到、能不能用这张券，由发券与用券资格的上游规则决定。
          小程序与企迈 POS 使用同一套叠加规则。
        </div>

        <ConfigSection
          title={`${leadName} + ${followName}`}
          description={`开启后，一笔订单里同一件商品可以同时享受${leadName}和${followName}。关闭时维持默认规则的共享不叠加。`}
          enabled={pair.enabled}
          readOnly={readOnly}
          onEnabledChange={enabled => patchPair({ enabled })}
        >
          <div className="stacking-order">
            <span className="stacking-order__label">计算顺序</span>
            <span className="stacking-order__step">1. {leadName}</span>
            <span className="stacking-order__arrow">→</span>
            <span className="stacking-order__step">2. {followName}</span>
            <button type="button" className="stacking-link" onClick={onViewCalcOrder}>
              查看计算顺序
            </button>
          </div>
          <p className="strategy-row__hint">
            {leadName}先于{followName}计算，与收银员的操作先后无关。
          </p>

          <StrategySubGroup title={`${followName}的计算基数`}>
            <StrategyRadioGroup
              label="按什么价格打折"
              hint={`选择${followName}在哪个价格上计算折扣金额。`}
              value={pair.calcBase}
              disabled={readOnly || !pair.enabled}
              onChange={value => patchPair({ calcBase: value as StackingBase })}
              options={BASE_OPTIONS}
            />
          </StrategySubGroup>

          <StrategySubGroup title={`${followName}的门槛判定基数`}>
            <StrategyRadioGroup
              label="按什么价格判断门槛"
              hint="券设置了满额门槛时，用这个价格判断是否满足。"
              value={pair.thresholdBase}
              disabled={readOnly || !pair.enabled}
              onChange={value => patchPair({ thresholdBase: value as StackingBase })}
              options={THRESHOLD_OPTIONS}
            />
          </StrategySubGroup>
        </ConfigSection>

        <section className="strategy-config-section">
          <div className="strategy-config-section__header">
            <div className="strategy-config-section__title-wrap">
              <h3 className="strategy-config-section__title">效果试算</h3>
              <p className="strategy-config-section__desc">
                改动配置后即时预览顾客实付，用于确认优惠力度是否符合预期。试算结果不影响线上。
              </p>
            </div>
          </div>
          <div className="strategy-config-section__body">
            <div className="stacking-preview__inputs">
              <label className="stacking-field">
                <span className="stacking-field__label">商品原价（元）</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={previewPrice}
                  onChange={e => setPreviewPrice(Number(e.target.value))}
                />
              </label>
              <label className="stacking-field">
                <span className="stacking-field__label">{leadName}（折）</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  value={previewLeadRate}
                  onChange={e => setPreviewLeadRate(Number(e.target.value))}
                />
              </label>
              <label className="stacking-field">
                <span className="stacking-field__label">{followName}（折）</span>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.1}
                  disabled={!pair.enabled}
                  value={previewFollowRate}
                  onChange={e => setPreviewFollowRate(Number(e.target.value))}
                />
              </label>
            </div>

            <table className="stacking-preview__table">
              <thead>
                <tr>
                  <th>计算步骤</th>
                  <th>计算基数</th>
                  <th>本步优惠</th>
                  <th>本步后价格</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, index) => (
                  <tr key={row.label}>
                    <td>
                      <span className="stacking-preview__step">{index + 1}</span>
                      {row.label}
                    </td>
                    <td>{formatMoney(row.base)}</td>
                    <td className="stacking-preview__saving">-{formatMoney(row.saving)}</td>
                    <td>{formatMoney(row.result)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="stacking-preview__summary">
              <span>
                共优惠 <strong className="stacking-preview__saving">{formatMoney(preview.totalSaving)}</strong>
              </span>
              <span>
                顾客实付 <strong className="stacking-preview__final">{formatMoney(preview.finalPrice)}</strong>
              </span>
            </div>

            {!pair.enabled && (
              <p className="strategy-row__hint">
                当前未开启叠加，{followName}不参与计算，顾客只享受{leadName}。
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export { STACKING_BASE_LABEL };
