import React from 'react';
import { PromoRef } from '../types';
import { PairResolution } from '../utils/specialRuleResolver';
import { X } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { PairCoverageContent } from './PairCoverageContent';

interface PairInspectorPanelProps {
  open: boolean;
  promoA: PromoRef;
  promoB: PromoRef;
  labelA: string;
  labelB: string;
  coverage: PairResolution;
  onClose: () => void;
}

export const PairInspectorPanel: React.FC<PairInspectorPanelProps> = ({
  open,
  labelA,
  labelB,
  coverage,
  onClose,
}) => {
  return (
    <ModalShell open={open} onClose={onClose} size="md" zIndex={55}>
      <div className="p-4 border-b border-[#e8e8e8] flex items-center justify-between shrink-0">
        <h3 className="text-[15px] font-semibold">命中链 · {labelA} ↔ {labelB}</h3>
        <button type="button" onClick={onClose} className="text-[#8c8c8c]">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-auto">
        <PairCoverageContent labelA={labelA} labelB={labelB} coverage={coverage} />
      </div>

      <div className="p-3 border-t border-[#e8e8e8] flex justify-end shrink-0">
        <button type="button" className="btn btn--default" onClick={onClose}>
          关闭
        </button>
      </div>
    </ModalShell>
  );
};
