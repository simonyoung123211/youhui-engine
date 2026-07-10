import React, { useMemo, useState } from 'react';
import { GripVertical } from 'lucide-react';
import { SpecialRule } from '../types';
import { VirtualList } from './VirtualList';

const ROW_HEIGHT = 56;

interface PriorityRuleListProps {
  rules: SpecialRule[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: (ids: string[]) => void;
  onDragReorder: (fromId: string, toId: string) => void;
}

export function PriorityRuleList({
  rules,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDragReorder,
}: PriorityRuleListProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const visibleIds = useMemo(() => rules.map(r => r.id), [rules]);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some(id => selectedIds.has(id));

  if (rules.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-[#bfbfbf] py-10">
        无匹配规则，请调整筛选条件
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 border border-[#f0f0f0] rounded overflow-hidden bg-white">
      <div className="shrink-0 grid grid-cols-[32px_48px_28px_minmax(0,1fr)_88px_72px] gap-0 bg-[#fafafa] border-b border-[#f0f0f0] text-[12px] font-medium text-[#595959]">
        <div className="flex items-center justify-center py-2.5">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            ref={el => {
              if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
            }}
            onChange={() => onToggleSelectAll(visibleIds)}
          />
        </div>
        <div className="flex items-center px-2 py-2.5">序号</div>
        <div />
        <div className="flex items-center px-2 py-2.5">规则名称</div>
        <div className="flex items-center px-2 py-2.5">关系类型</div>
        <div className="flex items-center px-2 py-2.5">状态</div>
      </div>

      <VirtualList
        className="flex-1 min-h-0"
        items={rules}
        rowHeight={ROW_HEIGHT}
        getItemKey={r => r.id}
        renderItem={rule => {
          const selected = selectedIds.has(rule.id);
          const dragging = dragId === rule.id;
          return (
            <div
              className={`grid grid-cols-[32px_48px_28px_minmax(0,1fr)_88px_72px] items-center border-b border-[#f5f5f5] h-full px-0 ${
                dragging ? 'opacity-50 bg-brand-50' : 'hover:bg-[#fafafa]'
              }`}
              draggable
              onDragStart={() => setDragId(rule.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (dragId && dragId !== rule.id) onDragReorder(dragId, rule.id);
                setDragId(null);
              }}
            >
              <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleSelect(rule.id)}
                />
              </div>
              <div className="px-2 font-mono text-[12px] text-[#595959]">{rule.priority ?? '—'}</div>
              <div className="flex items-center justify-center text-[#bfbfbf] cursor-grab">
                <GripVertical size={14} />
              </div>
              <div className="min-w-0 px-2">
                <div className="text-[13px] text-[#262626] truncate">{rule.name}</div>
                <div className="text-[11px] text-[#bfbfbf] truncate">{rule.id}</div>
              </div>
              <div className="px-2 text-[12px] text-[#595959] truncate">
                {rule.relationScope === 'INTRA_GROUP' ? '组内' : '组间'}
              </div>
              <div className="px-2">
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded border ${
                    rule.status === 'ENABLED'
                      ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]'
                      : 'bg-[#f5f5f5] text-[#8c8c8c] border-[#e8e8e8]'
                  }`}
                >
                  {rule.status === 'ENABLED' ? '已启用' : '已停用'}
                </span>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
