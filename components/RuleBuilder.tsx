import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  PromotionCategory,
  InteractionType,
  RuleMatrix,
  PromoGroup,
  PromoScope,
  PROMO_GROUP_ORDER,
  SINGLETON_PROMO_GROUPS,
} from '../types';
import {
  Pencil,
  Save,
  BookOpen,
  Filter,
  Search,
  LayoutList,
  Grid3x3,
  ChevronDown,
  ChevronRight,
  Box,
  ListTree,
  List,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { RuleGuide } from './RuleGuide';
import { MatrixCell } from './MatrixCell';
import { CategoryBadge, CategoryLabel } from './CategoryBadge';
import { MatrixLegend } from './MatrixLegend';

const GROUP_TABS: { id: 'ALL' | PromoGroup; label: string }[] = [
  { id: 'ALL', label: '全部' },
  ...PROMO_GROUP_ORDER.map(group => ({ id: group, label: group })),
];

const GROUP_ORDER = PROMO_GROUP_ORDER;

type ViewMode = 'list' | 'matrix';
type LeftPanelMode = 'flat' | 'group';
type TargetStatusFilter = 'ALL' | InteractionType;

interface RuleBuilderProps {
  categories: PromotionCategory[];
  matrix: RuleMatrix;
  onChange: (rowId: string, colId: string, val: InteractionType) => void;
  onSave?: () => void;
}

function isNoConfigCell(source: PromotionCategory, target: PromotionCategory): boolean {
  return source.id === target.id && SINGLETON_PROMO_GROUPS.includes(source.group);
}

function renderRuleBadge(value: InteractionType) {
  switch (value) {
    case InteractionType.ALLOW:
      return <span className="text-brand-600">共享且叠加</span>;
    case InteractionType.ITEM_MUTEX:
      return <span className="text-amber-600">共享不叠加</span>;
    default:
      return <span className="text-rose-600">完全互斥</span>;
  }
}

export const RuleBuilder: React.FC<RuleBuilderProps> = ({ categories, matrix, onChange, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [leftPanelMode, setLeftPanelMode] = useState<LeftPanelMode>('group');
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | PromoGroup>('ALL');
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(() => categories[0]?.id ?? null);
  const [expandedGroups, setExpandedGroups] = useState<Set<PromoGroup>>(new Set(GROUP_ORDER));
  const [targetSearch, setTargetSearch] = useState('');
  const [targetStatusFilter, setTargetStatusFilter] = useState<TargetStatusFilter>('ALL');
  const [targetGroupFilter, setTargetGroupFilter] = useState<'ALL' | PromoGroup>('ALL');
  const [expandedTargetGroups, setExpandedTargetGroups] = useState<Set<PromoGroup>>(new Set(GROUP_ORDER));
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
  const editBackupRef = useRef<RuleMatrix | null>(null);

  const filteredCategories = useMemo(() => {
    let list = categories;
    if (groupFilter !== 'ALL') {
      list = list.filter(c => c.group === groupFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.group.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [categories, searchTerm, groupFilter]);

  const groupedCategories = useMemo(() => {
    const map = new Map<PromoGroup, PromotionCategory[]>();
    GROUP_ORDER.forEach(g => map.set(g, []));
    filteredCategories.forEach(cat => {
      const list = map.get(cat.group) ?? [];
      list.push(cat);
      map.set(cat.group, list);
    });
    return GROUP_ORDER.map(g => ({ group: g, items: map.get(g) ?? [] })).filter(g => g.items.length > 0);
  }, [filteredCategories]);

  useEffect(() => {
    if (searchTerm.trim() || groupFilter !== 'ALL') {
      setExpandedGroups(new Set(GROUP_ORDER));
    }
  }, [searchTerm, groupFilter]);

  useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedSourceId(null);
      return;
    }
    if (!selectedSourceId || !filteredCategories.some(c => c.id === selectedSourceId)) {
      setSelectedSourceId(filteredCategories[0].id);
    }
  }, [filteredCategories, selectedSourceId]);

  useEffect(() => {
    setSelectedTargetIds(new Set());
    setTargetSearch('');
    setTargetStatusFilter('ALL');
    setTargetGroupFilter('ALL');
    setExpandedTargetGroups(new Set(GROUP_ORDER));
  }, [selectedSourceId]);

  useEffect(() => {
    if (targetSearch.trim() || targetStatusFilter !== 'ALL' || targetGroupFilter !== 'ALL') {
      setExpandedTargetGroups(new Set(GROUP_ORDER));
    }
  }, [targetSearch, targetStatusFilter, targetGroupFilter]);

  useEffect(() => {
    if (viewMode === 'matrix') {
      setIsEditing(false);
      setSelectedTargetIds(new Set());
    }
  }, [viewMode]);

  const selectedSource = useMemo(
    () => categories.find(c => c.id === selectedSourceId) ?? null,
    [categories, selectedSourceId]
  );

  const getRuleValue = (sourceId: string, targetId: string): InteractionType => {
    return matrix[sourceId]?.[targetId] ?? InteractionType.MUTEX;
  };

  const handleBatchChange = (sourceId: string, targetIds: string[], val: InteractionType) => {
    targetIds.forEach(targetId => onChange(sourceId, targetId, val));
  };

  const targetListData = useMemo(() => {
    if (!selectedSource) return { itemTargets: [] as PromotionCategory[], orderTargets: [] as PromotionCategory[] };

    const matchesFilter = (target: PromotionCategory) => {
      if (isNoConfigCell(selectedSource, target)) return false;

      if (targetSearch.trim()) {
        const q = targetSearch.trim().toLowerCase();
        const match =
          target.name.toLowerCase().includes(q) ||
          target.group.toLowerCase().includes(q) ||
          target.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (targetStatusFilter !== 'ALL') {
        const value = getRuleValue(selectedSource.id, target.id);
        if (value !== targetStatusFilter) return false;
      }

      if (targetGroupFilter !== 'ALL' && target.group !== targetGroupFilter) return false;

      return true;
    };

    const visible = categories.filter(matchesFilter);
    return {
      itemTargets: visible.filter(c => c.defaultScope === PromoScope.SINGLE_ITEM),
      orderTargets: visible.filter(c => c.defaultScope !== PromoScope.SINGLE_ITEM),
    };
  }, [selectedSource, categories, matrix, targetSearch, targetStatusFilter, targetGroupFilter]);

  const handleSave = () => {
    setIsEditing(false);
    setSelectedTargetIds(new Set());
    editBackupRef.current = null;
    onSave?.();
  };

  const handleStartEdit = () => {
    editBackupRef.current = matrix;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    const backup = editBackupRef.current;
    if (backup) {
      categories.forEach(row => {
        categories.forEach(col => {
          const current = matrix[row.id]?.[col.id];
          const original = backup[row.id]?.[col.id];
          if (current !== original && original !== undefined) {
            onChange(row.id, col.id, original);
          }
        });
      });
    }
    setIsEditing(false);
    setSelectedTargetIds(new Set());
    editBackupRef.current = null;
  };

  const toggleGroup = (group: PromoGroup) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  const toggleTargetGroup = (group: PromoGroup) => {
    const next = new Set(expandedTargetGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedTargetGroups(next);
  };

  const toggleTargetSelection = (id: string) => {
    const next = new Set(selectedTargetIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTargetIds(next);
  };

  const toggleSectionSelection = (targets: PromotionCategory[]) => {
    const ids = targets.map(t => t.id);
    const allSelected = ids.every(id => selectedTargetIds.has(id));
    const next = new Set(selectedTargetIds);
    if (allSelected) ids.forEach(id => next.delete(id));
    else ids.forEach(id => next.add(id));
    setSelectedTargetIds(next);
  };

  const renderSourceItem = (cat: PromotionCategory) => {
    const isActive = selectedSourceId === cat.id;
    return (
      <button
        key={cat.id}
        onClick={() => setSelectedSourceId(cat.id)}
        className={`w-full text-left px-3 py-2 rounded text-[13px] flex items-center justify-between gap-2 transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700 font-medium' : 'text-[#262626] hover:bg-[#f5f5f5]'
        }`}
      >
        <span className="truncate">{cat.name}</span>
        <CategoryBadge category={cat} />
      </button>
    );
  };

  const renderRuleActions = (
    sourceId: string,
    targetId: string,
    sourceScope: PromoScope,
    targetScope: PromoScope,
    currentValue: InteractionType
  ) => {
    const showItemMutex = sourceScope === PromoScope.SINGLE_ITEM && targetScope === PromoScope.SINGLE_ITEM;
    const btnBase = 'px-2 py-0.5 rounded border text-[12px] transition-colors';
    const disabledCls = !isEditing ? 'opacity-40 pointer-events-none' : '';

    return (
      <div className={`flex justify-end gap-1 flex-wrap ${disabledCls}`}>
        <button
          onClick={() => onChange(sourceId, targetId, InteractionType.ALLOW)}
          className={`${btnBase} ${
            currentValue === InteractionType.ALLOW
              ? 'bg-brand-500 text-white border-brand-500'
              : 'text-[#595959] hover:border-brand-400 hover:text-brand-600 border-[#d9d9d9]'
          }`}
        >
          同享
        </button>
        {showItemMutex && (
          <button
            onClick={() => onChange(sourceId, targetId, InteractionType.ITEM_MUTEX)}
            className={`${btnBase} ${
              currentValue === InteractionType.ITEM_MUTEX
                ? 'bg-amber-500 text-white border-amber-500'
                : 'text-[#595959] hover:border-amber-400 hover:text-amber-600 border-[#d9d9d9]'
            }`}
          >
            共享不叠加
          </button>
        )}
        <button
          onClick={() => onChange(sourceId, targetId, InteractionType.MUTEX)}
          className={`${btnBase} ${
            currentValue === InteractionType.MUTEX
              ? 'bg-rose-500 text-white border-rose-500'
              : 'text-[#595959] hover:border-rose-400 hover:text-rose-600 border-[#d9d9d9]'
          }`}
        >
          互斥
        </button>
      </div>
    );
  };

  const renderTargetRows = (targets: PromotionCategory[]) =>
    targets.map(target => {
      const value = selectedSource ? getRuleValue(selectedSource.id, target.id) : InteractionType.MUTEX;
      const isSelf = selectedSource?.id === target.id;

      return (
        <tr key={target.id} className={`hover:bg-[#fafafa] ${isSelf ? 'bg-brand-50/40' : ''}`}>
          {isEditing && (
            <td className="px-3 py-2.5">
              <button
                onClick={() => toggleTargetSelection(target.id)}
                className="text-[#bfbfbf] hover:text-brand-600"
              >
                {selectedTargetIds.has(target.id) ? (
                  <CheckSquare size={13} className="text-brand-600" />
                ) : (
                  <Square size={13} />
                )}
              </button>
            </td>
          )}
          <td className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[#262626]">{target.name}</span>
              <CategoryBadge category={target} />
              {isSelf && <span className="text-[11px] text-brand-600">同类</span>}
            </div>
          </td>
          <td className="px-4 py-2.5 text-center">{renderRuleBadge(value)}</td>
          <td className="px-4 py-2.5">
            {selectedSource &&
              renderRuleActions(
                selectedSource.id,
                target.id,
                selectedSource.defaultScope,
                target.defaultScope,
                value
              )}
          </td>
        </tr>
      );
    });

  const renderTargetSection = (
    title: string,
    icon: React.ElementType,
    targets: PromotionCategory[],
    sectionScope: PromoScope
  ) => {
    if (targets.length === 0) return null;

    const Icon = icon;
    const showItemMutexBtn = sectionScope === PromoScope.SINGLE_ITEM;
    const sectionIds = targets.map(t => t.id);
    const allSelected = sectionIds.length > 0 && sectionIds.every(id => selectedTargetIds.has(id));
    const someSelected = sectionIds.some(id => selectedTargetIds.has(id));

    const groupedTargets = GROUP_ORDER.map(group => ({
      group,
      items: targets.filter(t => t.group === group),
    })).filter(g => g.items.length > 0);

    const renderTargetTable = (groupTargets: PromotionCategory[]) => (
      <table className="w-full text-[13px]">
        <thead className="bg-white text-[#8c8c8c] text-[12px]">
          <tr>
            {isEditing && (
              <th className="w-10 px-3 py-2">
                <button
                  onClick={() => toggleSectionSelection(groupTargets)}
                  className="text-[#bfbfbf] hover:text-brand-600"
                  aria-label="全选本分类"
                >
                  {groupTargets.every(t => selectedTargetIds.has(t.id)) ? (
                    <CheckSquare size={13} />
                  ) : groupTargets.some(t => selectedTargetIds.has(t.id)) ? (
                    <MinusSquare size={13} />
                  ) : (
                    <Square size={13} />
                  )}
                </button>
              </th>
            )}
            <th className="px-4 py-2 text-left font-medium">目标类型</th>
            <th className="px-4 py-2 text-center font-medium w-28">当前规则</th>
            <th className="px-4 py-2 text-right font-medium w-52">设置</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f5f5f5]">{renderTargetRows(groupTargets)}</tbody>
      </table>
    );

    return (
      <div className="border-b border-[#f0f0f0] last:border-b-0">
        <div className="flex items-center justify-between bg-[#fafafa] px-4 py-2 border-b border-[#f0f0f0] sticky top-0 z-10">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[#262626]">
            <Icon size={14} className="text-[#8c8c8c]" />
            {title}
            <span className="text-[12px] text-[#8c8c8c] font-normal">{targets.length}</span>
          </div>
          {isEditing && (
            <div className="flex items-center gap-1 flex-wrap justify-end">
              <span className="text-[11px] text-[#8c8c8c] mr-1">本组批量:</span>
              <button
                onClick={() => selectedSource && handleBatchChange(selectedSource.id, sectionIds, InteractionType.ALLOW)}
                className="px-1.5 py-0.5 rounded border bg-white text-brand-600 border-brand-200 text-[11px] hover:bg-brand-50"
              >
                同享
              </button>
              {showItemMutexBtn && (
                <button
                  onClick={() =>
                    selectedSource && handleBatchChange(selectedSource.id, sectionIds, InteractionType.ITEM_MUTEX)
                  }
                  className="px-1.5 py-0.5 rounded border bg-white text-amber-600 border-amber-200 text-[11px] hover:bg-amber-50"
                >
                  共享不叠加
                </button>
              )}
              <button
                onClick={() => selectedSource && handleBatchChange(selectedSource.id, sectionIds, InteractionType.MUTEX)}
                className="px-1.5 py-0.5 rounded border bg-white text-rose-600 border-rose-200 text-[11px] hover:bg-rose-50"
              >
                互斥
              </button>
            </div>
          )}
        </div>

        {groupedTargets.map(({ group, items: groupTargets }) => {
          const groupIds = groupTargets.map(t => t.id);
          const groupAllSelected = groupIds.every(id => selectedTargetIds.has(id));
          const groupSomeSelected = groupIds.some(id => selectedTargetIds.has(id));
          const isGroupExpanded = expandedTargetGroups.has(group);

          return (
            <div key={group} className="border-b border-[#f5f5f5] last:border-b-0">
              <div className="flex items-center justify-between bg-[#fcfcfc] px-4 py-1.5 border-b border-[#f5f5f5]">
                <button
                  onClick={() => toggleTargetGroup(group)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-[#595959] hover:text-[#262626]"
                >
                  {isGroupExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  {group}
                  <span className="text-[#bfbfbf] font-normal">({groupTargets.length})</span>
                </button>
                {isEditing && (
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    <button
                      onClick={() => toggleSectionSelection(groupTargets)}
                      className="text-[#bfbfbf] hover:text-brand-600 mr-1"
                      aria-label="全选本分类"
                      title="全选本分类"
                    >
                      {groupAllSelected ? (
                        <CheckSquare size={12} className="text-brand-600" />
                      ) : groupSomeSelected ? (
                        <MinusSquare size={12} />
                      ) : (
                        <Square size={12} />
                      )}
                    </button>
                    <span className="text-[11px] text-[#8c8c8c] mr-1">分类批量:</span>
                    <button
                      onClick={() =>
                        selectedSource && handleBatchChange(selectedSource.id, groupIds, InteractionType.ALLOW)
                      }
                      className="px-1.5 py-0.5 rounded border bg-white text-brand-600 border-brand-200 text-[11px] hover:bg-brand-50"
                    >
                      同享
                    </button>
                    {showItemMutexBtn && (
                      <button
                        onClick={() =>
                          selectedSource && handleBatchChange(selectedSource.id, groupIds, InteractionType.ITEM_MUTEX)
                        }
                        className="px-1.5 py-0.5 rounded border bg-white text-amber-600 border-amber-200 text-[11px] hover:bg-amber-50"
                      >
                        共享不叠加
                      </button>
                    )}
                    <button
                      onClick={() =>
                        selectedSource && handleBatchChange(selectedSource.id, groupIds, InteractionType.MUTEX)
                      }
                      className="px-1.5 py-0.5 rounded border bg-white text-rose-600 border-rose-200 text-[11px] hover:bg-rose-50"
                    >
                      互斥
                    </button>
                  </div>
                )}
              </div>
              {isGroupExpanded && renderTargetTable(groupTargets)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSourceFilters = () => (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between px-4 py-2 border-b border-[#e8e8e8] bg-white shrink-0">
      <div className="min-w-0">
        <div className="text-[11px] text-[#8c8c8c] mb-1">筛选矩阵中的优惠类型</div>
        <div className="flex flex-wrap gap-1">
          {GROUP_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setGroupFilter(tab.id)}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                groupFilter === tab.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-[#f5f5f5] text-[#595959] hover:bg-[#ebebeb]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative w-full sm:w-44 shrink-0">
        <Search size={11} className="absolute left-2 top-1.5 text-[#bfbfbf]" />
        <input
          type="text"
          placeholder="搜索优惠类型"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-6 pr-2 py-1 text-[12px] border border-[#d9d9d9] rounded focus:outline-none focus:border-brand-500 bg-white"
        />
      </div>
    </div>
  );

  const renderMatrixOverview = () => (
    <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa]">
      <div className="px-4 py-2 bg-[#fffbe6] border-b border-[#ffe58f] flex items-center gap-2 text-[12px] text-[#ad6800] shrink-0">
        <Grid3x3 size={12} />
        矩阵总览为只读，用于整体查看；如需修改请切换至「列表配置」
      </div>
      {renderSourceFilters()}
      {filteredCategories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[#8c8c8c]">
          <div className="text-center py-20">
            <Filter size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-[13px]">未找到匹配的优惠类型</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
          <div className="p-4 w-max min-w-full">
            <div className="bg-white border border-[#e8e8e8] rounded-sm">
              <table className="border-separate border-spacing-0 text-[13px] text-center">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-40 bg-[#fafafa] border-b border-r border-[#e8e8e8] px-3 py-3 min-w-[148px] text-left font-medium text-[#262626] shadow-[2px_2px_6px_-2px_rgba(0,0,0,0.12)]">
                      优惠类型
                    </th>
                    {filteredCategories.map(cat => (
                      <th
                        key={cat.id}
                        className="sticky top-0 z-30 bg-[#fafafa] border-b border-r border-[#e8e8e8] px-3 py-3 font-medium text-[#262626] min-w-[108px] whitespace-nowrap shadow-[0_2px_4px_-2px_rgba(0,0,0,0.08)]"
                      >
                        <CategoryLabel category={cat} className="justify-center" />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map(rowCat => (
                    <tr key={rowCat.id} className="group">
                      <th className="sticky left-0 z-20 bg-white group-hover:bg-[#fafafa] border-b border-r border-[#e8e8e8] px-3 py-3 text-left font-medium text-[#262626] whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]">
                        <CategoryLabel category={rowCat} />
                      </th>
                      {filteredCategories.map(colCat => {
                        const value = getRuleValue(rowCat.id, colCat.id);
                        const isSelf = rowCat.id === colCat.id;
                        const isSingletonSelf = isNoConfigCell(rowCat, colCat);

                        return (
                          <td
                            key={colCat.id}
                            className="border-b border-r border-[#f0f0f0] p-0 h-[48px] relative bg-white group-hover:bg-[#fafafa]/60"
                          >
                            {isSingletonSelf ? (
                              <div className="w-full h-full flex items-center justify-center text-[#bfbfbf]">—</div>
                            ) : (
                              <MatrixCell
                                rowId={rowCat.id}
                                colId={colCat.id}
                                rowScope={rowCat.defaultScope}
                                colScope={colCat.defaultScope}
                                value={value}
                                onChange={onChange}
                                isSelf={isSelf}
                                disabled
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderListConfig = () => (
    <div className="flex-1 flex overflow-hidden min-h-0">
      {/* Left: source type picker */}
      <div className="w-52 lg:w-60 shrink-0 border-r border-[#e8e8e8] flex flex-col bg-white">
        <div className="px-3 py-2.5 border-b border-[#e8e8e8] space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[#262626]">优惠类型</span>
            <div className="flex p-0.5 bg-[#f0f2f5] rounded">
              <button
                onClick={() => setLeftPanelMode('group')}
                title="分组展示"
                className={`p-1 rounded ${leftPanelMode === 'group' ? 'bg-white text-brand-600 shadow-sm' : 'text-[#8c8c8c]'}`}
              >
                <ListTree size={12} />
              </button>
              <button
                onClick={() => setLeftPanelMode('flat')}
                title="平铺展示"
                className={`p-1 rounded ${leftPanelMode === 'flat' ? 'bg-white text-brand-600 shadow-sm' : 'text-[#8c8c8c]'}`}
              >
                <List size={12} />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-[#8c8c8c] leading-relaxed">选择来源类型，右侧设置它与其他类型的关系</p>
          <div className="space-y-1.5">
            <div className="text-[10px] text-[#bfbfbf]">筛选来源</div>
            <div className="relative">
              <Search size={11} className="absolute left-2 top-1.5 text-[#bfbfbf]" />
              <input
                type="text"
                placeholder="搜索来源类型"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-6 pr-2 py-1 text-[12px] border border-[#d9d9d9] rounded focus:outline-none focus:border-brand-500 bg-white"
              />
            </div>
            <div className="flex flex-wrap gap-1 max-h-[52px] overflow-y-auto custom-scrollbar">
              {GROUP_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setGroupFilter(tab.id)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors shrink-0 ${
                    groupFilter === tab.id
                      ? 'bg-brand-500 text-white'
                      : 'bg-[#f5f5f5] text-[#595959] hover:bg-[#ebebeb]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5 space-y-0.5">
          {filteredCategories.length === 0 ? (
            <p className="text-center text-[12px] text-[#8c8c8c] py-8">无匹配类型</p>
          ) : leftPanelMode === 'flat' ? (
            filteredCategories.map(renderSourceItem)
          ) : (
            groupedCategories.map(({ group, items }) => (
              <div key={group} className="mb-0.5">
                <button
                  onClick={() => toggleGroup(group)}
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-medium text-[#595959] hover:text-[#262626]"
                >
                  {expandedGroups.has(group) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                  {group}
                  <span className="text-[#bfbfbf] font-normal">({items.length})</span>
                </button>
                {expandedGroups.has(group) && (
                  <div className="space-y-0.5 pl-1">{items.map(renderSourceItem)}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: relationship list */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {selectedSource ? (
          <>
            <div className="px-4 py-2.5 border-b border-[#f0f0f0] bg-white shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#262626]">
                    当前所选：<span className="font-medium">{selectedSource.name}</span>
                  </span>
                  <CategoryBadge category={selectedSource} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-[#8c8c8c] shrink-0">筛选目标:</span>
                  <div className="relative w-40">
                    <Search size={11} className="absolute left-2 top-1.5 text-[#bfbfbf]" />
                    <input
                      type="text"
                      placeholder="搜索目标类型"
                      value={targetSearch}
                      onChange={e => setTargetSearch(e.target.value)}
                      className="w-full pl-6 pr-2 py-1 text-[12px] border border-[#d9d9d9] rounded focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <select
                    value={targetStatusFilter}
                    onChange={e => setTargetStatusFilter(e.target.value as TargetStatusFilter)}
                    className="text-[12px] border border-[#d9d9d9] rounded px-2 py-1 bg-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="ALL">全部规则</option>
                    <option value={InteractionType.ALLOW}>共享且叠加</option>
                    <option value={InteractionType.ITEM_MUTEX}>共享不叠加</option>
                    <option value={InteractionType.MUTEX}>完全互斥</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <span className="text-[11px] text-[#8c8c8c] mr-0.5">筛选目标分类:</span>
                {GROUP_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTargetGroupFilter(tab.id)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                      targetGroupFilter === tab.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-[#f5f5f5] text-[#595959] hover:bg-[#ebebeb] hover:text-[#262626]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#8c8c8c] mt-1.5">特例规则优先于默认规则</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {targetListData.itemTargets.length === 0 && targetListData.orderTargets.length === 0 ? (
                <div className="text-center py-16 text-[#8c8c8c] text-[13px]">无匹配的目标类型</div>
              ) : (
                <>
                  {renderTargetSection('单品级', Box, targetListData.itemTargets, PromoScope.SINGLE_ITEM)}
                  {renderTargetSection('整单级', ChevronRight, targetListData.orderTargets, PromoScope.ORDER)}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#8c8c8c] text-[13px]">请从左侧选择优惠类型</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white border border-[#e8e8e8] overflow-hidden relative">
      <RuleGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Header */}
      <div className="px-4 py-3 bg-white border-b border-[#e8e8e8] flex flex-wrap justify-between items-center gap-3 z-30">
        <div className="flex items-center gap-3">
          <div className="flex p-0.5 bg-[#f0f2f5] rounded">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-all ${
                viewMode === 'list' ? 'bg-white text-brand-600 shadow-sm' : 'text-[#8c8c8c] hover:text-[#262626]'
              }`}
            >
              <LayoutList size={13} />
              列表配置
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[12px] font-medium transition-all ${
                viewMode === 'matrix' ? 'bg-white text-brand-600 shadow-sm' : 'text-[#8c8c8c] hover:text-[#262626]'
              }`}
            >
              <Grid3x3 size={13} />
              矩阵总览
            </button>
          </div>
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center gap-1 text-[#595959] hover:text-brand-600 text-[12px] px-2 py-1 rounded hover:bg-[#f5f5f5] transition-colors"
          >
            <BookOpen size={13} /> 规则说明
          </button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === 'list' && (
            <>
              {!isEditing ? (
                <button
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d9d9d9] text-[#262626] rounded text-[13px] hover:border-brand-500 hover:text-brand-600 transition-colors"
                >
                  <Pencil size={13} />
                  修改
                </button>
              ) : (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    建议在非营业高峰修改
                  </span>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#d9d9d9] text-[#595959] rounded text-[13px] hover:border-[#bfbfbf] hover:text-[#262626] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded text-[13px] hover:bg-brand-600 transition-colors"
                  >
                    <Save size={13} />
                    保存
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-[#e8e8e8] bg-[#fafafa] shrink-0">
        <MatrixLegend />
      </div>

      {/* Main content */}
      {viewMode === 'list' ? renderListConfig() : renderMatrixOverview()}

      {/* Floating batch bar */}
      {isEditing && viewMode === 'list' && selectedTargetIds.size > 0 && selectedSource && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-white text-[#262626] px-4 py-2.5 rounded shadow-lg border border-[#e8e8e8]">
          <span className="text-[13px]">已选 {selectedTargetIds.size} 项</span>
          <div className="h-4 w-px bg-[#e8e8e8]" />
          <button
            onClick={() => handleBatchChange(selectedSource.id, Array.from(selectedTargetIds), InteractionType.ALLOW)}
            className="px-2.5 py-1 rounded bg-brand-500 text-white text-[12px] hover:bg-brand-600"
          >
            批量同享
          </button>
          <button
            onClick={() => handleBatchChange(selectedSource.id, Array.from(selectedTargetIds), InteractionType.MUTEX)}
            className="px-2.5 py-1 rounded bg-rose-500 text-white text-[12px] hover:bg-rose-600"
          >
            批量互斥
          </button>
          {selectedSource.defaultScope === PromoScope.SINGLE_ITEM && (
            <button
              onClick={() => {
                const validIds = Array.from(selectedTargetIds).filter(id => {
                  const target = categories.find(c => c.id === id);
                  return target?.defaultScope === PromoScope.SINGLE_ITEM;
                });
                if (validIds.length > 0) {
                  handleBatchChange(selectedSource.id, validIds, InteractionType.ITEM_MUTEX);
                }
              }}
              className="px-2.5 py-1 rounded bg-amber-500 text-white text-[12px] hover:bg-amber-600"
            >
              批量共享不叠加
            </button>
          )}
          <button
            onClick={() => setSelectedTargetIds(new Set())}
            className="px-2 py-1 text-[12px] text-[#8c8c8c] hover:text-[#262626]"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
};
