import React from 'react';
import { Check, X } from 'lucide-react';

export const MatrixLegend: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <div className={`flex flex-wrap items-center gap-3 ${compact ? 'text-[10px]' : 'text-xs'} text-gray-600`}>
    <span className="font-medium text-gray-500">图例：</span>
    <span className="inline-flex items-center gap-1.5">
      <span className="w-4 h-4 bg-brand-500 rounded-[3px] flex items-center justify-center text-white">
        <Check size={10} strokeWidth={4} />
      </span>
      共享且叠加
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="w-4 h-4 bg-[#60a5fa] rounded-[3px] flex items-center justify-center text-white">
        <span className="w-1.5 h-1.5 border-[2px] border-white rotate-45 inline-block" />
      </span>
      共享不叠加
    </span>
    <span className="inline-flex items-center gap-1.5">
      <span className="w-4 h-4 bg-[#fb7185] rounded-[3px] flex items-center justify-center text-white">
        <X size={10} strokeWidth={4} />
      </span>
      完全互斥
    </span>
    <span className="inline-flex items-center gap-1.5 text-gray-400">
      <span className="w-4 h-4 flex items-center justify-center">—</span>
      无需配置
    </span>
  </div>
);
