import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { ModalShell } from './ModalShell';

export type StackingStrategy = 'STATIC_PRIORITY' | 'OPERATION_ORDER';

interface StackingStrategyConfirmModalProps {
  open: boolean;
  target: StackingStrategy | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function StackingStrategyConfirmModal({
  open,
  target,
  onConfirm,
  onCancel,
}: StackingStrategyConfirmModalProps) {
  const isOperationOrder = target === 'OPERATION_ORDER';

  return (
    <ModalShell open={open} onClose={onCancel} size="md">
      <div className="px-5 py-4 border-b border-[#f0f0f0] shrink-0">
        <h2 className="text-[15px] font-semibold text-[#262626]">
          {isOperationOrder ? '切换为收银添加顺序' : '切换为严格类型优先级'}
        </h2>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
        {isOperationOrder ? (
          <>
            <div className="flex items-start gap-2 p-3 rounded border border-amber-200 bg-amber-50 text-[13px] text-amber-900 mb-3">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>
                收银员录入优惠的先后顺序将影响实付金额，不同操作习惯可能导致结果不一致。
              </span>
            </div>
            <p className="text-[13px] text-[#595959] leading-relaxed mb-3">
              此策略<strong>仅对 B 端收银台（POS）生效</strong>。C 端小程序/外卖仍使用上方配置的类型优先级，不受录入顺序影响。
            </p>
            <div className="text-[12px] text-[#8c8c8c] bg-[#fafafa] p-3 rounded border border-[#f0f0f0]">
              示例：同时使用「减 10 元」与「打 9 折」时，先扫哪张券将决定先减后折或先折后减。
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-2 p-3 rounded border border-[#e6f7ff] bg-[#e6f7ff] text-[13px] text-[#0958d9] mb-3">
              <Info size={16} className="shrink-0 mt-0.5" />
              <span>无论收银员先录入哪张券，系统均按「计算顺序」页配置的全局序号扣减，结果稳定可预期。</span>
            </div>
            <p className="text-[13px] text-[#595959] leading-relaxed">
              推荐作为默认策略。B 端 POS 与 C 端均遵循类型优先级（C 端本身无录入顺序概念）。
            </p>
          </>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[#f0f0f0] flex justify-end gap-2 shrink-0">
        <button type="button" className="btn btn--default" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="btn btn--primary" onClick={onConfirm}>
          确认切换
        </button>
      </div>
    </ModalShell>
  );
}
