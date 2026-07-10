import React, { useEffect, useState } from 'react';
import { IneffectiveItem, SaveImpactItem, interactionLabel } from '../utils/specialRuleResolver';
import { AlertTriangle, X } from 'lucide-react';
import { ModalShell } from './ModalShell';

interface SaveConflictModalProps {
  open: boolean;
  overrides: SaveImpactItem[];
  ineffective: IneffectiveItem[];
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const SaveConflictModal: React.FC<SaveConflictModalProps> = ({
  open,
  overrides,
  ineffective,
  confirmLabel = '确认保存',
  onCancel,
  onConfirm,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (open) setAcknowledged(false);
  }, [open]);

  const hasImpact = overrides.length > 0 || ineffective.length > 0;
  const mustAck = overrides.length > 0;

  return (
    <ModalShell open={open} onClose={onCancel} size="md" zIndex={110}>
        <div className="p-4 border-b border-[#e8e8e8] flex items-center justify-between shrink-0">
          <h3 className="text-[15px] font-semibold text-[#262626] flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            保存确认
          </h3>
          <button type="button" onClick={onCancel} className="text-[#8c8c8c] hover:text-[#262626]">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4 text-[13px] min-h-0">
          {!hasImpact && (
            <p className="text-[#595959]">本规则不会覆盖已有生效关系，可直接保存。</p>
          )}

          {overrides.length > 0 && (
            <div>
              <div className="font-medium text-amber-800 mb-2">将覆盖以下生效关系</div>
              <ul className="space-y-2">
                {overrides.map(item => (
                  <li
                    key={item.pairKey}
                    className="px-3 py-2 bg-amber-50 border border-amber-200 rounded text-[12px]"
                  >
                    <span className="font-medium">
                      {item.promoALabel} ↔ {item.promoBLabel}
                    </span>
                    <div className="text-amber-700 mt-0.5">
                      {item.currentRule
                        ? `原「${item.currentRule.name}」${interactionLabel(item.currentInteraction)}`
                        : '原默认规则'}
                      {' → '}
                      本规则 {interactionLabel(item.newInteraction)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {ineffective.length > 0 && (
            <div>
              <div className="font-medium text-[#595959] mb-2">以下关系对本规则不会生效</div>
              <ul className="space-y-2">
                {ineffective.map(item => (
                  <li
                    key={item.pairKey}
                    className="px-3 py-2 bg-[#fafafa] border border-[#e8e8e8] rounded text-[12px] text-[#8c8c8c]"
                  >
                    <span className="font-medium text-[#595959]">
                      {item.promoALabel} ↔ {item.promoBLabel}
                    </span>
                    <div className="mt-0.5">{item.reason}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {mustAck && (
            <label className="flex items-start gap-2 pt-2 border-t border-[#f0f0f0] cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={acknowledged}
                onChange={e => setAcknowledged(e.target.checked)}
              />
              <span className="text-[#262626]">我已知晓会覆盖上述生效关系</span>
            </label>
          )}
        </div>

        <div className="p-4 border-t border-[#e8e8e8] flex justify-end gap-2 shrink-0">
          <button type="button" className="btn btn--default" onClick={onCancel}>
            取消
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={mustAck && !acknowledged}
            onClick={() => {
              onConfirm();
              setAcknowledged(false);
            }}
          >
            {confirmLabel}
          </button>
        </div>
    </ModalShell>
  );
};
