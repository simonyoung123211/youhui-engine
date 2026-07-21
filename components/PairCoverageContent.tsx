import React from 'react';
import { PairResolution, interactionLabel, specificityLabel } from '../utils/specialRuleResolver';
import { Trophy } from 'lucide-react';

interface PairCoverageContentProps {
  labelA: string;
  labelB: string;
  coverage: PairResolution;
}

export function PairCoverageContent({ labelA, labelB, coverage }: PairCoverageContentProps) {
  return (
    <>
      <div className="mb-4 p-3 bg-brand-50 border border-brand-200 rounded">
        <div className="text-[12px] text-[#8c8c8c]">
          {labelA} ↔ {labelB}
        </div>
        <div className="text-[12px] text-[#8c8c8c] mt-1">最终生效</div>
        <div className="text-[15px] font-semibold text-brand-700 mt-0.5">
          {coverage.interaction ? interactionLabel(coverage.interaction) : '—'}
        </div>
        {coverage.winningRule && (
          <div className="text-[12px] text-[#595959] mt-1">由「{coverage.winningRule.name}」决定</div>
        )}
        {coverage.source === 'DEFAULT' && (
          <div className="text-[12px] text-[#595959] mt-1">未命中特例规则，使用默认规则</div>
        )}
      </div>

      {coverage.candidates.length > 0 ? (
        <div className="space-y-2">
          <div className="text-[12px] font-medium text-[#8c8c8c]">命中规则（按优先级排序）</div>
          {coverage.candidates.map((c, idx) => (
            <div
              key={c.rule.id}
              className={`p-3 rounded border text-[12px] ${
                idx === 0
                  ? 'border-brand-300 bg-brand-50/50'
                  : 'border-[#e8e8e8] bg-white opacity-80'
              }`}
            >
              <div className="flex items-center gap-2">
                {idx === 0 && <Trophy size={12} className="text-brand-600" />}
                <span className="font-medium text-[#262626]">{c.rule.name}</span>
                {c.rule.priority != null && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded">
                    优先级 {c.rule.priority}
                  </span>
                )}
              </div>
              <div className="mt-1 text-[#595959]">
                {interactionLabel(c.rule.interaction)} · {specificityLabel(c.specificity)}
              </div>
              <div className="mt-0.5 text-[#8c8c8c]">{c.matchPath}</div>
              <div className="mt-0.5 text-[#8c8c8c]">{c.reasons.join(' · ')}</div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[12px] text-[#8c8c8c]">无已启用的特例规则命中此对</p>
      )}
    </>
  );
}
