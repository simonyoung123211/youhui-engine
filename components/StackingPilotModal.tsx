import React, { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { PromotionCategory } from '../types';
import {
  StackingBase,
  StackingPilotConfig,
  StackingPilotPair,
  calcStackingPreview,
} from '../types/stackingPilot';
import { areStackingPilotsEqual, hydrateStackingPilot } from '../data/defaultStackingPilot';

interface StackingPilotModalProps {
  open: boolean;
  config: StackingPilotConfig;
  categories: PromotionCategory[];
  onClose: () => void;
  onSave: (config: StackingPilotConfig) => void;
}

function formatMoney(value: number): string {
  return `¥${value.toFixed(2)}`;
}

export function StackingPilotModal({
  open,
  config,
  categories,
  onClose,
  onSave,
}: StackingPilotModalProps) {
  const [draft, setDraft] = useState<StackingPilotConfig>(() => hydrateStackingPilot(config));
  const [previewPrice, setPreviewPrice] = useState(10);
  const [previewLeadRate, setPreviewLeadRate] = useState(8);
  const [previewFollowRate, setPreviewFollowRate] = useState(6);

  useEffect(() => {
    if (!open) return;
    setDraft(hydrateStackingPilot(config));
  }, [open, config]);

  const pair = draft.pairs[0];
  const nameOf = (id: string) => categories.find(c => c.id === id)?.name ?? id;
  const leadName = nameOf(pair.leadCategoryId);
  const followName = nameOf(pair.followCategoryId);

  const isDirty = useMemo(
    () => !areStackingPilotsEqual(draft, hydrateStackingPilot(config)),
    [draft, config]
  );

  const patchPair = (patch: Partial<StackingPilotPair>) => {
    setDraft(prev => ({ pairs: prev.pairs.map(p => ({ ...p, ...patch })) }));
  };

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

  const off = !pair.enabled;

  return (
    <ModalShell open={open} onClose={onClose} size="lg">
      <div className="px-5 py-4 border-b border-[#f0f0f0] shrink-0 flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <Layers size={15} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#262626]">折上折叠加</h2>
          <p className="text-[12px] text-[#8c8c8c] mt-0.5">
            规则里的「共享且叠加」按商品原价分别计算优惠；开启后改为在折后价上继续计算。
          </p>
        </div>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        <div className="strategy-note strategy-note--amber">
          本期仅开放 <strong>{leadName} + {followName}</strong> 一组，其余优惠类型仍按默认规则与特例规则执行。
          优惠引擎只按优惠类型判定能否叠加，不判断使用者身份；小程序与企迈 POS 共用同一套叠加规则。
        </div>

        <div className="strategy-config-block">
          <div className="strategy-row">
            <div className="strategy-row__main">
              <div className="strategy-row__label">
                {leadName} + {followName}
              </div>
              <p className="strategy-row__hint">
                开启后，同一件商品可同时享受这两项优惠。关闭时维持原有的共享不叠加。
              </p>
            </div>
            <select
              className="strategy-select"
              value={pair.enabled ? 'on' : 'off'}
              onChange={e => patchPair({ enabled: e.target.value === 'on' })}
            >
              <option value="on">开启</option>
              <option value="off">关闭</option>
            </select>
          </div>

          <div className={`strategy-row${off ? ' is-disabled' : ''}`}>
            <div className="strategy-row__main">
              <div className="strategy-row__label">{followName}的计算基数</div>
              <p className="strategy-row__hint">
                计算顺序固定为「1. {leadName} → 2. {followName}」，与收银员的操作先后无关。
              </p>
            </div>
            <select
              className="strategy-select"
              value={pair.calcBase}
              disabled={off}
              onChange={e => patchPair({ calcBase: e.target.value as StackingBase })}
            >
              <option value="DISCOUNTED">折后价（折上折）</option>
              <option value="ORIGINAL">商品原价</option>
            </select>
          </div>

          <div className={`strategy-row${off ? ' is-disabled' : ''}`}>
            <div className="strategy-row__main">
              <div className="strategy-row__label">{followName}的门槛判定基数</div>
              <p className="strategy-row__hint">券设置了满额门槛时，用这个价格判断是否满足。</p>
            </div>
            <select
              className="strategy-select"
              value={pair.thresholdBase}
              disabled={off}
              onChange={e => patchPair({ thresholdBase: e.target.value as StackingBase })}
            >
              <option value="DISCOUNTED">折后价</option>
              <option value="ORIGINAL">商品原价</option>
            </select>
          </div>
        </div>

        <div className="stacking-preview">
          <div className="stacking-preview__head">
            <span className="stacking-preview__title">效果试算</span>
            <span className="stacking-preview__tip">仅用于预览优惠力度，不影响线上</span>
          </div>
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
                disabled={off}
                value={previewFollowRate}
                onChange={e => setPreviewFollowRate(Number(e.target.value))}
              />
            </label>
          </div>

          <div className="stacking-preview__steps">
            {preview.rows.map((row, index) => (
              <div key={row.label} className="stacking-preview__step-row">
                <span className="stacking-preview__step">{index + 1}</span>
                <span className="stacking-preview__step-name">{row.label}</span>
                <span className="stacking-preview__step-calc">
                  {formatMoney(row.base)} → {formatMoney(row.result)}
                </span>
                <span className="stacking-preview__saving">-{formatMoney(row.saving)}</span>
              </div>
            ))}
          </div>

          <div className="stacking-preview__summary">
            <span>
              共优惠{' '}
              <strong className="stacking-preview__saving">{formatMoney(preview.totalSaving)}</strong>
            </span>
            <span>
              顾客实付{' '}
              <strong className="stacking-preview__final">{formatMoney(preview.finalPrice)}</strong>
            </span>
            {off && <span className="stacking-preview__tip">未开启叠加，{followName}不参与计算</span>}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[#f0f0f0] flex justify-end gap-2 shrink-0">
        <button type="button" className="btn btn--default" onClick={onClose}>
          取消
        </button>
        <button
          type="button"
          className="btn btn--primary"
          disabled={!isDirty}
          onClick={() => onSave(structuredClone(draft))}
        >
          保存
        </button>
      </div>
    </ModalShell>
  );
}
