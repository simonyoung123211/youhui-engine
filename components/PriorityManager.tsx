import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../styles/admin.css';
import {
  PromotionCategory,
  PromoScope,
  getDefaultPriority,
  CALC_ORDER_EXCLUDED_GROUPS,
} from '../types';
import { PriorityListChrome } from './PriorityListChrome';
import { PriorityTypeList } from './PriorityTypeList';
import { CalcOrderSaveConfirmModal } from './CalcOrderSaveConfirmModal';
import { CalcOrderGuideModal } from './CalcOrderGuideModal';
import {
  StackingStrategyConfirmModal,
  StackingStrategy,
} from './StackingStrategyConfirmModal';
import { StackingStrategyModal } from './StackingStrategyModal';
import { ModalShell } from './ModalShell';
import {
  areCalcOrderListsEqual,
  buildCalcOrderItems,
  computeCalcOrderChanges,
  detectNewCategoryIds,
  normalizeCalcOrderByScope,
  moveCalcOrderByOffset,
  moveCalcOrderToBottom,
  moveCalcOrderToIndex,
  moveCalcOrderToTop,
  reorderCalcOrderByDrag,
  splitByScope,
  summarizeCalcOrderChanges,
} from '../utils/calcOrderReorder';
import {
  appendCalcOrderChangelog,
  loadCalcOrderChangelog,
  loadKnownCategoryIds,
  saveKnownCategoryIds,
  CalcOrderChangeLogEntry,
} from '../utils/calcOrderChangelog';

interface PriorityManagerProps {
  categories: PromotionCategory[];
  priorityList: string[];
  setPriorityList: (list: string[]) => void;
  stackingStrategy: StackingStrategy;
  setStackingStrategy: (strategy: StackingStrategy) => void;
  onSave?: () => void;
  onToast?: (message: string) => void;
}

