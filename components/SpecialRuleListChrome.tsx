import React from 'react';
import { BookOpen, ChevronDown, Filter, Layers, Plus, RotateCcw, Search, Settings } from 'lucide-react';
import { InteractionType } from '../types';
import {
  SpecialRuleInteractionFilter,
  SpecialRuleScopeFilter,
  SpecialRuleStatusFilter,
} from '../utils/specialRuleQuery';

const STATUS_TABS: { value: SpecialRuleStatusFilter; label: string }[] = [
  { value: 'ALL', label: '全部' },
  { value: 'ENABLED', label: '已启用' },
  { value: 'DISABLED', label: '已停用' },
];

export interface SpecialRuleListChromeProps {
  keyword: string;
  onKeywordChange: (value: string) => void;
  status: SpecialRuleStatusFilter;
  onStatusChange: (value: SpecialRuleStatusFilter) => void;
  statusCounts: { all: number; enabled: number; disabled: number };
  relationScope: SpecialRuleScopeFilter;
  onRelationScopeChange: (value: SpecialRuleScopeFilter) => void;
  interaction: SpecialRuleInteractionFilter;
  onInteractionChange: (value: SpecialRuleInteractionFilter) => void;
  expiredOnly: boolean;
  onExpiredOnlyChange: (value: boolean) => void;
  filterExpanded: boolean;
  onFilterExpandedChange: (value: boolean) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  statsHint?: string;
  priorityEnabled: boolean;
  bannerExpanded: boolean;
  onBannerExpandedChange: (value: boolean) => void;
  onViewDefaultRules?: () => void;
  onOpenInspector: () => void;
  onOpenGuide: () => void;
  onOpenPriorityPanel: () => void;
  onOpenStackingPilot: () => void;
  stackingPilotEnabled: boolean;
  onCreate: () => void;
}

function statusCount(
  counts: SpecialRuleListChromeProps['statusCounts'],
  status: SpecialRuleStatusFilter
): number {
  if (status === 'ENABLED') return counts.enabled;
  if (status === 'DISABLED') return counts.disabled;
  return counts.all;
}

