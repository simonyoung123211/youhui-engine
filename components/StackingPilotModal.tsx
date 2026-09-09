import React, { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { PromotionCategory } from '../types';
import { StackingPilotConfig, StackingPilotPair } from '../types/stackingPilot';
import { areStackingPilotsEqual, hydrateStackingPilot } from '../data/defaultStackingPilot';

interface StackingPilotModalProps {
  open: boolean;
  config: StackingPilotConfig;
  categories: PromotionCategory[];
  onClose: () => void;
  onSave: (config: StackingPilotConfig) => void;
}

export function StackingPilotModal({
  open,
  config,
  categories,
  onClose,
  onSave,
}: StackingPilotModalProps) {
  const [draft, setDraft] = useState<StackingPilotConfig>(() => hydrateStackingPilot(config));

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
        </div>

        <div className="strategy-note strategy-note--muted">
          计算口径固定：先算{leadName}，再用{followName}在折后价上继续打折，与收银员的操作先后无关；
          {followName}设置了满额门槛时，也按折后价判断是否满足。
          例：商品原价 ¥10，{leadName} 8 折、{followName} 6 折，顾客实付 ¥4.80。
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
