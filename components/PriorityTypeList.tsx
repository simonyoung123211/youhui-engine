import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUp, GripVertical } from 'lucide-react';
import { PromoGroup, PromoScope } from '../types';
import { CalcOrderListItem } from '../utils/calcOrderReorder';
import { VirtualList } from './VirtualList';

const ROW_HEIGHT = 48;

function groupTagClass(group: PromoGroup): string {
  const map: Record<PromoGroup, string> = {
    [PromoGroup.MEMBER]: 'promo-group-tag--member',
    [PromoGroup.ACTIVITY]: 'promo-group-tag--activity',
    [PromoGroup.ASSET]: 'promo-group-tag--asset',
    [PromoGroup.POS]: 'promo-group-tag--pos',
    [PromoGroup.PLATFORM]: 'promo-group-tag--platform',
    [PromoGroup.PAYMENT]: 'promo-group-tag--payment',
  };
  return map[group] ?? 'promo-group-tag--activity';
}

interface PriorityTypeListProps {
  title: string;
  phaseLabel: string;
  phaseScope: PromoScope;
  items: CalcOrderListItem[];
  isEditing: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onDragReorder: (fromId: string, toId: string) => void;
  showFlowArrow?: boolean;
  draggingScope?: PromoScope | null;
  onDragScopeChange?: (scope: PromoScope | null) => void;
  onResetItem?: (id: string, defaultGlobalIndex: number) => void;
  onMoveItem?: (id: string, action: 'up' | 'down' | 'top') => void;
  flashId?: string | null;
}

export function PriorityTypeList({
  title,
  phaseLabel,
  phaseScope,
  items,
  isEditing,
  selectedIds,
  onToggleSelect,
  onDragReorder,
  showFlowArrow,
  draggingScope,
  onDragScopeChange,
  onResetItem,
  onMoveItem,
  flashId,
}: PriorityTypeListProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropEdge, setDropEdge] = useState<'before' | 'after' | null>(null);

  const scopeClass =
    phaseScope === PromoScope.SINGLE_ITEM ? 'calc-order-stage--item' : 'calc-order-stage--order';
  const isOtherScopeDragging = !!draggingScope && draggingScope !== phaseScope;

  const clearDropHint = () => {
    setDropTargetId(null);
    setDropEdge(null);
  };

  const header = useMemo(
    () => (
      <div className={`calc-order-stage__header ${scopeClass}`}>
        <span className="calc-order-stage__phase">{phaseLabel}</span>
        <h3 className="calc-order-stage__title">{title}</h3>
        <span className="calc-order-stage__count">{items.length} 项</span>
      </div>
    ),
    [title, phaseLabel, items.length, scopeClass]
  );

  return (
    <div className={`calc-order-stage flex flex-col min-h-0 ${scopeClass} ${isOtherScopeDragging ? 'calc-order-stage--dimmed' : ''}`}>
      {header}
      <div className="calc-order-stage__body flex flex-col flex-1 min-h-[240px] relative">
        {isOtherScopeDragging && (
          <div className="calc-order-stage__cross-hint">
            不可跨计算阶段拖动，单品级与整单级需分别调整
          </div>
        )}
        {items.length === 0 ? (
          <div className="calc-order-stage__empty">无匹配优惠科目</div>
        ) : (
          <VirtualList
            className="flex-1 min-h-0"
            items={items}
            rowHeight={ROW_HEIGHT}
            getItemKey={item => item.id}
            renderItem={(item, index) => {
              const selected = selectedIds.has(item.id);
              const dragging = dragId === item.id;
              const dropBefore = dropTargetId === item.id && dropEdge === 'before';
              const dropAfter = dropTargetId === item.id && dropEdge === 'after';
              const isFirst = index === 0;
              const isLast = index === items.length - 1;

              return (
                  <div
                    className={`calc-order-row ${item.isAdjusted ? 'calc-order-row--adjusted' : ''} ${
                      dragging ? 'calc-order-row--dragging' : ''
                    } ${isEditing ? 'calc-order-row--editable' : ''} ${
                      flashId === item.id ? 'calc-order-row--flash' : ''
                    } ${dropBefore ? 'calc-order-row--drop-before' : ''} ${
                      dropAfter ? 'calc-order-row--drop-after' : ''
                    }`}
                    draggable={isEditing}
                    onDragStart={() => {
                      if (!isEditing) return;
                      setDragId(item.id);
                      onDragScopeChange?.(phaseScope);
                    }}
                    onDragOver={e => {
                      if (!isEditing || !dragId || dragId === item.id) return;
                      e.preventDefault();
                      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                      const edge = e.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
                      setDropTargetId(item.id);
                      setDropEdge(edge);
                    }}
                    onDrop={() => {
                      if (isEditing && dragId && dragId !== item.id) {
                        onDragReorder(dragId, item.id);
                      }
                      setDragId(null);
                      clearDropHint();
                      onDragScopeChange?.(null);
                    }}
                    onDragEnd={() => {
                      setDragId(null);
                      clearDropHint();
                      onDragScopeChange?.(null);
                    }}
                  >
                    {isEditing && (
                      <div
                        className="calc-order-row__check"
                        onClick={e => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onToggleSelect(item.id)}
                        />
                      </div>
                    )}
                    {isEditing && (
                      <span className="calc-order-row__grip" aria-hidden>
                        <GripVertical size={14} />
                      </span>
                    )}
                    <div
                      className="calc-order-row__index"
                      title={`全局第 ${item.globalIndex} 位 · 本阶段第 ${item.phaseIndex} 位`}
                    >
                      {item.phaseIndex}
                    </div>
                    <div className="calc-order-row__main min-w-0">
                      <div className="calc-order-row__top">
                        <span className="calc-order-row__name" title={item.category.name}>
                          {item.category.name}
                        </span>
                        <span className={`promo-group-tag ${groupTagClass(item.category.group)}`}>
                          {item.category.group}
                        </span>
                        {item.isAdjusted && (
                          <span
                            className="calc-order-row__adjusted-tag"
                            title={`相对系统默认已偏离（默认本阶段第 ${item.defaultPhaseIndex} 位）`}
                          >
                            已调整
                          </span>
                        )}
                      </div>
                      {isEditing && item.isAdjusted && onResetItem && (
                        <div className="calc-order-row__meta">
                          <button
                            type="button"
                            className="calc-order-row__reset-btn calc-order-row__reset-btn--visible"
                            onClick={e => {
                              e.stopPropagation();
                              onResetItem(item.id, item.defaultGlobalIndex);
                            }}
                          >
                            默认本阶段第 {item.defaultPhaseIndex} 位 · 恢复
                          </button>
                        </div>
                      )}
                    </div>
                    {isEditing && onMoveItem && (
                      <div
                        className="calc-order-row__actions"
                        onClick={e => e.stopPropagation()}
                        onMouseDown={e => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="calc-order-row__icon-btn"
                          title="置顶"
                          disabled={isFirst}
                          onClick={() => onMoveItem(item.id, 'top')}
                        >
                          <ChevronsUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="calc-order-row__icon-btn"
                          title="上移"
                          disabled={isFirst}
                          onClick={() => onMoveItem(item.id, 'up')}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="calc-order-row__icon-btn"
                          title="下移"
                          disabled={isLast}
                          onClick={() => onMoveItem(item.id, 'down')}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                    )}
                  </div>
              );
            }}
          />
        )}
        {showFlowArrow && (
          <div className="calc-order-flow-arrow hidden md:flex" aria-hidden>
            <span>→</span>
          </div>
        )}
      </div>
    </div>
  );
}
