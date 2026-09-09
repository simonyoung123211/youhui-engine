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
            顾客可以在{leadName}的基础上，再使用一张{followName}。
          </p>
        </div>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        <div className="strategy-config-block">
          <div className="strategy-row">
            <div className="strategy-row__main">
              <div className="strategy-row__label">
                {leadName} + {followName}
              </div>
              <p className="strategy-row__hint">
                开启：先按{leadName}计算，再用{followName}在折后价上继续打折。
                <br />
                关闭：两项优惠只生效一个，系统自动保留更划算的。
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
          {followName}的满额门槛，按{leadName}后的价格判断。
          <br />
          例：商品原价 ¥10，{leadName} 8 折后为 ¥8，再用 6 折券，顾客实付 ¥4.80。
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