export const PriorityManager: React.FC<PriorityManagerProps> = ({
  categories,
  priorityList,
  setPriorityList,
  stackingStrategy,
  setStackingStrategy,
  onSave,
  onToast,
}) => {
  // 支付方式等分组不参与计算顺序配置
  const calcCategories = useMemo(
    () => categories.filter(c => !CALC_ORDER_EXCLUDED_GROUPS.includes(c.group)),
    [categories]
  );
  const defaultList = useMemo(() => getDefaultPriority(calcCategories), [calcCategories]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftList, setDraftList] = useState<string[]>(priorityList);
  const [savedSnapshot, setSavedSnapshot] = useState<string[]>(priorityList);

  const [strategyPickerOpen, setStrategyPickerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetIndexInput, setTargetIndexInput] = useState('1');
  const [batchMoreOpen, setBatchMoreOpen] = useState(false);
  const [draggingScope, setDraggingScope] = useState<PromoScope | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [pendingStrategy, setPendingStrategy] = useState<StackingStrategy | null>(null);
  const [newCategoryNotice, setNewCategoryNotice] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<CalcOrderChangeLogEntry[]>(() =>
    loadCalcOrderChangelog()
  );

  useEffect(() => {
    if (!isEditing) setDraftList(priorityList);
  }, [priorityList, isEditing]);

  useEffect(() => {
    const known = loadKnownCategoryIds();
    const allIds = calcCategories.map(c => c.id);
    const newlyAdded = detectNewCategoryIds(calcCategories, known);
    if (known && newlyAdded.length > 0) {
      setNewCategoryNotice(
        `系统新增 ${newlyAdded.length} 个优惠科目，已暂时追加到顺序末尾，请按默认位置核对。`
      );
    }
    saveKnownCategoryIds(allIds);
  }, [calcCategories]);

  const activeList = isEditing ? draftList : priorityList;

  const allItems = useMemo(
    () => buildCalcOrderItems(activeList, calcCategories, defaultList),
    [activeList, calcCategories, defaultList]
  );

  const { itemLevel, orderLevel } = useMemo(() => splitByScope(allItems), [allItems]);

  const hasDraftChanges = useMemo(
    () => !areCalcOrderListsEqual(draftList, savedSnapshot),
    [draftList, savedSnapshot]
  );

  const pendingChanges = useMemo(
    () => computeCalcOrderChanges(savedSnapshot, draftList, calcCategories),
    [savedSnapshot, draftList, calcCategories]
  );

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

  const flashMoved = (id: string) => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setFlashId(id);
    flashTimerRef.current = setTimeout(() => setFlashId(null), 900);
  };

  useEffect(
    () => () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    },
    []
  );

  const discardEdit = () => {
    setDraftList([...priorityList]);
    setSelectedIds(new Set());
    setIsEditing(false);
    setCancelModalOpen(false);
    setBatchMoreOpen(false);
  };

  const handleCancelEdit = () => {
    if (hasDraftChanges) {
      setCancelModalOpen(true);
      return;
    }
    discardEdit();
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
    const { primary, cascading } = summarizeCalcOrderChanges(changes);
    const summary =
      primary.length === 1 && cascading.length > 0
        ? `主要调整「${primary[0].name}」，另有 ${cascading.length} 项顺带变动`
        : `调整 ${primary.length || changes.length} 个优惠科目计算顺序`;
    appendCalcOrderChangelog({
      operator: '当前用户',
      summary,
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
    const result = reorderCalcOrderByDrag(draftList, fromId, toId, calcCategories);
    if (result.rejected === 'CROSS_SCOPE') {
      showToast('不可跨计算阶段拖动，单品级与整单级需分别调整');
      return;
    }
    setDraftList(result.list);
    flashMoved(fromId);
  };

  const handleMoveItem = (id: string, action: 'up' | 'down' | 'top') => {
    updateDraft(list => {
      if (action === 'top') return moveCalcOrderToTop(list, [id], calcCategories);
      if (action === 'up') return moveCalcOrderByOffset(list, [id], -1, calcCategories);
      return moveCalcOrderByOffset(list, [id], 1, calcCategories);
    });
    flashMoved(id);
  };

  const updateDraft = (updater: (list: string[]) => string[]) => {
    setDraftList(prev => normalizeCalcOrderByScope(updater(prev), calcCategories));
  };

  const selectedIdList = useMemo(() => [...selectedIds], [selectedIds]);

  const applyBatchMove = (fn: (list: string[], ids: string[]) => string[]) => {
    if (!selectedIdList.length) {
      showToast('请先勾选要移动的优惠科目');
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
    applyBatchMove((list, ids) => moveCalcOrderToIndex(list, ids, n - 1, calcCategories));
  };

  const handleResetItem = (id: string, defaultGlobalIndex: number) => {
    updateDraft(list => moveCalcOrderToIndex(list, [id], Math.max(0, defaultGlobalIndex - 1), calcCategories));
    flashMoved(id);
  };

  const handleOpenStrategy = () => {
    if (isEditing) return;
    setStrategyPickerOpen(true);
  };

  const handlePickStrategy = (next: StackingStrategy) => {
    setStrategyPickerOpen(false);
    if (isEditing || next === stackingStrategy) return;
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
        ? '已切换为按录入先后（仅企迈 POS）'
        : '已切换为按计算顺序'
    );
  };

  return (
    <div className="page-card page-card--list calc-order-page h-full flex flex-col overflow-hidden">
      <PriorityListChrome
        isEditing={isEditing}
        onStartEdit={handleStartEdit}
        onCancelEdit={handleCancelEdit}
        onRequestSave={handleRequestSave}
        onResetDefault={handleResetDefault}
        onOpenCalcGuide={() => setGuideOpen(true)}
        newCategoryNotice={newCategoryNotice}
        stackingStrategy={stackingStrategy}
        onOpenStrategy={handleOpenStrategy}
      />

      {isEditing && (
        <div className="calc-order-edit-banner shrink-0">
          <span>
            {selectedIdList.length === 0
              ? '编辑模式：可用行内上移/下移/置顶，或拖拽、勾选后批量移动。保存前将二次确认。'
              : `已选 ${selectedIdList.length} 项，可批量移动。保存前将二次确认。`}
          </span>
        </div>
      )}

      {isEditing && selectedIdList.length > 0 && (
        <div className="calc-order-batch-bar shrink-0">
          <span className="calc-order-batch-bar__label">已选 {selectedIds.size} 项</span>
          <button
            type="button"
            className="btn btn--default btn--sm"
            onClick={() => applyBatchMove((list, ids) => moveCalcOrderToTop(list, ids, calcCategories))}
          >
            移至顶
          </button>
          <button
            type="button"
            className="btn btn--default btn--sm"
            onClick={() => applyBatchMove((list, ids) => moveCalcOrderByOffset(list, ids, -1, calcCategories))}
          >
            上移
          </button>
          <button
            type="button"
            className="btn btn--default btn--sm"
            onClick={() => applyBatchMove((list, ids) => moveCalcOrderByOffset(list, ids, 1, calcCategories))}
          >
            下移
          </button>
          <button
            type="button"
            className="btn btn--default btn--sm"
            onClick={() => applyBatchMove((list, ids) => moveCalcOrderToBottom(list, ids, calcCategories))}
          >
            移至底
          </button>
          <button
            type="button"
            className={`btn btn--default btn--sm ${batchMoreOpen ? 'is-active' : ''}`}
            onClick={() => setBatchMoreOpen(v => !v)}
          >
            更多
          </button>
          {batchMoreOpen && (
            <div className="calc-order-batch-bar__index">
              <label htmlFor="co-target-idx">移至全局序号</label>
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
          )}
        </div>
      )}

      <div className="calc-order-flow-hint shrink-0">
        <span>先算左边单品科目，再算右边整单科目</span>
      </div>

      <div className="calc-order-flow-mobile shrink-0 md:hidden">
        <span className="calc-order-flow-mobile__step calc-order-flow-mobile__step--active">1 单品级</span>
        <span className="calc-order-flow-mobile__arrow">→</span>
        <span className="calc-order-flow-mobile__step">2 整单级</span>
      </div>

      <div className="calc-order-stages flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-3 px-4 pb-3">
        <PriorityTypeList
          title="单品级"
          phaseLabel="本阶段排序 · 先算"
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
          draggingScope={draggingScope}
          onDragScopeChange={setDraggingScope}
          onResetItem={handleResetItem}
          onMoveItem={handleMoveItem}
          flashId={flashId}
          showFlowArrow
        />
        <PriorityTypeList
          title="整单级"
          phaseLabel="本阶段排序 · 后算"
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
          draggingScope={draggingScope}
          onDragScopeChange={setDraggingScope}
          onResetItem={handleResetItem}
          onMoveItem={handleMoveItem}
          flashId={flashId}
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

      <CalcOrderGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      <StackingStrategyModal
        open={strategyPickerOpen}
        current={stackingStrategy}
        locked={isEditing}
        onClose={() => setStrategyPickerOpen(false)}
        onPick={handlePickStrategy}
      />

      <CalcOrderSaveConfirmModal
        open={saveModalOpen}
        changes={pendingChanges}
        onConfirm={handleConfirmSave}
        onCancel={() => setSaveModalOpen(false)}
      />

      <ModalShell open={resetModalOpen} onClose={() => setResetModalOpen(false)} size="sm">
        <div className="px-5 py-4 border-b border-[#f0f0f0]">
          <h2 className="text-[15px] font-semibold">恢复默认顺序</h2>
          <p className="text-[13px] text-[#8c8c8c] mt-1">将草稿恢复为系统推荐顺序，尚未保存到线上。</p>
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

      <ModalShell open={cancelModalOpen} onClose={() => setCancelModalOpen(false)} size="sm">
        <div className="px-5 py-4 border-b border-[#f0f0f0]">
          <h2 className="text-[15px] font-semibold">放弃未保存的调整？</h2>
          <p className="text-[13px] text-[#8c8c8c] mt-1">当前顺序尚未保存，退出编辑后将恢复为上次已保存版本。</p>
        </div>
        <div className="px-5 py-3 flex justify-end gap-2">
          <button type="button" className="btn btn--default" onClick={() => setCancelModalOpen(false)}>
            继续编辑
          </button>
          <button type="button" className="btn btn--primary" onClick={discardEdit}>
            放弃调整
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
