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
          <h2 className="text-[15px] font-semibold text-[#262626] flex items-center gap-2">
            B 端收银顺序
            <span className="text-[11px] bg-[#262626] text-white px-1.5 py-0.5 rounded">POS</span>
          </h2>
          <p className="text-[12px] text-[#8c8c8c] mt-0.5">
            当多种优惠允许叠加时，收银员操作顺序是否影响计算结果。
          </p>
        </div>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
        {locked && (
          <div className="calc-order-strategy__lock mb-3">
            <Info size={13} />
            请先保存或取消顺序调整，再切换收银策略
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
              <div className="w-8 h-8 rounded bg-blue-50 text-brand-600 flex items-center justify-center">
                <ListOrdered size={16} />
              </div>
              {current === 'STATIC_PRIORITY' && (
                <span className="calc-order-strategy-card__badge">当前生效</span>
              )}
            </div>
            <h4 className="text-[13px] font-medium text-[#262626]">严格遵循类型优先级（默认）</h4>
            <p className="text-[12px] text-[#8c8c8c] mt-1.5 leading-relaxed">
              无论收银员先录入哪张券，系统都按「计算顺序」页的全局序号计算。
            </p>
          </button>

          <button
            type="button"
            className={`calc-order-strategy-card flex-1 text-left ${
              current === 'OPERATION_ORDER' ? 'calc-order-strategy-card--active-purple' : ''
            }`}
            disabled={locked}
            onClick={() => onPick('OPERATION_ORDER')}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                <MousePointerClick size={16} />
              </div>
              {current === 'OPERATION_ORDER' && (
                <span className="calc-order-strategy-card__badge calc-order-strategy-card__badge--purple">
                  当前生效
                </span>
              )}
            </div>
            <h4 className="text-[13px] font-medium text-[#262626]">遵循收银添加顺序</h4>
            <p className="text-[12px] text-[#8c8c8c] mt-1.5 leading-relaxed">
              按收银员扫码/点击的先后顺序扣减。
              <span className="text-purple-600"> 录入顺序可能影响实付。</span>
            </p>
            <div className="mt-2.5 text-[11px] text-[#8c8c8c] space-y-1">
              <div className="flex items-center gap-1">
                <MonitorCheck size={12} className="text-orange-500" /> B 端收银台 · 生效
              </div>
              <div className="flex items-center gap-1 text-[#bfbfbf]">
                <Smartphone size={12} /> C 端小程序 · 强制类型优先级
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
