import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/admin.css';
import {
  PromotionCategory,
  PromoScope,
  getDefaultPriority,
} from '../types';
import {
  Info,
  ListOrdered,
  MonitorCheck,
  MousePointerClick,
  Smartphone,
} from 'lucide-react';
import { PriorityListChrome } from './PriorityListChrome';
import { PriorityTypeList } from './PriorityTypeList';
import { CalcOrderSaveConfirmModal } from './CalcOrderSaveConfirmModal';
import {
  StackingStrategyConfirmModal,
  StackingStrategy,
} from './StackingStrategyConfirmModal';
import { ModalShell } from './ModalShell';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  areCalcOrderListsEqual,
  buildCalcOrderItems,
  CalcOrderGroupFilter,
  computeCalcOrderChanges,
  detectNewCategoryIds,
  filterCalcOrderItems,
  getAdjustedCategoryIds,
  normalizeCalcOrderByScope,
  moveCalcOrderByOffset,
  moveCalcOrderToBottom,
  moveCalcOrderToIndex,
  moveCalcOrderToTop,
  reorderCalcOrderByDrag,
  splitByScope,
} from '../utils/calcOrderReorder';
import {
  appendCalcOrderChangelog,
  loadCalcOrderChangelog,
  loadKnownCategoryIds,
  saveKnownCategoryIds,
  CalcOrderChangeLogEntry,
} from '../utils/calcOrderChangelog';
import {
  applyCalcOrderListUrl,
  readCalcOrderListUrl,
} from '../utils/calcOrderListUrl';

interface PriorityManagerProps {
  categories: PromotionCategory[];
  priorityList: string[];
  setPriorityList: (list: string[]) => void;
  stackingStrategy: StackingStrategy;
  setStackingStrategy: (strategy: StackingStrategy) => void;
  onSave?: () => void;
  onOpenRuleGuide?: () => void;
  onToast?: (message: string) => void;
}

