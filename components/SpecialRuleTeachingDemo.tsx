import React from 'react';
import { FlaskConical } from 'lucide-react';
import { InteractionType, SpecialRule } from '../types';
import { DEMO_TYPE_A, DEMO_TYPE_B, DEMO_TYPE_C } from '../data/mockSpecialRules';
import { interactionLabel, resolveOrderPairs, resolvePair } from '../utils/specialRuleResolver';

interface SpecialRuleTeachingDemoProps {
  rules: SpecialRule[];
  priorityEnabled: boolean;
  compact?: boolean;
  className?: string;
}

function SimulatorRow({
  title,
  desc,
  result,
}: {
  title: string;
  desc?: string;
  result: {
    interaction: InteractionType | null;
    winningRule?: SpecialRule;
    candidates: { rule: SpecialRule; reasons: string[] }[];
  };
}) {
  return (
    <div className="bg-white border border-[#e8e8e8] rounded p-3">
      <div className="font-medium text-[#262626] text-[13px]">{title}</div>
      {desc && <div className="text-[12px] text-[#8c8c8c] mt-0.5">{desc}</div>}
      <div className="mt-2 flex items-center gap-2 flex-wrap">
        <span className="text-brand-600 font-semibold text-[13px]">
          → {result.interaction ? interactionLabel(result.interaction) : '无'}
        </span>
        {result.winningRule && (
          <span className="text-[11px] text-[#8c8c8c]">（{result.winningRule.name}）</span>
        )}
      </div>
      {result.candidates.length > 1 && (
        <div className="mt-2 text-[11px] text-[#8c8c8c]">
          候选：{result.candidates.map(c => c.rule.name).join(' > ')}
        </div>
      )}
      {result.winningRule && result.candidates[0]?.reasons[0] && (
        <div className="mt-1 text-[11px] text-[#595959]">{result.candidates[0].reasons[0]}</div>
      )}
    </div>
  );
}

export const SpecialRuleTeachingDemo: React.FC<SpecialRuleTeachingDemoProps> = ({
  rules,
  priorityEnabled,
  compact = false,
  className = '',
}) => {
  const demoAb = resolvePair(
    rules,
    { id: DEMO_TYPE_A, refType: 'TYPE', typeId: DEMO_TYPE_A },
    { id: DEMO_TYPE_B, refType: 'TYPE', typeId: DEMO_TYPE_B },
    InteractionType.MUTEX,
    priorityEnabled
  );
  const demoAc = resolvePair(
    rules,
    { id: DEMO_TYPE_A, refType: 'TYPE', typeId: DEMO_TYPE_A },
    { id: DEMO_TYPE_C, refType: 'TYPE', typeId: DEMO_TYPE_C },
    InteractionType.MUTEX,
    priorityEnabled
  );
  const demoOrderAb = resolveOrderPairs(
    rules,
    [
      { id: DEMO_TYPE_A, refType: 'TYPE', typeId: DEMO_TYPE_A },
      { id: DEMO_TYPE_B, refType: 'TYPE', typeId: DEMO_TYPE_B },
    ],
    InteractionType.MUTEX,
    priorityEnabled
  );

  return (
    <section
      className={`border border-[#e8e8e8] rounded bg-[#fafafa] ${compact ? 'p-3' : 'p-4'} ${className}`}
    >
      <h3
        className={`font-semibold flex items-center gap-2 text-[#262626] ${
          compact ? 'text-[13px] mb-1' : 'text-[15px] mb-1'
        }`}
      >
        <FlaskConical size={compact ? 14 : 16} className="text-brand-600 shrink-0" />
        生效试算 · A/B/C 示例
      </h3>
      <p className={`text-[#8c8c8c] mb-3 leading-relaxed ${compact ? 'text-[11px]' : 'text-[12px]'}`}>
        规则1（早）：组内同享 ABC · 规则2（晚）：组间 A+B 对 C 互斥。以下结果由当前规则库实时计算。
      </p>
      <div className={`space-y-3 ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
        <SimulatorRow
          title="订单只有 A + B"
          desc="只涉及「批内关系」，组间规则2 不参与"
          result={demoOrderAb[0]}
        />
        <SimulatorRow title="A 与 B 这一对" result={demoAb} />
        <SimulatorRow title="A 与 C 这一对" result={demoAc} />
      </div>
    </section>
  );
};
