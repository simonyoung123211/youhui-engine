import React, { useMemo, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { PromotionCategory, PromoGroup, PromoInstance, RuleMember } from '../types';
import { ModalShell } from './ModalShell';
import { PickerQuickSearch } from './PickerQuickSearch';
import { PROMO_GROUP_ORDER } from '../types';

function toTypeMember(cat: PromotionCategory): RuleMember {
  return { refType: 'TYPE', refId: cat.id, refName: cat.name };
}

function toInstanceMember(inst: PromoInstance): RuleMember {
  return { refType: 'INSTANCE', refId: inst.id, refName: inst.name };
}

interface PromoSinglePickerProps {
  label: string;
  value: RuleMember | null;
  categories: PromotionCategory[];
  instances: PromoInstance[];
  onChange: (member: RuleMember | null) => void;
  placeholder?: string;
}

export function PromoSinglePicker({
  label,
  value,
  categories,
  instances,
  onChange,
  placeholder = '点击选择优惠类型或活动实例',
}: PromoSinglePickerProps) {
  const [open, setOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState<'ALL' | PromoGroup>('ALL');

  const groupedCategories = useMemo(() => {
    const map = new Map<PromoGroup, PromotionCategory[]>();
    for (const cat of categories) {
      const list = map.get(cat.group) ?? [];
      list.push(cat);
      map.set(cat.group, list);
    }
    return PROMO_GROUP_ORDER.map(group => ({ group, items: map.get(group) ?? [] })).filter(
      g => g.items.length > 0
    );
  }, [categories]);

  const visibleGroups = useMemo(() => {
    if (groupFilter === 'ALL') return groupedCategories;
    return groupedCategories.filter(g => g.group === groupFilter);
  }, [groupedCategories, groupFilter]);

  const selectMember = (member: RuleMember) => {
    onChange(member);
    setOpen(false);
  };

  return (
    <>
      <div className="border border-[#e8e8e8] rounded bg-white min-h-[72px] flex flex-col">
        <div className="px-3 py-2 border-b border-[#f0f0f0] text-[12px] font-medium text-[#595959]">
          {label}
        </div>
        {value ? (
          <div className="px-3 py-2.5 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[13px] font-medium text-[#262626] truncate">{value.refName}</div>
              <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                {value.refType === 'TYPE' ? '优惠类型' : '活动实例'}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#8c8c8c]"
                onClick={() => setOpen(true)}
                title="重新选择"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#8c8c8c]"
                onClick={() => onChange(null)}
                title="清除"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 px-3 py-4 text-[12px] text-[#bfbfbf] hover:text-brand-600 hover:bg-[#fafafa] transition-colors text-left"
          >
            {placeholder}
          </button>
        )}
      </div>

      <ModalShell open={open} onClose={() => setOpen(false)} size="md" zIndex={70}>
        <div className="px-4 py-3 border-b border-[#e8e8e8] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold text-[#262626]">{label}</h3>
            <p className="text-[12px] text-[#8c8c8c] mt-0.5">选择 1 个优惠类型或活动实例</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="p-1.5 hover:bg-[#f0f0f0] rounded">
            <X size={18} className="text-[#8c8c8c]" />
          </button>
        </div>

        <div className="p-4 border-b border-[#f0f0f0] space-y-2 shrink-0">
          <PickerQuickSearch
            categories={categories}
            instances={instances}
            groupFilter={groupFilter}
            onSelectType={cat => selectMember(toTypeMember(cat))}
            onSelectInstance={(inst) => selectMember(toInstanceMember(inst))}
          />
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setGroupFilter('ALL')}
              className={`px-2 py-0.5 rounded text-[11px] ${
                groupFilter === 'ALL' ? 'bg-brand-500 text-white' : 'bg-[#f5f5f5] text-[#595959]'
              }`}
            >
              全部
            </button>
            {PROMO_GROUP_ORDER.map(group => (
              <button
                key={group}
                type="button"
                onClick={() => setGroupFilter(group)}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  groupFilter === group ? 'bg-brand-500 text-white' : 'bg-[#f5f5f5] text-[#595959]'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 min-h-0 max-h-[360px]">
          {visibleGroups.map(({ group, items }) => (
            <div key={group} className="mb-3">
              <div className="px-2 py-1 text-[11px] font-medium text-[#8c8c8c]">{group}</div>
              <div className="space-y-0.5">
                {items.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectMember(toTypeMember(cat))}
                    className="w-full text-left px-3 py-2 rounded text-[13px] hover:bg-[#fafafa] text-[#262626]"
                  >
                    {cat.name}
                    <span className="ml-2 text-[10px] text-[#bfbfbf]">类型</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ModalShell>
    </>
  );
}

interface PromoMultiPickerProps {
  label: string;
  value: RuleMember[];
  categories: PromotionCategory[];
  instances: PromoInstance[];
  onChange: (members: RuleMember[]) => void;
  maxItems?: number;
}

export function PromoMultiPicker({
  label,
  value,
  categories,
  instances,
  onChange,
  maxItems = 8,
}: PromoMultiPickerProps) {
  const [open, setOpen] = useState(false);
  const [groupFilter, setGroupFilter] = useState<'ALL' | PromoGroup>('ALL');

  const addMember = (member: RuleMember) => {
    if (value.some(v => v.refId === member.refId)) {
      setOpen(false);
      return;
    }
    if (value.length >= maxItems) return;
    onChange([...value, member]);
    setOpen(false);
  };

  return (
    <div className="border border-[#e8e8e8] rounded bg-white">
      <div className="px-3 py-2 border-b border-[#f0f0f0] flex items-center justify-between gap-2">
        <div>
          <div className="text-[12px] font-medium text-[#595959]">{label}</div>
          <div className="text-[11px] text-[#8c8c8c] mt-0.5">
            已选 {value.length} 个 · 将试算全部两两关系对
          </div>
        </div>
        <button
          type="button"
          className="btn btn--default btn--sm"
          disabled={value.length >= maxItems}
          onClick={() => setOpen(true)}
        >
          添加对象
        </button>
      </div>
      {value.length > 0 ? (
        <div className="px-3 py-2.5 flex flex-wrap gap-1.5">
          {value.map(m => (
            <span
              key={m.refId}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border bg-brand-50 text-brand-700 border-brand-200"
            >
              {m.refName}
              <button
                type="button"
                className="hover:text-rose-500"
                onClick={() => onChange(value.filter(v => v.refId !== m.refId))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-[12px] text-[#bfbfbf]">添加至少 2 个优惠对象以模拟整单关系</div>
      )}

      <ModalShell open={open} onClose={() => setOpen(false)} size="md" zIndex={70}>
        <div className="px-4 py-3 border-b border-[#e8e8e8] flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-[15px] font-semibold text-[#262626]">添加整单对象</h3>
            <p className="text-[12px] text-[#8c8c8c] mt-0.5">选择要加入整单模拟的优惠对象</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="p-1.5 hover:bg-[#f0f0f0] rounded">
            <X size={18} className="text-[#8c8c8c]" />
          </button>
        </div>
        <div className="p-4 shrink-0">
          <PickerQuickSearch
            categories={categories}
            instances={instances}
            groupFilter={groupFilter}
            onSelectType={cat => addMember(toTypeMember(cat))}
            onSelectInstance={inst => addMember(toInstanceMember(inst))}
          />
        </div>
      </ModalShell>
    </div>
  );
}