export const PriorityManager: React.FC<PriorityManagerProps> = ({
  categories,
  priorityList,
  setPriorityList,
  stackingStrategy,
  setStackingStrategy,
  onSave,
  onOpenRuleGuide,
  onToast,
}) => {
  const initialUrl = readCalcOrderListUrl();
  const defaultList = useMemo(() => getDefaultPriority(categories), [categories]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftList, setDraftList] = useState<string[]>(priorityList);
  const [savedSnapshot, setSavedSnapshot] = useState<string[]>(priorityList);

  const [keyword, setKeyword] = useState(initialUrl.keyword);
  const [groupFilter, setGroupFilter] = useState<CalcOrderGroupFilter>(initialUrl.group);
  const [adjustedOnly, setAdjustedOnly] = useState(initialUrl.adjustedOnly);
  const [filterExpanded, setFilterExpanded] = useState(
    initialUrl.group !== 'ALL' || initialUrl.adjustedOnly
  );
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [rationaleExpanded, setRationaleExpanded] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetIndexInput, setTargetIndexInput] = useState('1');

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [pendingStrategy, setPendingStrategy] = useState<StackingStrategy | null>(null);
  const [newCategoryNotice, setNewCategoryNotice] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<CalcOrderChangeLogEntry[]>(() =>
    loadCalcOrderChangelog()
  );

  const debouncedKeyword = useDebouncedValue(keyword, 200);
  const skipUrlSyncRef = useRef(true);

  useEffect(() => {
    if (!isEditing) setDraftList(priorityList);
  }, [priorityList, isEditing]);

  useEffect(() => {
    const known = loadKnownCategoryIds();
    const allIds = categories.map(c => c.id);
    const newlyAdded = detectNewCategoryIds(categories, known);
    if (known && newlyAdded.length > 0) {
      setNewCategoryNotice(
        `系统新增 ${newlyAdded.length} 个优惠类型，已按默认规则追加到顺序末尾，请核对全局序号。`
      );
    }
    saveKnownCategoryIds(allIds);
  }, [categories]);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }
    applyCalcOrderListUrl({ keyword, group: groupFilter, adjustedOnly });
  }, [keyword, groupFilter, adjustedOnly]);

  const activeList = isEditing ? draftList : priorityList;

  const allItems = useMemo(
    () => buildCalcOrderItems(activeList, categories, defaultList),
    [activeList, categories, defaultList]
  );

  const filteredItems = useMemo(
    () =>
      filterCalcOrderItems(allItems, {
        keyword: debouncedKeyword,
        group: groupFilter,
        scope: 'ALL',
        adjustedOnly,
      }),
    [allItems, debouncedKeyword, groupFilter, adjustedOnly]
  );

  const { itemLevel, orderLevel } = useMemo(() => splitByScope(filteredItems), [filteredItems]);

  const adjustedCount = useMemo(
    () => getAdjustedCategoryIds(activeList, categories).length,
    [activeList, categories]
  );

  const hasDraftChanges = useMemo(
    () => !areCalcOrderListsEqual(draftList, savedSnapshot),
    [draftList, savedSnapshot]
  );

  const pendingChanges = useMemo(
    () => computeCalcOrderChanges(savedSnapshot, draftList, categories),
    [savedSnapshot, draftList, categories]
  );

  const hasActiveFilters =
    keyword.trim() !== '' || groupFilter !== 'ALL' || adjustedOnly;

  const clearFilters = () => {
    setKeyword('');
    setGroupFilter('ALL');
    setAdjustedOnly(false);
    setFilterExpanded(false);
  };

  const showToast = useCallback(
    (msg: string) => {
      onToast?.(msg);
    },
    [onToast]
  );

  useEffect(() => {
    if (!isEditing || !hasDraftChanges) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isEditing, hasDraftChanges]);

  const handleStartEdit = () => {
    setDraftList([...priorityList]);
    setSavedSnapshot([...priorityList]);
    setSelectedIds(new Set());
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (hasDraftChanges && !window.confirm('有未保存的顺序调整，确定放弃？')) return;
    setDraftList([...priorityList]);
    setSelectedIds(new Set());
    setIsEditing(false);
  };

  const handleRequestSave = () => {
    if (!hasDraftChanges) {
      setIsEditing(false);
      return;
    }
    setSaveModalOpen(true);
  };

  const handleConfirmSave = () => {
    setPriorityList(draftList);
    setSavedSnapshot([...draftList]);
    setIsEditing(false);
    setSaveModalOpen(false);
    setSelectedIds(new Set());
    const changes = pendingChanges;
    appendCalcOrderChangelog({
      operator: '当前用户',
      summary: `调整 ${changes.length} 个优惠类型计算顺序`,
      changeCount: changes.length,
    });
    setChangelog(loadCalcOrderChangelog());
    onSave?.();
  };

  const handleResetDefault = () => {
    setResetModalOpen(true);
  };

  const handleConfirmReset = () => {
    setDraftList([...defaultList]);
    setResetModalOpen(false);
    setSelectedIds(new Set());
  };

  const handleDragReorder = (fromId: string, toId: string) => {
    const result = reorderCalcOrderByDrag(draftList, fromId, toId, categories);
    if (result.rejected === 'CROSS_SCOPE') {
      showToast('不可跨计算阶段拖动，单品级与整单级需分别调整');
      return;
    }
    setDraftList(result.list);
  };

  const updateDraft = (updater: (list: string[]) => string[]) => {
    setDraftList(prev => normalizeCalcOrderByScope(updater(prev), categories));
  };

  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);

  const applyBatchMove = (fn: (list: string[], ids: string[]) => string[]) => {
    if (!selectedIdList.length) {
      showToast('请先勾选要移动的优惠类型');
      return;
    }
    updateDraft(list => fn(list, selectedIdList));
  };

  const handleMoveToIndex = () => {
    const n = Number.parseInt(targetIndexInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > draftList.length) {
      showToast(`请输入 1–${draftList.length} 之间的目标序号`);
      return;
    }
    applyBatchMove((list, ids) => moveCalcOrderToIndex(list, ids, n - 1, categories));
  };

  const handleStrategyClick = (next: StackingStrategy) => {
    if (isEditing) return;
    if (next === stackingStrategy) return;
    setPendingStrategy(next);
    setStrategyModalOpen(true);
  };

  const handleConfirmStrategy = () => {
    if (!pendingStrategy) return;
    setStackingStrategy(pendingStrategy);
    setStrategyModalOpen(false);
    setPendingStrategy(null);
    onSave?.();
    showToast(
      pendingStrategy === 'OPERATION_ORDER'
        ? '已切换为收银添加顺序（POS）'
        : '已切换为严格类型优先级'
    );
  };

  const itemPhaseStart = itemLevel[0]?.globalIndex ?? 1;
  const orderPhaseStart = orderLevel[0]?.globalIndex ?? itemPhaseStart;

  return (
    <div className="page-card page-card--list calc-order-page h-full flex flex-col overflow-hidden">
      <PriorityListChrome
        isEditing={isEditing}
        bannerExpanded={bannerExpanded}
        onBannerExpandedChange={setBannerExpanded}
        keyword={keyword}
        onKeywordChange={setKeyword}
        groupFilter={groupFilter}
        onGroupFilterChange={setGroupFilter}
        adjustedOnly={adjustedOnly}
        onAdjustedOnlyChange={setAdjustedOnly}
        filterExpanded={filterExpanded}
        onFilterExpandedChange={setFilterExpanded}
        hasActiveFilters={hasActiveFilters}
        adjustedCount={adjustedCount}
        onClearFilters={clearFilters}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onRequestSave={handleRequestSave}
        onResetDefault={handleResetDefault}
        onOpenRuleGuide={() => onOpenRuleGuide?.()}
        rationaleExpanded={rationaleExpanded}
        onRationaleExpandedChange={setRationaleExpanded}
        newCategoryNotice={newCategoryNotice}
      />

      {isEditing && (
        <div className="calc-order-edit-banner shrink-0">
          <span>编辑模式：拖拽或使用批量工具调整全局顺序。保存前将二次确认，变更影响下单优惠计算。</span>
        </div>
      )}

      {isEditing && (
        <div className="calc-order-batch-bar shrink-0">
          <span className="calc-order-batch-bar__label">已选 {selectedIds.size} 项</span>
          <button type="button" className="btn btn--default btn--sm" onClick={() => applyBatchMove((list, ids) => moveCalcOrderToTop(list, ids, categories))}>
            移至顶
          </button>
          <button type="button" className="btn btn--default btn--sm" onClick={() => applyBatchMove((list, ids) => moveCalcOrderByOffset(list, ids, -1, categories))}>
            上移
          </button>
          <button type="button" className="btn btn--default btn--sm" onClick={() => applyBatchMove((list, ids) => moveCalcOrderByOffset(list, ids, 1, categories))}>
            下移
          </button>
          <button type="button" className="btn btn--default btn--sm" onClick={() => applyBatchMove((list, ids) => moveCalcOrderToBottom(list, ids, categories))}>
            移至底
          </button>
          <div className="calc-order-batch-bar__index">
            <label htmlFor="co-target-idx">移至序号</label>
            <input
              id="co-target-idx"
              className="calc-order-batch-bar__input"
              value={targetIndexInput}
              onChange={e => setTargetIndexInput(e.target.value)}
            />
            <button type="button" className="btn btn--default btn--sm" onClick={handleMoveToIndex}>
              应用
            </button>
          </div>
        </div>
      )}

      <div className="calc-order-flow-mobile shrink-0 md:hidden">
        <span className="calc-order-flow-mobile__step calc-order-flow-mobile__step--active">1 单品级</span>
        <span className="calc-order-flow-mobile__arrow">→</span>
        <span className="calc-order-flow-mobile__step">2 整单级</span>
      </div>

      <div className="calc-order-stages flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-3">
        <PriorityTypeList
          title="单品级计算阶段"
          phaseLabel={`全局 #${itemPhaseStart} 起`}
          phaseScope={PromoScope.SINGLE_ITEM}
          items={itemLevel}
          isEditing={isEditing}
          selectedIds={selectedIds}
          onToggleSelect={id =>
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          onDragReorder={handleDragReorder}
          showFlowArrow
        />
        <PriorityTypeList
          title="整单级计算阶段"
          phaseLabel={`全局 #${orderPhaseStart} 起`}
          phaseScope={PromoScope.ORDER}
          items={orderLevel}
          isEditing={isEditing}
          selectedIds={selectedIds}
          onToggleSelect={id =>
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (next.has(id)) next.delete(id);
              else next.add(id);
              return next;
            })
          }
          onDragReorder={handleDragReorder}
        />
      </div>

      {changelog.length > 0 && (
        <div className="calc-order-changelog shrink-0 mx-4 mb-3">
          <div className="calc-order-changelog__title">最近变更</div>
          <div className="calc-order-changelog__item">
            <span>{changelog[0].summary}</span>
            <span className="calc-order-changelog__time">
              {changelog[0].at.replace('T', ' ').slice(0, 16)}
            </span>
          </div>
        </div>
      )}

      <div className="calc-order-strategy shrink-0 mx-4 mb-4 bg-white border border-[#e8e8e8] rounded overflow-hidden">
        <div className="p-4 bg-[#fafafa] border-b border-[#e8e8e8] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <MonitorCheck size={16} />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-[#262626] flex items-center gap-2">
                B 端收银顺序
                <span className="text-[11px] bg-[#262626] text-white px-1.5 py-0.5 rounded">POS</span>
              </h3>
              <p className="text-[12px] text-[#8c8c8c] mt-0.5">
                当多种优惠允许叠加时，收银员操作顺序是否影响计算结果。
              </p>
            </div>
          </div>
          {isEditing && (
            <div className="calc-order-strategy__lock">
              <Info size={13} />
              请先保存或取消顺序调整，再切换收银策略
            </div>
          )}
        </div>

        <div className={`p-4 ${isEditing ? 'calc-order-strategy__body--locked' : ''}`}>
          <div className="flex flex-col md:flex-row gap-3">
            <button
              type="button"
              className={`calc-order-strategy-card flex-1 text-left ${
                stackingStrategy === 'STATIC_PRIORITY' ? 'calc-order-strategy-card--active' : ''
              }`}
              disabled={isEditing}
              onClick={() => handleStrategyClick('STATIC_PRIORITY')}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded bg-blue-50 text-brand-600 flex items-center justify-center">
                  <ListOrdered size={16} />
                </div>
                {stackingStrategy === 'STATIC_PRIORITY' && (
                  <span className="calc-order-strategy-card__badge">当前生效</span>
                )}
              </div>
              <h4 className="text-[13px] font-medium text-[#262626]">严格遵循类型优先级（默认）</h4>
              <p className="text-[12px] text-[#8c8c8c] mt-1.5 leading-relaxed">
                无论收银员先录入哪张券，系统都按上方全局序号计算。
              </p>
            </button>

            <button
              type="button"
              className={`calc-order-strategy-card flex-1 text-left ${
                stackingStrategy === 'OPERATION_ORDER' ? 'calc-order-strategy-card--active-purple' : ''
              }`}
              disabled={isEditing}
              onClick={() => handleStrategyClick('OPERATION_ORDER')}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="w-8 h-8 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                  <MousePointerClick size={16} />
                </div>
                {stackingStrategy === 'OPERATION_ORDER' && (
                  <span className="calc-order-strategy-card__badge calc-order-strategy-card__badge--purple">
                    当前生效
                  </span>
                )}
              </div>
              <h4 className="text-[13px] font-medium text-[#262626]">遵循收银添加顺序</h4>
              <p className="text-[12px] text-[#8c8c8c] mt-1.5 leading-relaxed">
                按收银员扫码/点击的先后顺序扣减。
                <span className="text-purple-600"> 录入顺序可能影响实付。</span>
              </p>
              <div className="mt-2.5 text-[11px] text-[#8c8c8c] space-y-1">
                <div className="flex items-center gap-1">
                  <MonitorCheck size={12} className="text-orange-500" /> B 端收银台 · 生效
                </div>
                <div className="flex items-center gap-1 text-[#bfbfbf]">
                  <Smartphone size={12} /> C 端小程序 · 强制类型优先级
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <CalcOrderSaveConfirmModal
        open={saveModalOpen}
        changes={pendingChanges}
        onConfirm={handleConfirmSave}
        onCancel={() => setSaveModalOpen(false)}
      />

      <ModalShell open={resetModalOpen} onClose={() => setResetModalOpen(false)} size="sm">
        <div className="px-5 py-4 border-b border-[#f0f0f0]">
          <h2 className="text-[15px] font-semibold">恢复默认顺序</h2>
          <p className="text-[13px] text-[#8c8c8c] mt-1">将草稿恢复为系统推荐的全局顺序，尚未保存到线上。</p>
        </div>
        <div className="px-5 py-3 flex justify-end gap-2">
          <button type="button" className="btn btn--default" onClick={() => setResetModalOpen(false)}>
            取消
          </button>
          <button type="button" className="btn btn--primary" onClick={handleConfirmReset}>
            恢复默认
          </button>
        </div>
      </ModalShell>

      <StackingStrategyConfirmModal
        open={strategyModalOpen}
        target={pendingStrategy}
        onConfirm={handleConfirmStrategy}
        onCancel={() => {
          setStrategyModalOpen(false);
          setPendingStrategy(null);
        }}
      />
    </div>
  );
};
