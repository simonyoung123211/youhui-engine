import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FlaskConical,
  GitMerge,
  Search,
} from 'lucide-react';
import {
  InteractionType,
  InstanceRuleMap,
  PromotionCategory,
  PromoInstance,
  RuleMatrix,
  RuleMember,
  SpecialRule,
} from '../types';
import { INSTANCE_TYPE_MAP } from '../data/mockSpecialRules';
import {
  getPairCoverage,
  interactionLabel,
  resolveOrderPairs,
  ruleMemberToPromoRef,
} from '../utils/specialRuleResolver';
import { InstanceManager } from './InstanceManager';
import { PairCoverageContent } from './PairCoverageContent';
import { PairInspectorPanel } from './PairInspectorPanel';
import { PromoMultiPicker, PromoSinglePicker } from './PromoObjectPicker';
import { SpecialRuleTeachingDemo } from './SpecialRuleTeachingDemo';
import { PromoRef } from '../types';

interface SpecialRuleRelationInspectorProps {
  rules: SpecialRule[];
  priorityEnabled: boolean;
  categories: PromotionCategory[];
  instances: PromoInstance[];
  setInstances: React.Dispatch<React.SetStateAction<PromoInstance[]>>;
  instanceRules: InstanceRuleMap;
  onRuleChange: (s: string, t: string, v: InteractionType | 'INHERIT') => void;
  onBatchRuleChange: (
    s: string,
    updates: { targetId: string; val: InteractionType | 'INHERIT' }[]
  ) => void;
  onInstanceDelete: (id: string) => void;
  typeMatrix: RuleMatrix;
  dbInstances: PromoInstance[];
  onSave?: () => void;
  onBack: () => void;
}

function memberLabel(m: RuleMember): string {
  return m.refName;
}

