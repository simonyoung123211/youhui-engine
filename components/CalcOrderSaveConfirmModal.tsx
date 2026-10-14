import React, { useEffect, useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { CalcOrderPositionChange, summarizeCalcOrderChanges } from '../utils/calcOrderReorder';
import { ModalShell } from './ModalShell';

interface CalcOrderSaveConfirmModalProps {
  open: boolean;
  changes: CalcOrderPositionChange[];
  onConfirm: () => void;
  onCancel: () => void;
}

function ChangeList({ items }: { items: CalcOrderPositionChange[] }) {
  return (
    <ul className="calc-order-diff-list">
      {items.map(c => (
        <li key={c.id}>
          <span className="calc-order-diff-list__name">{c.name}</span>
          <span className="calc-order-diff-list__arrow">
            #{c.fromIndex} → #{c.toIndex}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CalcOrderSaveConfirmModal({
  open,
  changes,
  onConfirm,
  onCancel,
}: CalcOrderSaveConfirmModalProps) {
  const [cascadeOpen, setCascadeOpen] = useState(false);
  const { primary, cascading } = summarizeCalcOrderChanges(changes);

  useEffect(() => {
    if (open) setCascadeOpen(false);
  }, [open]);

  return (
    <ModalShell open={open} onClose={onCancel} size="md">
      <div className="px-5 py-4 border-b border-[#f0f0f0] shrink-0">
        <h2 className="text-[15px] font-semibold text-[#262626]">确认保存计算顺序</h2>
        <p className="text-[13px] text-[#8c8c8c] mt-1">
          保存后将影响可叠加优惠的实付计算，请确认本次调整。
        </p>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        {changes.length === 0 ? (
          <p className="text-[13px] text-[#8c8c8c]">顺序与当前已保存版本一致。</p>
        ) : (
          <>
            <div className="flex items-start gap-2 p-3 rounded border border-amber-200 bg-amber-50 text-[13px] text-amber-900 mb-4">
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <span>
                本次主要调整了 <strong>{primary.length}</strong> 个优惠科目
                {cascading.length > 0 && (
                  <>
                    ，另有 <strong>{cascading.length}</strong> 个科目因重排顺带变动
                  </>
                )}
                。仅当科目可一起用时，顺序才会影响顾客实付。
              </span>
            </div>

            <div className="space-y-4">
              <section>
                <h3 className="text-[12px] font-medium text-[#595959] mb-2">
                  {primary.length === 1 ? '本次主要移动' : `主要调整 · ${primary.length} 项`}
                </h3>
                {primary.length === 1 ? (
                  <p className="text-[13px] text-[#262626] leading-relaxed">
                    将「{primary[0].name}」从第 {primary[0].fromIndex} 位调至第 {primary[0].toIndex} 位
                  </p>
                ) : (
                  <ChangeList items={primary} />
                )}
              </section>

              {cascading.length > 0 && (
                <section>
                  <button
                    type="button"
                    className={`calc-order-cascade-toggle ${cascadeOpen ? 'is-expanded' : ''}`}
                    onClick={() => setCascadeOpen(v => !v)}
                    aria-expanded={cascadeOpen}
                  >
                    <span>因重排顺带变动 · {cascading.length} 项</span>
                    <ChevronDown size={14} className="calc-order-cascade-toggle__chevron" />
                  </button>
                  {cascadeOpen && (
                    <div className="mt-2">
                      <ChangeList items={cascading} />
                    </div>
                  )}
                </section>
              )}
            </div>
          </>
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
