import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { PromoScope } from '../types';
import { CalcOrderPositionChange } from '../utils/calcOrderReorder';
import { ModalShell } from './ModalShell';

interface CalcOrderSaveConfirmModalProps {
  open: boolean;
  changes: CalcOrderPositionChange[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function CalcOrderSaveConfirmModal({
  open,
  changes,
  onConfirm,
  onCancel,
}: CalcOrderSaveConfirmModalProps) {
  const itemChanges = changes.filter(c => c.scope === PromoScope.SINGLE_ITEM);
  const orderChanges = changes.filter(c => c.scope === PromoScope.ORDER);

  return (
    <ModalShell open={open} onClose={onCancel} size="md">
      <div className="px-5 py-4 border-b border-[#f0f0f0] shrink-0">
        <h2 className="text-[15px] font-semibold text-[#262626]">确认保存计算顺序</h2>
        <p className="text-[13px] text-[#8c8c8c] mt-1">
          保存后将影响<strong className="text-[#262626]">下单优惠计算链路</strong>，请确认变更内容。
        </p>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        <div className="flex items-start gap-2 p-3 rounded border border-amber-200 bg-amber-50 text-[13px] text-amber-900 mb-4">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <span>
            本次共调整 <strong>{changes.length}</strong> 个优惠类型的全局顺序。叠加场景下实付金额可能发生变化。
          </span>
        </div>

        {changes.length === 0 ? (
          <p className="text-[13px] text-[#8c8c8c]">顺序与当前已保存版本一致。</p>
        ) : (
          <div className="space-y-4">
            {itemChanges.length > 0 && (
              <section>
                <h3 className="text-[12px] font-medium text-[#595959] mb-2">
                  单品级 · {itemChanges.length} 项
                </h3>
                <ul className="calc-order-diff-list">
                  {itemChanges.map(c => (
                    <li key={c.id}>
                      <span className="calc-order-diff-list__name">{c.name}</span>
                      <span className="calc-order-diff-list__arrow">
                        #{c.fromIndex} → #{c.toIndex}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {orderChanges.length > 0 && (
              <section>
                <h3 className="text-[12px] font-medium text-[#595959] mb-2">
                  整单级 · {orderChanges.length} 项
                </h3>
                <ul className="calc-order-diff-list">
                  {orderChanges.map(c => (
                    <li key={c.id}>
                      <span className="calc-order-diff-list__name">{c.name}</span>
                      <span className="calc-order-diff-list__arrow">
                        #{c.fromIndex} → #{c.toIndex}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[#f0f0f0] flex justify-end gap-2 shrink-0">
        <button type="button" className="btn btn--default" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="btn btn--primary" onClick={onConfirm}>
          确认保存
        </button>
      </div>
    </ModalShell>
  );
}
