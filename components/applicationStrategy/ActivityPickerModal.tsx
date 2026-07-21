import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { ModalShell } from '../ModalShell';
import { PromotionCategory, PromoInstance } from '../../types';

interface ActivityPickerModalProps {
  open: boolean;
  onClose: () => void;
  categories: PromotionCategory[];
  instances: PromoInstance[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
}

export function ActivityPickerModal({
  open,
  onClose,
  categories,
  instances,
  selectedIds,
  onConfirm,
}: ActivityPickerModalProps) {
  const [keyword, setKeyword] = useState('');
  const [draft, setDraft] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (open) {
      setKeyword('');
      setDraft(new Set());
    }
  }, [open]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, PromotionCategory>();
    categories.forEach(c => map.set(c.id, c));
    return map;
  }, [categories]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return instances.filter(inst => {
      if (selectedIds.includes(inst.id)) return false;
      if (!q) return true;
      const cat = categoryMap.get(inst.categoryId);
      return (
        inst.name.toLowerCase().includes(q) ||
        inst.id.toLowerCase().includes(q) ||
        (cat?.name.toLowerCase().includes(q) ?? false)
      );
    });
  }, [instances, keyword, selectedIds, categoryMap]);

  const toggle = (id: string) => {
    setDraft(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(draft));
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} size="lg">
      <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-[#262626]">添加活动</h3>
        <button type="button" className="text-[#8c8c8c] hover:text-[#262626] text-xl leading-none" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="px-4 py-3 border-b border-[#f0f0f0]">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#bfbfbf]" />
          <input
            type="search"
            className="w-full h-9 pl-9 pr-3 border border-[#d9d9d9] rounded text-[13px]"
            placeholder="搜索活动名称、ID 或类型"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 max-h-[360px]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[#bfbfbf]">暂无可添加的活动</div>
        ) : (
          <ul className="divide-y divide-[#f0f0f0]">
            {filtered.slice(0, 80).map(inst => {
              const cat = categoryMap.get(inst.categoryId);
              const checked = draft.has(inst.id);
              return (
                <li key={inst.id}>
                  <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#fafafa]">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={checked}
                      onChange={() => toggle(inst.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-[#262626] truncate">{inst.name}</div>
                      <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                        {cat?.name ?? '未知类型'} · {inst.id}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        {filtered.length > 80 && (
          <p className="px-4 py-2 text-[11px] text-[#bfbfbf]">仅展示前 80 条，请使用搜索缩小范围</p>
        )}
      </div>

      <div className="px-4 py-3 border-t border-[#f0f0f0] flex items-center justify-between gap-3">
        <span className="text-[12px] text-[#8c8c8c]">已选 {draft.size} 个</span>
        <div className="flex gap-2">
          <button type="button" className="btn btn--default" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={draft.size === 0}
            onClick={handleConfirm}
          >
            确定添加
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
