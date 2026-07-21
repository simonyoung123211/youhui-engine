import React, { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PromotionCategory, PromoInstance, PromoInstanceStatus } from '../../types';
import { isPosSelectableCategory } from '../../data/defaultApplicationStrategy';
import { ActivityPickerModal } from './ActivityPickerModal';

interface ActivityScopeTableProps {
  selectedIds: string[];
  categories: PromotionCategory[];
  instances: PromoInstance[];
  onChange: (ids: string[]) => void;
  readOnly?: boolean;
}

const STATUS_LABEL: Record<PromoInstanceStatus | 'ENABLED', string> = {
  ENABLED: '进行中',
  DISABLED: '已停用',
  EXPIRED: '已过期',
  PENDING: '未开始',
};

function statusLabel(status?: PromoInstanceStatus): string {
  return STATUS_LABEL[status ?? 'ENABLED'];
}

export function ActivityScopeTable({
  selectedIds,
  categories,
  instances,
  onChange,
  readOnly = false,
}: ActivityScopeTableProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const categoryMap = useMemo(() => {
    const map = new Map<string, PromotionCategory>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const instanceMap = useMemo(() => {
    const map = new Map<string, PromoInstance>();
    instances.forEach(i => map.set(i.id, i));
    return map;
  }, [instances]);

  const rows = selectedIds
    .map(id => instanceMap.get(id))
    .filter((i): i is PromoInstance => Boolean(i));

  const remove = (id: string) => {
    onChange(selectedIds.filter(x => x !== id));
  };

  const addIds = (ids: string[]) => {
    const merged = [...selectedIds];
    ids.forEach(id => {
      if (!merged.includes(id)) merged.push(id);
    });
    onChange(merged);
  };

  return (
    <div className="strategy-activity-table-wrap">
      <div className="strategy-activity-table__toolbar">
        <span className="strategy-activity-table__count">共 {rows.length} 个活动</span>
        {!readOnly && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => setPickerOpen(true)}>
            <Plus size={14} className="inline mr-1" aria-hidden />
            添加活动
          </button>
        )}
      </div>

      <div className="strategy-activity-table">
        <div className="strategy-activity-table__head">
          <span>活动类型</span>
          <span>活动名称</span>
          <span>活动 ID</span>
          <span>活动状态</span>
          <span>操作</span>
        </div>
        {rows.length === 0 ? (
          <div className="strategy-activity-table__empty">暂无数据</div>
        ) : (
          rows.map(row => {
            const cat = categoryMap.get(row.categoryId);
            return (
              <div key={row.id} className="strategy-activity-table__row">
                <span className="truncate" title={cat?.name}>
                  {cat?.name ?? '—'}
                </span>
                <span className="truncate" title={row.name}>
                  {row.name}
                </span>
                <span className="font-mono text-[12px] text-[#8c8c8c] truncate" title={row.id}>
                  {row.id}
                </span>
                <span>{statusLabel(row.status)}</span>
                <span>
                  {!readOnly && (
                    <button
                      type="button"
                      className="strategy-activity-table__remove"
                      onClick={() => remove(row.id)}
                      title="移除"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>

      <ActivityPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        categories={categories}
        instances={instances.filter(i => {
          const cat = categoryMap.get(i.categoryId);
          return cat && isPosSelectableCategory(cat);
        })}
        selectedIds={selectedIds}
        onConfirm={addIds}
      />
    </div>
  );
}
