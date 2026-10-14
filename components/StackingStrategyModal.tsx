import React from 'react';
import { Info, ListOrdered, MonitorCheck, MousePointerClick, Smartphone } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { StackingStrategy } from './StackingStrategyConfirmModal';

interface StackingStrategyModalProps {
  open: boolean;
  current: StackingStrategy;
  locked: boolean;
  onClose: () => void;
  onPick: (strategy: StackingStrategy) => void;
}

export function StackingStrategyModal({
  open,
  current,
  locked,
  onClose,
  onPick,
}: StackingStrategyModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} size="lg">
      <div className="px-5 py-4 border-b border-[#f0f0f0] shrink-0 flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <MonitorCheck size={15} />
        </div>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#262626]">POS计算顺序</h2>
          <p className="text-[12px] text-[#8c8c8c] mt-0.5">
            仅影响企迈 POS：多种优惠可一起用时，按本页计算顺序算，还是按收银员录入先后算。
          </p>
        </div>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
        {locked && (
          <div className="calc-order-strategy__lock mb-3">
            <Info size={13} />
            请先保存或取消顺序调整，再切换 POS 计算顺序
          </div>
        )}
        <div className={`flex flex-col md:flex-row gap-3 ${locked ? 'calc-order-strategy__body--locked' : ''}`}>
          <button
            type="button"
            className={`calc-order-strategy-card flex-1 text-left ${
              current === 'STATIC_PRIORITY' ? 'calc-order-strategy-card--active' : ''
            }`}
            disabled={locked}
            onClick={() => onPick('STATIC_PRIORITY')}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded bg-brand-50 text-brand-600 flex items-center justify-center">
                <ListOrdered size={16} />
              </div>
              {current === 'STATIC_PRIORITY' && (
                <span className="calc-order-strategy-card__badge">当前生效</span>
              )}
            </div>
            <h4 className="text-[13px] font-medium text-[#262626]">按计算顺序（推荐）</h4>
            <p className="text-[12px] text-[#8c8c8c] mt-1.5 leading-relaxed">
              无论收银员先录入哪张券，都按「计算顺序」页的科目先后计算，结果稳定可预期。
            </p>
          </button>

          <button
            type="button"
            className={`calc-order-strategy-card flex-1 text-left ${
              current === 'OPERATION_ORDER' ? 'calc-order-strategy-card--active' : ''
            }`}
            disabled={locked}
            onClick={() => onPick('OPERATION_ORDER')}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded bg-[#f4f6f8] text-[#595959] flex items-center justify-center">
                <MousePointerClick size={16} />
              </div>
              {current === 'OPERATION_ORDER' && (
                <span className="calc-order-strategy-card__badge">当前生效</span>
              )}
            </div>
            <h4 className="text-[13px] font-medium text-[#262626]">按录入先后</h4>
            <p className="text-[12px] text-[#8c8c8c] mt-1.5 leading-relaxed">
              按收银员扫码/点击的先后顺序扣减。不同操作习惯可能导致实付不一致。
            </p>
            <div className="mt-2.5 text-[11px] text-[#8c8c8c] space-y-1">
              <div className="flex items-center gap-1">
                <MonitorCheck size={12} className="text-brand-600" /> 企迈 POS · 生效
              </div>
              <div className="flex items-center gap-1 text-[#bfbfbf]">
                <Smartphone size={12} /> 小程序 · 始终按计算顺序
              </div>
            </div>
          </button>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[#f0f0f0] flex justify-end shrink-0">
        <button type="button" className="btn btn--default" onClick={onClose}>
          关闭
        </button>
      </div>
    </ModalShell>
  );
}
