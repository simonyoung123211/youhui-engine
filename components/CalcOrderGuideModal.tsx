import React from 'react';
import { ModalShell } from './ModalShell';

interface CalcOrderGuideModalProps {
  open: boolean;
  onClose: () => void;
}

export function CalcOrderGuideModal({ open, onClose }: CalcOrderGuideModalProps) {
  return (
    <ModalShell open={open} onClose={onClose} size="md">
      <div className="px-5 py-4 border-b border-[#f0f0f0] shrink-0">
        <h2 className="text-[15px] font-semibold text-[#262626]">计算顺序说明</h2>
        <p className="text-[13px] text-[#8c8c8c] mt-1">
          优先用系统默认顺序；没有把握时不要大幅调整。
        </p>
      </div>

      <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
        <div className="calc-order-guide">
          <section className="calc-order-guide__section">
            <h3 className="calc-order-guide__title">有什么用</h3>
            <p className="calc-order-guide__text">
              本页调整的是优惠类型的计算先后。多种优惠可以一起用时，按本页顺序依次计算：前面的先算，后面的在前面算完后再算。单品优惠始终先于整单优惠。
            </p>
          </section>

          <section className="calc-order-guide__section">
            <h3 className="calc-order-guide__title">调整后会影响什么</h3>
            <ul className="calc-order-guide__list">
              <li>
                <strong>顾客实付可能变化</strong>
                ：可叠加时，谁先算、谁后算，最终金额可能不同。
              </li>
              <li>
                <strong>小程序点单</strong>
                ：始终按本页顺序计算。
              </li>
              <li>
                <strong>企迈 POS</strong>
                ：POS计算顺序选「按计算顺序」时跟本页；选「按录入先后」时跟收银员操作先后。
              </li>
            </ul>
          </section>

          <section className="calc-order-guide__section">
            <h3 className="calc-order-guide__title">建议怎么用</h3>
            <p className="calc-order-guide__text">
              优先用系统默认顺序；没有把握时不要大幅调整。
            </p>
          </section>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-[#f0f0f0] flex justify-end shrink-0">
        <button type="button" className="btn btn--primary" onClick={onClose}>
          知道了
        </button>
      </div>
    </ModalShell>
  );
}