export function SpecialRuleRelationInspector({
  rules,
  priorityEnabled,
  categories,
  instances,
  setInstances,
  instanceRules,
  onRuleChange,
  onBatchRuleChange,
  onInstanceDelete,
  typeMatrix,
  dbInstances,
  onSave,
  onBack,
}: SpecialRuleRelationInspectorProps) {
  const [sideA, setSideA] = useState<RuleMember | null>(null);
  const [sideB, setSideB] = useState<RuleMember | null>(null);
  const [pairResultVisible, setPairResultVisible] = useState(false);
  const [orderMembers, setOrderMembers] = useState<RuleMember[]>([]);
  const [orderResultVisible, setOrderResultVisible] = useState(false);
  const [expandedPairKey, setExpandedPairKey] = useState<string | null>(null);
  const [modalPair, setModalPair] = useState<{
    promoA: PromoRef;
    promoB: PromoRef;
    labelA: string;
    labelB: string;
  } | null>(null);
  const [instanceMatrixOpen, setInstanceMatrixOpen] = useState(false);

  const instanceTypeMap = useMemo(() => {
    const map: Record<string, string> = { ...INSTANCE_TYPE_MAP };
    for (const inst of [...instances, ...dbInstances]) {
      map[inst.id] = inst.categoryId;
    }
    return map;
  }, [instances, dbInstances]);

  const pairCoverage = useMemo(() => {
    if (!sideA || !sideB || sideA.refId === sideB.refId) return null;
    const a = ruleMemberToPromoRef(sideA, instanceTypeMap);
    const b = ruleMemberToPromoRef(sideB, instanceTypeMap);
    return getPairCoverage(rules, a, b, priorityEnabled);
  }, [sideA, sideB, rules, priorityEnabled, instanceTypeMap]);

  const orderPairs = useMemo(() => {
    if (orderMembers.length < 2) return [];
    const promos = orderMembers.map(m => ruleMemberToPromoRef(m, instanceTypeMap));
    return resolveOrderPairs(rules, promos, InteractionType.MUTEX, priorityEnabled);
  }, [orderMembers, rules, priorityEnabled, instanceTypeMap]);

  const canRunPair = Boolean(sideA && sideB && sideA.refId !== sideB.refId);
  const canRunOrder = orderMembers.length >= 2;

  const runPairInspect = () => {
    if (!canRunPair) return;
    setPairResultVisible(true);
  };

  const runOrderInspect = () => {
    if (!canRunOrder) return;
    setOrderResultVisible(true);
    setExpandedPairKey(null);
  };

  const openModalForMembers = (a: RuleMember, b: RuleMember) => {
    setModalPair({
      promoA: ruleMemberToPromoRef(a, instanceTypeMap),
      promoB: ruleMemberToPromoRef(b, instanceTypeMap),
      labelA: memberLabel(a),
      labelB: memberLabel(b),
    });
  };

  return (
    <div className="page-card h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-[#e8e8e8] flex items-center gap-2 bg-white">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-[13px] text-[#595959] hover:text-brand-600"
        >
          <ArrowLeft size={14} /> 返回规则列表
        </button>
        <span className="text-[#d9d9d9]">|</span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[#262626]">关系排查</h2>
          <p className="text-[12px] text-[#8c8c8c] mt-0.5 truncate">
            选择优惠对象，试算最终生效关系与命中链
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        <section className="border border-[#e8e8e8] rounded-lg bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search size={16} className="text-brand-600" />
            <h3 className="text-[14px] font-semibold text-[#262626]">逐对试算</h3>
          </div>
          <p className="text-[12px] text-[#8c8c8c] mb-3 leading-relaxed">
            选择两个优惠对象，查看它们之间的最终关系、命中规则与优先级解析过程。
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr_auto] gap-3 items-end">
            <PromoSinglePicker
              label="优惠 A"
              value={sideA}
              categories={categories}
              instances={dbInstances}
              onChange={member => {
                setSideA(member);
                setPairResultVisible(false);
              }}
            />
            <div className="hidden lg:flex items-center justify-center pb-4 text-[#bfbfbf] text-lg">↔</div>
            <PromoSinglePicker
              label="优惠 B"
              value={sideB}
              categories={categories}
              instances={dbInstances}
              onChange={member => {
                setSideB(member);
                setPairResultVisible(false);
              }}
            />
            <button
              type="button"
              className="btn btn--primary h-[72px] lg:h-auto"
              disabled={!canRunPair}
              onClick={runPairInspect}
            >
              试算命中链
            </button>
          </div>

          {pairResultVisible && pairCoverage && sideA && sideB && (
            <div className="mt-4 pt-4 border-t border-[#f0f0f0]">
              <PairCoverageContent
                labelA={memberLabel(sideA)}
                labelB={memberLabel(sideB)}
                coverage={pairCoverage}
              />
            </div>
          )}
        </section>

        <section className="border border-[#e8e8e8] rounded-lg bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitMerge size={16} className="text-brand-600" />
            <h3 className="text-[14px] font-semibold text-[#262626]">整单模拟</h3>
          </div>
          <p className="text-[12px] text-[#8c8c8c] mb-3 leading-relaxed">
            模拟一笔订单同时包含多个优惠时，所有两两关系对的最终生效结果。组间规则仅在订单同时涉及左右两侧对象时参与。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="flex-1">
              <PromoMultiPicker
                label="整单优惠对象"
                value={orderMembers}
                categories={categories}
                instances={dbInstances}
                onChange={members => {
                  setOrderMembers(members);
                  setOrderResultVisible(false);
                }}
              />
            </div>
            <button
              type="button"
              className="btn btn--primary shrink-0"
              disabled={!canRunOrder}
              onClick={runOrderInspect}
            >
              试算全部关系对
            </button>
          </div>

          {orderResultVisible && orderPairs.length > 0 && (
            <div className="mt-4 border border-[#e8e8e8] rounded overflow-hidden">
              <table className="table">
                <thead>
                  <tr>
                    <th>对象 A</th>
                    <th>对象 B</th>
                    <th>最终生效</th>
                    <th>决定规则</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orderPairs.map(row => {
                    const labelA =
                      orderMembers.find(m => ruleMemberToPromoRef(m, instanceTypeMap).id === row.promoA.id)
                        ?.refName ?? row.promoA.id;
                    const labelB =
                      orderMembers.find(m => ruleMemberToPromoRef(m, instanceTypeMap).id === row.promoB.id)
                        ?.refName ?? row.promoB.id;
                    const expanded = expandedPairKey === row.pairKey;
                    return (
                      <React.Fragment key={row.pairKey}>
                        <tr>
                          <td>{labelA}</td>
                          <td>{labelB}</td>
                          <td>
                            <span className="text-brand-600 font-medium">
                              {row.interaction ? interactionLabel(row.interaction) : '—'}
                            </span>
                          </td>
                          <td className="text-[12px] text-[#8c8c8c]">
                            {row.winningRule?.name ?? (row.source === 'DEFAULT' ? '默认规则' : '—')}
                          </td>
                          <td>
                            <button
                              type="button"
                              className="text-[12px] text-brand-600 hover:underline mr-2"
                              onClick={() =>
                                setExpandedPairKey(expanded ? null : row.pairKey)
                              }
                            >
                              {expanded ? '收起' : '展开'}
                            </button>
                            <button
                              type="button"
                              className="text-[12px] text-brand-600 hover:underline"
                              onClick={() => {
                                const ma = orderMembers.find(
                                  m => ruleMemberToPromoRef(m, instanceTypeMap).id === row.promoA.id
                                );
                                const mb = orderMembers.find(
                                  m => ruleMemberToPromoRef(m, instanceTypeMap).id === row.promoB.id
                                );
                                if (ma && mb) openModalForMembers(ma, mb);
                              }}
                            >
                              弹窗查看
                            </button>
                          </td>
                        </tr>
                        {expanded && (
                          <tr>
                            <td colSpan={5} className="bg-[#fafafa]">
                              <div className="p-3">
                                <PairCoverageContent
                                  labelA={labelA}
                                  labelB={labelB}
                                  coverage={row}
                                />
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <SpecialRuleTeachingDemo
          rules={rules}
          priorityEnabled={priorityEnabled}
          onInspectDemoPair={(labelA, labelB, promoA, promoB) =>
            setModalPair({ labelA, labelB, promoA, promoB })
          }
        />

        <section className="border border-[#e8e8e8] rounded-lg bg-[#fafafa] overflow-hidden">
          <button
            type="button"
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#f5f5f5] transition-colors"
            onClick={() => setInstanceMatrixOpen(v => !v)}
          >
            <div>
              <div className="text-[13px] font-medium text-[#262626] flex items-center gap-2">
                <FlaskConical size={14} className="text-[#8c8c8c]" />
                高级 · 实例矩阵配置
              </div>
              <div className="text-[11px] text-[#8c8c8c] mt-1">
                按单个活动实例精细配置关系，与上方组内/组间特例规则是不同配置方式
              </div>
            </div>
            {instanceMatrixOpen ? (
              <ChevronDown size={16} className="text-[#8c8c8c] shrink-0" />
            ) : (
              <ChevronRight size={16} className="text-[#8c8c8c] shrink-0" />
            )}
          </button>
          {instanceMatrixOpen && (
            <div className="border-t border-[#e8e8e8] bg-white p-3 min-h-[480px]">
              <InstanceManager
                categories={categories}
                instances={instances}
                setInstances={setInstances}
                instanceRules={instanceRules}
                onRuleChange={onRuleChange}
                onBatchRuleChange={onBatchRuleChange}
                onInstanceDelete={onInstanceDelete}
                typeMatrix={typeMatrix}
                dbInstances={dbInstances}
                onSave={onSave}
              />
            </div>
          )}
        </section>
      </div>

      {modalPair && (
        <PairInspectorPanel
          open
          promoA={modalPair.promoA}
          promoB={modalPair.promoB}
          labelA={modalPair.labelA}
          labelB={modalPair.labelB}
          coverage={getPairCoverage(
            rules,
            modalPair.promoA,
            modalPair.promoB,
            priorityEnabled
          )}
          onClose={() => setModalPair(null)}
        />
      )}
    </div>
  );
}
