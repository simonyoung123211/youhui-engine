import React, { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { PromotionCategory, PromoInstance } from '../types';
import { QuickSearchHit, quickSearchPicker } from '../utils/instanceQuery';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

interface PickerQuickSearchProps {
  categories: PromotionCategory[];
  instances: PromoInstance[];
  groupFilter: string;
  onSelectType: (cat: PromotionCategory) => void;
  onSelectInstance: (inst: PromoInstance, cat: PromotionCategory) => void;
}

export const PickerQuickSearch: React.FC<PickerQuickSearchProps> = ({
  categories,
  instances,
  groupFilter,
  onSelectType,
  onSelectInstance,
}) => {
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    types: QuickSearchHit[];
    instances: QuickSearchHit[];
    totalTypes: number;
    totalInstances: number;
  } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(keyword, 200);

  useEffect(() => {
    if (!debounced.trim()) {
      setResult(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    quickSearchPicker(instances, categories, debounced, groupFilter)
      .then(res => {
        if (!cancelled) setResult(res);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, instances, categories, groupFilter]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const showPanel = open && debounced.trim().length > 0;
  const empty = result && result.totalTypes === 0 && result.totalInstances === 0;

  return (
    <div ref={wrapRef} className="relative">
      <Search size={13} className="absolute left-2.5 top-2.5 text-[#bfbfbf] pointer-events-none" />
      <input
        className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e8e8e8] rounded focus:outline-none focus:border-brand-500 bg-white"
        placeholder="快捷搜索：输入类型名或实例名；支付方式等无实例类型仅按类型匹配"
        value={keyword}
        onChange={e => {
          setKeyword(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e8e8e8] rounded-lg shadow-lg z-20 max-h-[280px] overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="px-3 py-3 text-[12px] text-[#8c8c8c]">搜索中…</div>
          )}
          {!loading && empty && (
            <div className="px-3 py-3 text-[12px] text-[#bfbfbf]">无匹配结果</div>
          )}
          {!loading && result && result.totalTypes > 0 && (
            <div className="py-1">
              <div className="px-3 py-1 text-[10px] font-medium text-[#8c8c8c]">
                优惠类型
                {result.totalTypes > result.types.length && ` · 共 ${result.totalTypes} 条`}
              </div>
              {result.types.map(hit => (
                <button
                  key={`type-${hit.category.id}`}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-[#fafafa] flex flex-col"
                  onClick={() => {
                    onSelectType(hit.category);
                    setOpen(false);
                    setKeyword('');
                  }}
                >
                  <span className="text-[13px] text-[#262626] truncate">{hit.label}</span>
                  <span className="text-[10px] text-[#bfbfbf] flex items-center gap-1">
                    {hit.sublabel}
                    {hit.typeOnly && (
                      <span className="text-amber-600 bg-amber-50 px-1 rounded border border-amber-100">
                        仅类型
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          )}
          {!loading && result && result.totalInstances > 0 && (
            <div className="py-1 border-t border-[#f0f0f0]">
              <div className="px-3 py-1 text-[10px] font-medium text-[#8c8c8c]">
                活动实例
                {result.totalInstances > result.instances.length && ` · 共 ${result.totalInstances} 条，请缩小关键词`}
              </div>
              {result.instances.map(hit => (
                <button
                  key={`inst-${hit.instance!.id}`}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-[#fafafa] flex flex-col"
                  onClick={() => {
                    onSelectInstance(hit.instance!, hit.category);
                    setOpen(false);
                    setKeyword('');
                  }}
                >
                  <span className="text-[13px] text-[#262626] truncate">{hit.label}</span>
                  <span className="text-[10px] text-[#bfbfbf] truncate">{hit.sublabel}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
