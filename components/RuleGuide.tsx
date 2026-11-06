import React from 'react';
import {
  X,
  Check,
  Layers,
  Box,
  Info,
  LayoutList,
  Grid3x3,
  GitMerge,
  ListOrdered,
  ArrowDown,
} from 'lucide-react';
import { PROMO_GROUP_ORDER } from '../types';
import { ModalShell } from './ModalShell';

interface RuleGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RuleGuide: React.FC<RuleGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <ModalShell open={isOpen} onClose={onClose} size="lg" overlayClassName="animate-fade-in">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#e8e8e8] flex justify-between items-center bg-[#fafafa] shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[#262626] flex items-center gap-2">
              <Info size={18} className="text-brand-600" /> 规则说明
            </h2>
            <p className="text-[13px] text-[#8c8c8c] mt-0.5">
              配置前请了解三种优惠关系、作用域划分与规则生效优先级。
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-[#f0f0f0] rounded transition-colors">
            <X size={18} className="text-[#8c8c8c]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-white min-h-0">
          {/* 1. Three interaction types */}
          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-3">一、三种优惠关系</h3>
            <p className="text-[13px] text-[#595959] mb-4 leading-relaxed">
              默认规则矩阵描述<b>优惠类型</b>之间的两两关系。关系对称：A 对 B 与 B 对 A 结果一致。
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-11 h-11 rounded bg-brand-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-7 h-7 bg-brand-500 rounded flex items-center justify-center text-white">
                    <Check size={18} strokeWidth={3} />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-semibold text-[#262626] mb-1">共享且叠加</h4>
                  <p className="text-[13px] text-[#595959] mb-2.5 leading-relaxed">
                    两个优惠可在<b>同一订单</b>中同时生效；单品级优惠时，也可作用于<b>同一商品</b>并依次扣减。
                  </p>
                  <div className="bg-brand-500/5 rounded p-3 border border-brand-500/20 text-[13px]">
                    <span className="font-medium text-brand-700">场景举例：</span>
                    <ul className="list-disc list-inside mt-1 text-brand-800 space-y-1">
                      <li>
                        <b>满减 + 减配送费</b>：订单满 100 减 20，同时减免配送费。
                      </li>
                      <li>
                        <b>单品折扣 + 积分抵现</b>：商品打 8 折后，订单剩余应付金额可用积分继续抵扣。
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#f0f0f0]" />

              <div className="flex gap-4">
                <div className="w-11 h-11 rounded bg-[#60a5fa]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-7 h-7 bg-[#60a5fa] rounded flex items-center justify-center text-white">
                    <div className="w-3 h-3 border-[3px] border-white transform rotate-45" />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-semibold text-[#262626] mb-1">共享不叠加</h4>
                  <p className="text-[13px] text-[#595959] mb-2.5 leading-relaxed">
                    <span className="bg-[#f5f5f5] text-[#595959] px-1.5 py-0.5 rounded text-[12px] font-medium mr-1">
                      仅限单品级 ↔ 单品级
                    </span>
                    允许两个优惠出现在同一订单，但<b>不能叠加在同一商品上</b>。系统会分配到不同商品，或对同一商品取更优结果。
                  </p>
                  <div className="bg-[#60a5fa]/5 rounded p-3 border border-[#60a5fa]/20 text-[13px]">
                    <span className="font-medium text-[#1d4ed8]">场景举例：</span>
                    <ul className="list-disc list-inside mt-1 text-[#1e3a8a] space-y-1">
                      <li>
                        <b>会员价 vs 折扣券</b>：一杯咖啡不能既享会员价又用券；买 2 杯时可一杯用会员价、另一杯用券。
                      </li>
                      <li>
                        <b>买 1 送 1 vs 第二件半价</b>：同一商品不能同时参与两个活动。
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#f0f0f0]" />

              <div className="flex gap-4">
                <div className="w-11 h-11 rounded bg-[#fb7185]/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-7 h-7 bg-[#fb7185] rounded flex items-center justify-center text-white">
                    <X size={18} strokeWidth={3} />
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-[15px] font-semibold text-[#262626] mb-1">完全互斥</h4>
                  <p className="text-[13px] text-[#595959] mb-2.5 leading-relaxed">
                    不能同时使用。订单中已使用优惠 A，则<b>不能再使用</b>优惠 B，无论涉及多少商品。系统默认大多数跨类型组合为互斥。
                  </p>
                  <div className="bg-[#fb7185]/5 rounded p-3 border border-[#fb7185]/20 text-[13px]">
                    <span className="font-medium text-[#be123c]">场景举例：</span>
                    <ul className="list-disc list-inside mt-1 text-[#9f1239] space-y-1">
                      <li>
                        <b>全场 5 折 vs 满减</b>：大力度折扣活动通常不再叠加满减或代金券。
                      </li>
                      <li>
                        <b>平台团购套餐 vs 代金券</b>：已核销特价套餐的订单不可再使用整单代金券。
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-[#f0f0f0]" />

          {/* 2. Scope */}
          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-3">二、作用域与分类</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="bg-[#fafafa] rounded p-3 border border-[#f0f0f0] text-[13px]">
                <span className="font-medium text-[#262626] flex items-center gap-1.5">
                  <Box size={14} className="text-purple-500" /> 单品级
                </span>
                <p className="text-[#595959] mt-1.5 text-[12px] leading-relaxed">
                  作用于单个商品，如会员价、折扣券、限时折扣等。列表配置时，「共享不叠加」仅在此区域对<b>单品 vs 单品</b>生效。
                </p>
              </div>
              <div className="bg-[#fafafa] rounded p-3 border border-[#f0f0f0] text-[13px]">
                <span className="font-medium text-[#262626] flex items-center gap-1.5">
                  <Layers size={14} className="text-orange-500" /> 整单级
                </span>
                <p className="text-[#595959] mt-1.5 text-[12px] leading-relaxed">
                  作用于订单汇总金额，如满减、代金券、减配送费等。与单品级优惠分阶段计算，整单级在单品级之后执行。
                </p>
              </div>
            </div>
            <div className="bg-[#fafafa] rounded p-3 border border-[#f0f0f0] text-[13px]">
              <span className="font-medium text-[#262626]">业务分类</span>
              <p className="text-[#595959] mt-1.5 text-[12px] leading-relaxed">
                优惠类型按
                {PROMO_GROUP_ORDER.map((g, i) => (
                  <React.Fragment key={g}>
                    {i > 0 && '、'}
                    <b>{g}</b>
                  </React.Fragment>
                ))}
                分组。右侧目标列表支持按分类筛选与折叠，便于快速定位。
              </p>
            </div>
          </section>

          <div className="h-px bg-[#f0f0f0]" />

          {/* 3. Rule priority */}
          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-3">三、规则生效优先级</h3>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 text-[13px]">
              <div className="flex-1 bg-[#fafafa] border border-[#f0f0f0] rounded p-3">
                <div className="flex items-center gap-2 font-medium text-[#262626]">
                  <LayoutList size={14} className="text-brand-600" /> 默认规则
                </div>
                <p className="text-[12px] text-[#595959] mt-1.5 leading-relaxed">
                  本页配置的「类型 ↔ 类型」矩阵，作为全局兜底。矩阵总览为只读查看，修改请用列表配置。
                </p>
              </div>
              <div className="hidden sm:flex items-center text-[#bfbfbf] px-1">
                <ArrowDown size={16} className="rotate-[-90deg]" />
              </div>
              <div className="flex-1 bg-[#fafafa] border border-[#f0f0f0] rounded p-3">
                <div className="flex items-center gap-2 font-medium text-[#262626]">
                  <GitMerge size={14} className="text-purple-600" /> 特例规则
                </div>
                <p className="text-[12px] text-[#595959] mt-1.5 leading-relaxed">
                  优先级高于默认规则。支持类型或活动实例的精细配置，未命中时回退默认矩阵。
                </p>
              </div>
            </div>
            <div className="mt-3 bg-purple-50/60 rounded p-3 border border-purple-100 text-[12px] text-[#595959] leading-relaxed">
              系统对<b>每一对优惠单独判断</b>，具体度优先：
              <span className="text-[#262626] font-medium"> 实例↔实例 </span>
              &gt;
              <span className="text-[#262626] font-medium"> 实例↔类型 </span>
              &gt;
              <span className="text-[#262626] font-medium"> 类型↔类型</span>
              ；同层再按创建时间（及可选的显式优先级）决定。
            </div>
          </section>

          <div className="h-px bg-[#f0f0f0]" />

          {/* 4. Same-type & no-config */}
          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-3">四、同类关系与无需配置</h3>
            <div className="space-y-3 text-[13px]">
              <div className="flex gap-3">
                <span className="shrink-0 text-[11px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded border border-brand-200 h-fit">
                  同类
                </span>
                <p className="text-[#595959] leading-relaxed">
                  列表中标记为「同类」表示来源类型与目标类型相同，即同类型优惠之间的叠加关系。系统默认：单品级同类为
                  <b>共享不叠加</b>（如多张单品券按商品分配），整单级同类为<b>完全互斥</b>（如一笔订单通常只享一个满减档位）。
                </p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 text-[#8c8c8c] font-mono text-[13px] h-fit">—</span>
                <p className="text-[#595959] leading-relaxed">
                  矩阵中显示「—」表示<b>无需配置</b>。支付方式类（储值余额、实体储值卡）在同一订单中通常唯一，同类单元格留空。
                </p>
              </div>
            </div>
          </section>

          <div className="h-px bg-[#f0f0f0]" />

          {/* 5. Calculation order */}
          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-3">五、计算顺序</h3>
            <div className="flex items-center gap-2 font-medium text-[#262626] mb-2">
              <ListOrdered size={14} className="text-brand-600" />
              <span className="text-[13px]">在「计算顺序」页配置</span>
            </div>
            <p className="text-[13px] text-[#595959] mb-3 leading-relaxed">
              当多种优惠科目<b>允许叠加</b>时，按配置的顺序依次扣减。本页调整的是科目先后，不是某个活动里的立减、改价或折扣。计算分两个阶段：先执行<b>单品级</b>，汇总后再执行<b>整单级</b>。优先跟随系统默认；平台套餐券/次券建议保持在商家单品优惠之前，平台代金券建议保持在商家整单优惠之后。支付方式不参与优惠计算，无需配置顺序。
            </p>
            <div className="bg-[#fafafa] rounded p-3 border border-[#f0f0f0] text-[12px] text-[#595959] leading-relaxed">
              <span className="font-medium text-[#262626]">POS计算顺序（仅限企迈 POS）：</span>
              可切换为「按计算顺序」（推荐，结果稳定）或「按录入先后」（录入先后可能影响实付）。小程序始终按计算顺序。
            </div>
          </section>

          <div className="h-px bg-[#f0f0f0]" />

          {/* 6. Page tips */}
          <section>
            <h3 className="text-[14px] font-semibold text-[#262626] mb-3">六、本页配置指引</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div className="flex gap-2.5 p-3 rounded border border-[#f0f0f0] bg-[#fafafa]">
                <LayoutList size={16} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-[#262626]">列表配置</div>
                  <p className="text-[#595959] mt-1 leading-relaxed">
                    左侧选择来源类型，右侧按「单品级 / 整单级」及业务分类设置目标关系。支持搜索、规则筛选、分类筛选与批量修改。
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 p-3 rounded border border-[#f0f0f0] bg-[#fafafa]">
                <Grid3x3 size={16} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-[#262626]">矩阵总览</div>
                  <p className="text-[#595959] mt-1 leading-relaxed">
                    只读查看全部类型两两关系，便于整体把握。需要修改时请切回列表配置并点击「修改」。
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded p-2.5 mt-3 leading-relaxed">
              建议在非营业高峰修改规则并保存，避免影响下单时的优惠计算。
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#e8e8e8] bg-[#fafafa] text-center shrink-0">
          <button
            onClick={onClose}
            className="bg-brand-500 text-white px-6 py-1.5 rounded text-[13px] font-medium hover:bg-brand-600 transition-colors"
          >
            我已了解
          </button>
        </div>
    </ModalShell>
  );
};
