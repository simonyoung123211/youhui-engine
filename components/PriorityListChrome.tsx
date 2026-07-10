import React from 'react';
import { BookOpen, Calculator, ChevronDown, Filter, Pencil, RotateCcw, Save, X } from 'lucide-react';
import { PromoGroup, PROMO_GROUP_ORDER } from '../types';
import { CalcOrderGroupFilter } from '../utils/calcOrderReorder';

export interface PriorityListChromeProps {
  isEditing: boolean;
  bannerExpanded: boolean;
  onBannerExpandedChange: (v: boolean) => void;
  keyword: string;
  onKeywordChange: (v: string) => void;
  groupFilter: CalcOrderGroupFilter;
  onGroupFilterChange: (v: CalcOrderGroupFilter) => void;
  adjustedOnly: boolean;
  onAdjustedOnlyChange: (v: boolean) => void;
  filterExpanded: boolean;
  onFilterExpandedChange: (v: boolean) => void;
  hasActiveFilters: boolean;
  adjustedCount: number;
  onClearFilters: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRequestSave: () => void;
  onResetDefault: () => void;
  onOpenRuleGuide: () => void;
  rationaleExpanded: boolean;
  onRationaleExpandedChange: (v: boolean) => void;
  newCategoryNotice?: string | null;
}

export function PriorityListChrome({
  isEditing,
  bannerExpanded,
  onBannerExpandedChange,
  keyword,
  onKeywordChange,
  groupFilter,
  onGroupFilterChange,
  adjustedOnly,
  onAdjustedOnlyChange,
  filterExpanded,
  onFilterExpandedChange,
  hasActiveFilters,
  adjustedCount,
  onClearFilters,
  onStartEdit,
  onCancelEdit,
  onRequestSave,
  onResetDefault,
  onOpenRuleGuide,
  rationaleExpanded,
  onRationaleExpandedChange,
  newCategoryNotice,
}: PriorityListChromeProps) {
  return (
    <>
      <header className="list-page-header list-page-header--compact shrink-0">
        <div className="list-page-header__main">
          <div className="list-page-header__title-row">
            <Calculator className="text-brand-600 shrink-0" size={20} aria-hidden />
            <h1 className="list-page-header__title">计算顺序</h1>
            <button
              type="button"
              className="list-page-header__help"
              aria-label="查看规则说明"
              onClick={onOpenRuleGuide}
            >
              <BookOpen size={16} />
            </button>
          </div>
          <p className="list-page-header__desc">
            当多种优惠 <strong>允许叠加</strong> 时，按全局序号依次扣减；先完成单品级，再进入整单级。
          </p>
        </div>
        <div className="list-page-header__actions">
          {!isEditing ? (
            <button type="button" className="btn btn--primary btn--icon" onClick={onStartEdit}>
              <Pencil size={14} />
              调整顺序
            </button>
          ) : (
            <>
              <button type="button" className="btn btn--default btn--icon btn--sm" onClick={onResetDefault}>
                <RotateCcw size={13} />
                恢复默认
              </button>
              <button type="button" className="btn btn--default btn--icon" onClick={onCancelEdit}>
                <X size={14} />
                取消
              </button>
              <button type="button" className="btn btn--primary btn--icon" onClick={onRequestSave}>
                <Save size={14} />
                保存
              </button>
            </>
          )}
        </div>
      </header>

      {newCategoryNotice && (
        <div className="calc-order-notice shrink-0" role="status">
          {newCategoryNotice}
        </div>
      )}

      <div className="info-banner-wrap shrink-0">
        <button
          type="button"
          className={`info-banner-toggle ${bannerExpanded ? 'is-expanded' : ''}`}
          onClick={() => onBannerExpandedChange(!bannerExpanded)}
          aria-expanded={bannerExpanded}
        >
          <span className="info-banner-toggle__label">计算顺序说明</span>
          <ChevronDown size={14} className="info-banner-toggle__chevron" />
        </button>
        {bannerExpanded && (
          <div className="info-banner-panel">
            <div className="info-banner">
              <span>
                全局序号决定叠加时的扣减先后。计算分两个阶段：<strong>单品级</strong>优先执行，汇总后再执行
                <strong>整单级</strong>。建议遵循「改价（会员价）&gt; 打折 &gt; 立减」的通用顺序。
              </span>
            </div>
            <button
              type="button"
              className="calc-order-rationale-toggle"
              onClick={() => onRationaleExpandedChange(!rationaleExpanded)}
            >
              {rationaleExpanded ? '收起推荐依据' : '查看推荐依据'}
              <ChevronDown
                size={12}
                className={rationaleExpanded ? 'calc-order-rationale-toggle__chevron--open' : ''}
              />
            </button>
            {rationaleExpanded && (
              <div className="calc-order-rationale">
                <p className="calc-order-rationale__intro">
                  系统默认顺序按业务分组权重生成，同组内按名称稳定排序：
                </p>
                <ul className="calc-order-rationale__list">
                  <li>用户权益（改价类）→ 营销活动 → 用户资产 → 企迈POS → 平台团购 → 支付方式</li>
                  <li>单品级与整单级分别排序，序号全局连续编号</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="list-chrome shrink-0">
        <div className="list-toolbar">
          <div className="list-toolbar__fields">
            <div className="filter-item filter-item--wide">
              <label htmlFor="co-keyword">优惠类型</label>
              <input
                id="co-keyword"
                className="input input--filter"
                placeholder="搜索名称、ID、描述"
                value={keyword}
                onChange={e => onKeywordChange(e.target.value)}
              />
            </div>
            {filterExpanded && (
              <>
                <div className="filter-item">
                  <label htmlFor="co-group">业务分组</label>
                  <select
                    id="co-group"
                    className="input input--filter"
                    value={groupFilter}
                    onChange={e => onGroupFilterChange(e.target.value as CalcOrderGroupFilter)}
                  >
                    <option value="ALL">全部分组</option>
                    {PROMO_GROUP_ORDER.map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-item filter-item--checkbox">
                  <label htmlFor="co-adjusted">变更筛选</label>
                  <label className="filter-checkbox" htmlFor="co-adjusted">
                    <input
                      id="co-adjusted"
                      type="checkbox"
                      checked={adjustedOnly}
                      onChange={e => onAdjustedOnlyChange(e.target.checked)}
                    />
                    仅看已调整
                    {adjustedCount > 0 && (
                      <span className="calc-order-adjusted-badge">{adjustedCount}</span>
                    )}
                  </label>
                </div>
              </>
            )}
          </div>
          <div className="list-toolbar__actions">
            {hasActiveFilters && (
              <button type="button" className="btn btn--default btn--icon btn--sm" onClick={onClearFilters}>
                <RotateCcw size={13} />
                重置
              </button>
            )}
            <button
              type="button"
              className={`list-toolbar__toggle ${filterExpanded ? 'is-expanded' : ''}`}
              onClick={() => onFilterExpandedChange(!filterExpanded)}
            >
              <Filter size={14} />
              更多筛选
              <ChevronDown size={12} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
