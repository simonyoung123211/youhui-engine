import React from 'react';
import { X, Info, GitMerge, Layers, Ban } from 'lucide-react';
import { SpecialRule } from '../types';
import { SpecialRuleTeachingDemo } from './SpecialRuleTeachingDemo';
import { ModalShell } from './ModalShell';

interface SpecialRuleGuideProps {
  isOpen: boolean;
  onClose: () => void;
  rules: SpecialRule[];
  priorityEnabled: boolean;
}

export const SpecialRuleGuide: React.FC<SpecialRuleGuideProps> = ({
  isOpen,
  onClose,
  rules,
  priorityEnabled,
}) => {
  if (!isOpen) return null;

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg">
        <div className="px-5 py-3.5 border-b border-[#e8e8e8] flex justify-between items-center bg-[#fafafa] shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[#262626] flex items-center gap-2">
              <Info size={18} className="text-brand-600" />
              特例规则说明
            </h2>
            <p className="text-[13px] text-[#8c8c8c] mt-0.5">
              了解组内/组间关系、生效优先级与冲突判定。
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-[#f0f0f0] rounded transition-colors">
            <X size={18} className="text-[#8c8c8c]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-2">选择对象：类型 vs 实例</h3>
            <div className="text-[13px] text-[#595959] leading-relaxed space-y-2">
              <p>
                特例规则中的对象可以是<strong className="font-medium text-[#262626]">优惠类型</strong>（作用于该类型下全部活动），也可以是
                <strong className="font-medium text-[#262626]">活动实例</strong>（仅作用于指定活动）。
              </p>
              <p>
                以下类型<strong className="font-medium text-[#262626]">没有活动实例</strong>，配置时只能按类型选择：
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[#595959]">
                <li>全部支付方式（储值余额、实体储值卡、企迈POS线下结账）</li>
                <li>全部平台团购券（美团/抖音/支付宝/淘宝闪购 套餐券、次券、代金券等）</li>
                <li>消费特权、储值搭售折扣</li>
              </ul>
              <p className="text-[12px] text-[#8c8c8c]">
                在对象选择器的「活动实例」Tab 中，上述类型会标注「仅类型」，请使用「选择整个类型」完成配置。
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-2">关系范围</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
              <div className="p-3 rounded border border-[#f0f0f0] bg-[#fafafa]">
                <div className="font-medium text-[#262626] flex items-center gap-1.5">
                  <Layers size={14} className="text-brand-600" />
                  组内关系
                </div>
                <p className="text-[#595959] mt-1.5 leading-relaxed">
                  一批对象彼此之间关系相同，如 A、B、C 两两共享不叠加。
                </p>
              </div>
              <div className="p-3 rounded border border-[#f0f0f0] bg-[#fafafa]">
                <div className="font-medium text-[#262626] flex items-center gap-1.5">
                  <GitMerge size={14} className="text-orange-500" />
                  组间关系
                </div>
                <p className="text-[#595959] mt-1.5 leading-relaxed">
                  左右两批对象两两结对，如左侧 A+B 与右侧 C 互斥。
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-2">生效优先级</h3>
            <p className="text-[13px] text-[#595959] leading-relaxed">
              特例规则优先于默认规则。系统对<b>每一对优惠单独判断</b>：具体度（实例↔实例 &gt; 实例↔类型 &gt;
              类型↔类型）优先，同层再按创建时间
              {priorityEnabled && '及显式优先级（数字越小越优先）'}
              决定。组间规则只在订单同时涉及左右两侧对象时才参与。
            </p>
          </section>

          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-2 flex items-center gap-1.5">
              <Ban size={14} className="text-rose-500" />
              冲突与覆盖
            </h3>
            <p className="text-[13px] text-[#595959] leading-relaxed">
              保存时会提示将覆盖的已有关系，以及因被更具体规则挡住而不生效的关系对。可在规则详情页查看「本规则关系对生效状态」，或在「高级 ·
              关系排查」中逐对检查命中链。
            </p>
          </section>

          <SpecialRuleTeachingDemo rules={rules} priorityEnabled={priorityEnabled} />
        </div>

        <div className="p-3 border-t border-[#e8e8e8] bg-[#fafafa] text-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-500 text-white px-6 py-1.5 rounded text-[13px] font-medium hover:bg-brand-600 transition-colors"
          >
            我已了解
          </button>
        </div>
    </ModalShell>
  );
};
