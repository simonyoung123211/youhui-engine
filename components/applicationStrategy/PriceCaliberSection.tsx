import React from 'react';
import { Info } from 'lucide-react';

export function PriceCaliberSection() {
  return (
    <div className="strategy-price-caliber" role="note">
      <Info size={14} className="strategy-price-caliber__icon" aria-hidden />
      <div className="strategy-price-caliber__text">
        <span className="strategy-price-caliber__chain">
          销售价 / 划线价 <span aria-hidden>›</span> 促销价 <span aria-hidden>›</span> 预估到手价
        </span>
        <span className="strategy-price-caliber__hint">
          预估到手价为单件 SKU 最低可达曝光价（含券试算，不代表已选券）；购物车与提交订单页为订单应付金额，遵循订单选券策略。
        </span>
      </div>
    </div>
  );
}
