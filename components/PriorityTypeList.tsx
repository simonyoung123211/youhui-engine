import React, { useMemo, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { PromoGroup, PromoScope } from '../types';
import { CalcOrderListItem } from '../utils/calcOrderReorder';
import { VirtualList } from './VirtualList';

const ROW_HEIGHT = 52;

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
}: PriorityTypeListProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const scopeClass =
    phaseScope === PromoScope.SINGLE_ITEM ? 'calc-order-stage--item' : 'calc-order-stage--order';

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
    <div className={`calc-order-stage flex flex-col min-h-0 ${scopeClass}`}>
      {header}
      <div className="calc-order-stage__body flex flex-col flex-1 min-h-[240px] relative">
        {items.length === 0 ? (
          <div className="calc-order-stage__empty">无匹配优惠类型</div>
        ) : (
          <VirtualList
            className="flex-1 min-h-0"
            items={items}
            rowHeight={ROW_HEIGHT}
            getItemKey={item => item.id}
            renderItem={item => {
              const selected = selectedIds.has(item.id);
              const dragging = dragId === item.id;
              return (
                <div
                  className={`calc-order-row ${item.isAdjusted ? 'calc-order-row--adjusted' : ''} ${
                    dragging ? 'calc-order-row--dragging' : ''
                  } ${isEditing ? 'calc-order-row--editable' : ''}`}
                  draggable={isEditing}
                  onDragStart={() => isEditing && setDragId(item.id)}
                  onDragOver={e => isEditing && e.preventDefault()}
                  onDrop={() => {
                    if (isEditing && dragId && dragId !== item.id) {
                      onDragReorder(dragId, item.id);
                    }
                    setDragId(null);
                  }}
                  onDragEnd={() => setDragId(null)}
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
                  <div className="calc-order-row__index" title={`全局序号 ${item.globalIndex}`}>
                    {isEditing ? <GripVertical size={14} /> : item.globalIndex}
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
                        <span className="calc-order-row__adjusted-tag" title={`默认第 ${item.defaultGlobalIndex} 位`}>
                          已调整
                        </span>
                      )}
                    </div>
                    <div className="calc-order-row__desc">{item.category.description}</div>
                  </div>
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