export function SpecialRuleListChrome({
  keyword,
  onKeywordChange,
  status,
  onStatusChange,
  statusCounts,
  relationScope,
  onRelationScopeChange,
  interaction,
  onInteractionChange,
  expiredOnly,
  onExpiredOnlyChange,
  filterExpanded,
  onFilterExpandedChange,
  hasActiveFilters,
  onClearFilters,
  statsHint,
  priorityEnabled,
  bannerExpanded,
  onBannerExpandedChange,
  onViewDefaultRules,
  onOpenInspector,
  onOpenGuide,
  onOpenPriorityPanel,
  onOpenStackingPilot,
  stackingPilotEnabled,
  onCreate,
}: SpecialRuleListChromeProps) {
  return (
    <>
      <header className="list-page-header list-page-header--compact shrink-0">
        <div className="list-page-header__main">
          <div className="list-page-header__title-row">
            <h1 className="list-page-header__title">特例规则</h1>
          </div>
        </div>
        <div className="list-page-header__actions">
          <button type="button" className="btn btn--default btn--icon" onClick={onOpenInspector}>
            <Search size={14} />
            关系排查
          </button>
          <button type="button" className="btn btn--default btn--icon" onClick={onOpenGuide}>
            <BookOpen size={14} />
            规则说明
          </button>
          <button type="button" className="btn btn--default btn--icon" onClick={onOpenPriorityPanel}>
            <Settings size={14} />
            高级策略
          </button>
          <button type="button" className="btn btn--default btn--icon" onClick={onOpenStackingPilot}>
            <Layers size={14} />
            高级特例配置
            {stackingPilotEnabled && <span className="btn-dot" aria-label="已开启" />}
          </button>
          <button type="button" className="btn btn--primary btn--icon" onClick={onCreate}>
            <Plus size={14} />
            新建规则
          </button>
        </div>
      </header>

      <div className="info-banner-wrap shrink-0">
        <button
          type="button"
          className={`info-banner-toggle ${bannerExpanded ? 'is-expanded' : ''}`}
          onClick={() => onBannerExpandedChange(!bannerExpanded)}
          aria-expanded={bannerExpanded}
        >
          <svg className="info-banner__icon" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 110 1.5.75.75 0 010-1.5zm-.75 3h1.5v4.5h-1.5V7z" />
          </svg>
          <span className="info-banner-toggle__label">特例规则说明</span>
          <ChevronDown size={14} className="info-banner-toggle__chevron" />
        </button>
        {bannerExpanded && (
          <div className="info-banner-panel">
            <div className="info-banner">
              <span>
                特例规则优先于默认规则。系统按<strong>「每一对优惠单独判断」</strong>：具体度（实例↔实例
                &gt; 实例↔类型 &gt; 类型↔类型）优先，同层再比创建时间。
                {priorityEnabled && ' 已启用显式优先级，数字越小越优先。'}
                不确定某对优惠最终关系时，可使用「关系排查」试算命中链。
              </span>
            </div>
            <div className="info-banner__links">
              <div className="info-banner__tip">
                <span className="info-banner__tip-text">
                  未命中特例规则时，回退到默认规则。查看
                  <a
                    className="info-banner__link"
                    href="#"
                    onClick={e => {
                      e.preventDefault();
                      onViewDefaultRules?.();
                    }}
                  >
                    默认规则
                  </a>
                </span>
              </div>
              <button
                type="button"
                className="info-banner__link border-none bg-transparent cursor-pointer"
                onClick={onOpenInspector}
              >
                关系排查
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="list-chrome shrink-0">
        <div className="status-tabs status-tabs--pill">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              className={`status-tab ${status === tab.value ? 'is-active' : ''}`}
              onClick={() => onStatusChange(tab.value)}
            >
              {tab.label}
              <span className="status-tab__count">{statusCount(statusCounts, tab.value)}</span>
            </button>
          ))}
        </div>

        <div className="list-toolbar">
          <div className="list-toolbar__fields">
            <div className="filter-item filter-item--wide">
              <label htmlFor="sr-list-keyword">规则名称 / ID / 对象</label>
              <input
                id="sr-list-keyword"
                className="input input--filter"
                placeholder="搜索规则名称、ID、对象"
                value={keyword}
                onChange={e => onKeywordChange(e.target.value)}
              />
            </div>
            {filterExpanded && (
              <>
                <div className="filter-item">
                  <label htmlFor="sr-list-scope">关系类型</label>
                  <select
                    id="sr-list-scope"
                    className="input input--filter"
                    value={relationScope}
                    onChange={e => onRelationScopeChange(e.target.value as SpecialRuleScopeFilter)}
                  >
                    <option value="ALL">全部</option>
                    <option value="INTRA_GROUP">组内关系</option>
                    <option value="INTER_GROUP">组间关系</option>
                  </select>
                </div>
                <div className="filter-item">
                  <label htmlFor="sr-list-interaction">关系</label>
                  <select
                    id="sr-list-interaction"
                    className="input input--filter"
                    value={interaction}
                    onChange={e =>
                      onInteractionChange(e.target.value as SpecialRuleInteractionFilter)
                    }
                  >
                    <option value="ALL">全部</option>
                    <option value={InteractionType.MUTEX}>互斥</option>
                    <option value={InteractionType.ITEM_MUTEX}>共享不叠加</option>
                    <option value={InteractionType.ALLOW}>共享且叠加</option>
                  </select>
                </div>
                <div className="filter-item filter-item--checkbox">
                  <label htmlFor="sr-list-expired">对象状态</label>
                  <label className="filter-checkbox" htmlFor="sr-list-expired">
                    <input
                      id="sr-list-expired"
                      type="checkbox"
                      checked={expiredOnly}
                      onChange={e => onExpiredOnlyChange(e.target.checked)}
                    />
                    仅含失效对象
                  </label>
                </div>
              </>
            )}
          </div>
          <div className="list-toolbar__actions">
            {statsHint && <span className="list-toolbar__hint hidden lg:inline">{statsHint}</span>}
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
