import React, { useState, useMemo, useEffect } from 'react';
import { PromoInstance, PromotionCategory, InstanceRuleMap, InteractionType, RuleMatrix, PromoScope, PromoChannel, SINGLETON_PROMO_GROUPS } from '../types';
import { Plus, Trash2, GitMerge, Search, Filter, Layers, Box, Pencil, Save, ChevronDown, ChevronRight, X, ListFilter, ListChecks, CheckSquare, Square, MinusSquare, Check, MoreHorizontal, AlertCircle, BookOpen } from 'lucide-react';
import { RuleGuide } from './RuleGuide';
import { ModalShell } from './ModalShell';
import { ConfirmActionModal } from './ConfirmActionModal';

interface InstanceManagerProps {
  categories: PromotionCategory[];
  instances: PromoInstance[];
  setInstances: React.Dispatch<React.SetStateAction<PromoInstance[]>>;
  instanceRules: InstanceRuleMap;
  onRuleChange: (s: string, t: string, v: InteractionType | 'INHERIT') => void;
  onBatchRuleChange: (s: string, updates: {targetId: string, val: InteractionType | 'INHERIT'}[]) => void;
  onInstanceDelete: (id: string) => void;
  typeMatrix: RuleMatrix;
  dbInstances: PromoInstance[];
  onSave?: () => void;
}

export const InstanceManager: React.FC<InstanceManagerProps> = ({ 
    categories, instances, setInstances, instanceRules, onRuleChange, onBatchRuleChange, onInstanceDelete, typeMatrix, dbInstances, onSave
}) => {
  // --- Selection State ---
  const [selectedSourceIds, setSelectedSourceIds] = useState<Set<string>>(new Set());

  const [configMode, setConfigMode] = useState<'CATEGORY' | 'INSTANCE'>('CATEGORY');
  const [showGuide, setShowGuide] = useState(false);
  
  // --- Add from DB State ---
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDbIds, setSelectedDbIds] = useState<Set<string>>(new Set());

  // --- Right Panel Filters (Target) ---
  const [filterText, setFilterText] = useState(''); 
  const [targetStatusFilter, setTargetStatusFilter] = useState<'ALL' | 'EDITED' | 'ALLOW' | 'MUTEX' | 'ITEM_MUTEX' | 'MIXED'>('ALL');
  
  // --- Left Panel Filters (Source) ---
  const [sourceSearchText, setSourceSearchText] = useState(''); 
  const [sourceCategoryFilter, setSourceCategoryFilter] = useState<string>('ALL');
  const [sourceScopeTab, setSourceScopeTab] = useState<'ALL' | 'ORDER' | 'SINGLE_ITEM'>('ALL'); // Keep this tab filter

  const [isEditing, setIsEditing] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  // UX: Selection State for Batch Operations (Right side targets)
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());

  // UX: Expand/Collapse states
  const [expandedTargetCats, setExpandedTargetCats] = useState<Set<string>>(new Set());
  const [expandedSourceCats, setExpandedSourceCats] = useState<Set<string>>(new Set(categories.map(c => c.id)));

  // Reset filters and selection when changing selection
  useEffect(() => {
    setIsEditing(false);
    setFilterText('');
    setTargetStatusFilter('ALL');
    setExpandedTargetCats(new Set());
    setSelectedTargetIds(new Set());
  }, [selectedSourceIds.size, configMode]); 

  // Auto-expand source categories when searching
  useEffect(() => {
      if (sourceSearchText || sourceCategoryFilter !== 'ALL') {
          setExpandedSourceCats(new Set(categories.map(c => c.id)));
      }
  }, [sourceSearchText, sourceCategoryFilter, categories]);

  // Helper to get selected instances objects
  const selectedSources = useMemo(() => {
      return instances.filter(i => selectedSourceIds.has(i.id));
  }, [instances, selectedSourceIds]);

  // Determine if we have a mix of scopes in the source selection
  const sourceScopeInfo = useMemo(() => {
      if (selectedSources.length === 0) return { isSingleItem: false, isMixed: false, isOrder: false };
      const hasItem = selectedSources.some(s => s.scope === PromoScope.SINGLE_ITEM);
      const hasOrder = selectedSources.some(s => s.scope === PromoScope.ORDER);
      
      return { 
          isSingleItem: hasItem && !hasOrder,
          isOrder: hasOrder && !hasItem,
          isMixed: hasItem && hasOrder
      };
  }, [selectedSources]);

  const toggleTargetCat = (catId: string) => {
      const next = new Set(expandedTargetCats);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      setExpandedTargetCats(next);
  };

  const toggleSourceCat = (catId: string) => {
      const next = new Set(expandedSourceCats);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      setExpandedSourceCats(next);
  };

  // --- Left Panel Selection Handlers ---
  const handleSourceSelect = (id: string, multiSelect: boolean) => {
      if (multiSelect) {
          const next = new Set(selectedSourceIds);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          setSelectedSourceIds(next);
      } else {
          // Exclusive select
          if (selectedSourceIds.has(id) && selectedSourceIds.size === 1) {
             // Already selected single, do nothing or deselect? Let's keep it simple.
          } else {
             setSelectedSourceIds(new Set([id]));
          }
      }
  };

  const handleSourceGroupSelect = (ids: string[]) => {
      const next = new Set(selectedSourceIds);
      const allSelected = ids.every(id => next.has(id));
      if (allSelected) {
          ids.forEach(id => next.delete(id));
      } else {
          ids.forEach(id => next.add(id));
      }
      setSelectedSourceIds(next);
  }

  const handleDelete = (id: string) => {
    onInstanceDelete(id);
    if (selectedSourceIds.has(id)) {
        const next = new Set(selectedSourceIds);
        next.delete(id);
        setSelectedSourceIds(next);
    }
  };

  const requestDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const pendingDeleteInstance = useMemo(
    () => (pendingDeleteId ? instances.find(inst => inst.id === pendingDeleteId) : null),
    [instances, pendingDeleteId]
  );

  const handleAddFromDb = () => {
      const toAdd = dbInstances.filter(i => selectedDbIds.has(i.id));
      const newItems = toAdd.filter(i => !instances.some(existing => existing.id === i.id));
      
      setInstances(prev => [...prev, ...newItems]);
      setShowAddModal(false);
      setSelectedDbIds(new Set());
  };

  const toggleDbSelection = (id: string) => {
      const next = new Set(selectedDbIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedDbIds(next);
  };

  // --- Right Panel Selection Handlers ---
  const toggleRowSelection = (id: string) => {
      const next = new Set(selectedTargetIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedTargetIds(next);
      if (!isEditing) setIsEditing(true); 
  };

  // --- Logic to determine rule status for ONE or MULTIPLE sources ---
  const getBatchEffectiveRuleInfo = (targetId: string, targetCatId: string, isTargetCategory: boolean) => {
      if (selectedSources.length === 0) return { value: InteractionType.MUTEX, source: 'DEFAULT', isMixed: false };

      // Helper to get rule for one source
      const getRuleForSource = (sourceInst: PromoInstance) => {
          if (!isTargetCategory) {
            const specificRule = instanceRules[sourceInst.id]?.[targetId];
            if (specificRule) return { value: specificRule, source: 'INSTANCE_SPECIFIC' };
          }
          const catRule = instanceRules[sourceInst.id]?.[targetCatId];
          if (catRule) return { value: catRule, source: 'INSTANCE_CATEGORY' };
          const globalRule = typeMatrix[sourceInst.categoryId]?.[targetCatId] || InteractionType.MUTEX;
          return { value: globalRule, source: 'GLOBAL_MATRIX' };
      };

      const firstRule = getRuleForSource(selectedSources[0]);
      
      // Check consistency across all selected sources
      for (let i = 1; i < selectedSources.length; i++) {
          const r = getRuleForSource(selectedSources[i]);
          if (r.value !== firstRule.value) {
              return { value: 'MIXED', source: 'MIXED', isMixed: true };
          }
      }

      return { value: firstRule.value, source: firstRule.source, isMixed: false };
  };

  // --- Actions ---
  // Apply change to ALL selected sources against ONE target
  const handleSingleTargetChange = (targetId: string, val: InteractionType | 'INHERIT') => {
      if (selectedSources.length === 0) return;
      selectedSources.forEach(source => {
          onRuleChange(source.id, targetId, val);
      });
  };

  // Apply change to ALL selected sources against MULTIPLE targets
  const handleBatchTargetChange = (targetIds: string[], val: InteractionType | 'INHERIT') => {
      if (selectedSources.length === 0) return;
      selectedSources.forEach(source => {
          const updates = targetIds.map(tid => ({ targetId: tid, val }));
          onBatchRuleChange(source.id, updates);
      });
      // Do not clear target selection in UI immediately to allow multiple operations
  };

  const applySectionBatchAction = (targetIds: string[], val: InteractionType | 'INHERIT') => {
      // Filter targetIds to only those that are currently selected in the UI
      const effectiveIds = targetIds.filter(id => selectedTargetIds.has(id));
      if (effectiveIds.length === 0) return;
      handleBatchTargetChange(effectiveIds, val);
  };

  const renderSourceBadge = (source: string) => {
      switch (source) {
          case 'INSTANCE_SPECIFIC': return <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 whitespace-nowrap">特例 (实例)</span>;
          case 'INSTANCE_CATEGORY': return <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 whitespace-nowrap">特例 (类型)</span>;
          case 'GLOBAL_MATRIX': return <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 whitespace-nowrap">全局默认</span>;
          case 'MIXED': return <span className="text-[10px] bg-gray-600 text-white px-1.5 py-0.5 rounded border border-gray-700 whitespace-nowrap">多种规则</span>;
          default: return null;
      }
  };

  // --- Filtering Logic for Left Panel (Source) ---
  const groupedSourceInstances = useMemo(() => {
    const groups: Record<string, PromoInstance[]> = {};
    categories.forEach(c => groups[c.id] = []);
    let filtered = instances;
    
    // Tab Filter
    if (sourceScopeTab !== 'ALL') {
        filtered = filtered.filter(i => i.scope === sourceScopeTab);
    }

    if (sourceCategoryFilter !== 'ALL') {
        filtered = filtered.filter(i => i.categoryId === sourceCategoryFilter);
    }
    if (sourceSearchText) {
        const lowerText = sourceSearchText.toLowerCase();
        filtered = filtered.filter(i => i.name.toLowerCase().includes(lowerText) || i.id.toLowerCase().includes(lowerText));
    }
    filtered.forEach(i => {
        if (groups[i.categoryId]) groups[i.categoryId].push(i);
    });
    return groups;
  }, [instances, categories, sourceSearchText, sourceCategoryFilter, sourceScopeTab]);

  // --- Filtering Logic for Right Panel (Target) ---
  const checkTargetFilter = (target: PromoInstance | PromotionCategory, isCategoryMode: boolean) => {
      // 1. Text
      if (filterText) {
          const name = target.name.toLowerCase();
          const id = target.id.toLowerCase();
          const search = filterText.toLowerCase();
          
          let match = name.includes(search) || id.includes(search);
          if (!match && !isCategoryMode) {
              const catName = categories.find(c => c.id === (target as PromoInstance).categoryId)?.name.toLowerCase();
              if (catName?.includes(search)) match = true;
          }
          if (!match) return false;
      }

      // 2. Status
      if (targetStatusFilter !== 'ALL' && selectedSources.length > 0) {
          const targetId = target.id;
          const targetCatId = isCategoryMode ? target.id : (target as PromoInstance).categoryId;
          const { value, isMixed } = getBatchEffectiveRuleInfo(targetId, targetCatId, isCategoryMode);
          const isEdited = selectedSources.some(s => instanceRules[s.id]?.[targetId] !== undefined);

          if (targetStatusFilter === 'EDITED') return isEdited;
          if (targetStatusFilter === 'MIXED') return isMixed;
          
          if (isMixed) return false;

          if (targetStatusFilter === 'ALLOW') return value === InteractionType.ALLOW;
          if (targetStatusFilter === 'MUTEX') return value === InteractionType.MUTEX;
          if (targetStatusFilter === 'ITEM_MUTEX') return value === InteractionType.ITEM_MUTEX;
      }
      return true;
  };

  // Split Targets into Two Groups: Item Scope & Order Scope
  const targetData = useMemo(() => {
      if (selectedSources.length === 0) return { itemTargets: [], orderTargets: [] };
      
      // Singleton Logic
      const singletonGroups = SINGLETON_PROMO_GROUPS;
      const hiddenCatIds = new Set<string>();
      selectedSources.forEach(s => {
          const cat = categories.find(c => c.id === s.categoryId);
          if (cat && singletonGroups.includes(cat.group)) hiddenCatIds.add(cat.id);
      });

      // CATEGORY MODE
      if (configMode === 'CATEGORY') {
          const allCats = categories.filter(c => checkTargetFilter(c, true));
          const visibleCats = allCats.filter(c => !hiddenCatIds.has(c.id));
          return {
              itemTargets: visibleCats.filter(c => c.defaultScope === PromoScope.SINGLE_ITEM),
              orderTargets: visibleCats.filter(c => c.defaultScope !== PromoScope.SINGLE_ITEM),
          };
      } 
      
      // INSTANCE MODE
      else {
          const selectedSourceIdSet = new Set(selectedSources.map(s => s.id));
          const sourceCategories = new Set(selectedSources.map(s => s.categoryId));

          const allInsts = instances.filter(i => checkTargetFilter(i, false));
          const visibleInsts = allInsts.filter(i => {
              // Hide self
              if (selectedSourceIdSet.has(i.id)) return false;
              // Hide same singleton category
              const iCat = categories.find(c => c.id === i.categoryId);
              if (iCat && singletonGroups.includes(iCat.group) && sourceCategories.has(i.categoryId)) return false;
              return true;
          });
          
          // Grouping
          const groupByType = (list: PromoInstance[]) => {
              const groups: Record<string, PromoInstance[]> = {};
              list.forEach(i => {
                  if (!groups[i.categoryId]) groups[i.categoryId] = [];
                  groups[i.categoryId].push(i);
              });
              return groups;
          };

          return {
              itemTargets: groupByType(visibleInsts.filter(i => i.scope === PromoScope.SINGLE_ITEM)),
              orderTargets: groupByType(visibleInsts.filter(i => i.scope !== PromoScope.SINGLE_ITEM)),
          };
      }
  }, [instances, categories, selectedSources, configMode, filterText, targetStatusFilter]);

  const clearTargetFilters = () => {
      setFilterText('');
      setTargetStatusFilter('ALL');
  };

  // --- Render Helpers ---
  const renderStatusBadge = (value: any, source: string, isMixed: boolean) => {
    if (isMixed) {
        return (
            <div className="flex flex-col items-center gap-1">
                 <span className="bg-gray-100 text-gray-600 border border-gray-300 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                    <MoreHorizontal size={12}/> 多种规则
                 </span>
                 {renderSourceBadge('MIXED')}
            </div>
        );
    }
    let content;
    switch(value) {
        case InteractionType.ALLOW: content = <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-xs font-medium">允许同享</span>; break;
        case InteractionType.ITEM_MUTEX: content = <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-xs font-medium">共享不叠加</span>; break;
        case InteractionType.MUTEX:
        default: content = <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded text-xs font-medium">全局互斥</span>; break;
    }
    return <div className="flex flex-col items-center gap-1">{content}{renderSourceBadge(source)}</div>;
  };

  // --- Sub-Components for Right Panel Sections ---
  const SectionHeader = ({ title, icon: Icon, count, sectionScope }: { title: string, icon: any, count: number, sectionScope: PromoScope }) => {
      const showItemMutexBtn = sectionScope === PromoScope.SINGLE_ITEM && !sourceScopeInfo.isOrder; 
      return (
          <div className="flex items-center justify-between bg-gray-100/80 p-3 border-y border-gray-200 sticky top-0 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2 text-gray-700 font-bold text-sm">
                  <Icon size={16} /> {title} <span className="bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full text-xs">{count}</span>
              </div>
          </div>
      );
  };

  const renderTargetList = (
      targets: PromotionCategory[] | Record<string, PromoInstance[]>, 
      sectionScope: PromoScope
  ) => {
      // Show Item Mutex button in Item Section IF source is not pure Order
      const showItemMutexBtn = sectionScope === PromoScope.SINGLE_ITEM && !sourceScopeInfo.isOrder; 

      if (configMode === 'CATEGORY') {
          const list = targets as PromotionCategory[];
          if (list.length === 0) return <div className="p-4 text-center text-gray-400 text-xs italic">无相关类型</div>;

          return (
             <div className="bg-white">
                 <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 text-gray-500 font-medium text-xs">
                         <tr>
                             <th className="px-6 py-2 w-1/3">目标类型</th>
                             <th className="px-6 py-2 text-center">当前规则</th>
                             <th className="px-6 py-2 text-right">
                                 {isEditing && (
                                     <div className="flex justify-end gap-1 opacity-80 hover:opacity-100 transition-opacity">
                                         <span className="text-[10px] text-gray-400 mr-1 self-center">本组批量:</span>
                                         <button onClick={() => handleBatchTargetChange(list.map(c => c.id), 'INHERIT')} className="px-1.5 py-0.5 rounded border bg-white text-[10px]">默认</button>
                                         <button onClick={() => handleBatchTargetChange(list.map(c => c.id), InteractionType.ALLOW)} className="px-1.5 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">同享</button>
                                         {showItemMutexBtn && (
                                            <button onClick={() => handleBatchTargetChange(list.map(c => c.id), InteractionType.ITEM_MUTEX)} className="px-1.5 py-0.5 rounded border bg-amber-50 text-amber-700 border-amber-200 text-[10px]">共享不叠加</button>
                                         )}
                                         <button onClick={() => handleBatchTargetChange(list.map(c => c.id), InteractionType.MUTEX)} className="px-1.5 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200 text-[10px]">互斥</button>
                                     </div>
                                 )}
                             </th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100">
                         {list.map(targetCat => {
                             const { value, source, isMixed } = getBatchEffectiveRuleInfo(targetCat.id, targetCat.id, true);
                             const isSelf = selectedSources.some(s => s.categoryId === targetCat.id);
                             return (
                                 <tr key={targetCat.id} className={`hover:bg-gray-50 group ${isSelf ? 'bg-brand-50/20' : ''}`}>
                                     <td className="px-6 py-3">
                                         <div className="font-bold text-gray-700 flex items-center gap-2">
                                             {targetCat.name}
                                             {isSelf && <span className="text-[10px] bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded border border-brand-200">同类</span>}
                                         </div>
                                     </td>
                                     <td className="px-6 py-3 text-center">{renderStatusBadge(value, source, isMixed)}</td>
                                     <td className="px-6 py-3 text-right">
                                         <div className={`flex justify-end gap-1.5 transition-opacity ${!isEditing ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                                            <button onClick={() => handleSingleTargetChange(targetCat.id, InteractionType.ALLOW)} className={`p-1 rounded border text-[10px] ${!isMixed && value === InteractionType.ALLOW ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>同享</button>
                                            {showItemMutexBtn && (
                                                <button onClick={() => handleSingleTargetChange(targetCat.id, InteractionType.ITEM_MUTEX)} className={`p-1 rounded border text-[10px] ${!isMixed && value === InteractionType.ITEM_MUTEX ? 'bg-amber-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>共享不叠加</button>
                                            )}
                                            <button onClick={() => handleSingleTargetChange(targetCat.id, InteractionType.MUTEX)} className={`p-1 rounded border text-[10px] ${!isMixed && value === InteractionType.MUTEX ? 'bg-rose-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>互斥</button>
                                         </div>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
          );
      } else {
          // INSTANCE MODE (Grouped)
          const groups = targets as Record<string, PromoInstance[]>;
          const catIds = Object.keys(groups);
          if (catIds.length === 0) return <div className="p-4 text-center text-gray-400 text-xs italic">无相关实例</div>;

          return (
              <div className="space-y-0 divider-y divider-gray-100">
                  {categories.filter(c => groups[c.id]).map(cat => {
                      const groupInstances = groups[cat.id];
                      const isExpanded = expandedTargetCats.has(cat.id);
                      
                      // Check "Section Selection" for batch bar
                      const allSelected = groupInstances.every(i => selectedTargetIds.has(i.id));
                      
                      return (
                          <div key={cat.id} className="bg-white border-b border-gray-100">
                                <div 
                                    className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 ${isExpanded ? 'bg-gray-50' : ''}`}
                                    onClick={() => toggleTargetCat(cat.id)}
                                >
                                    <div className="flex items-center gap-3">
                                        {isExpanded ? <ChevronDown size={14} className="text-gray-400"/> : <ChevronRight size={14} className="text-gray-400"/>}
                                        <div className="text-sm font-bold text-gray-700">{cat.name} <span className="text-gray-400 font-normal">({groupInstances.length})</span></div>
                                    </div>
                                    {isEditing && (
                                        <div onClick={e => e.stopPropagation()} className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                                            {/* Mini Batch Buttons for Group */}
                                            <button onClick={() => handleBatchTargetChange(groupInstances.map(i=>i.id), InteractionType.ALLOW)} className="px-1.5 py-0.5 rounded border text-[10px] hover:bg-emerald-50 text-emerald-600">全组同享</button>
                                            {showItemMutexBtn && <button onClick={() => handleBatchTargetChange(groupInstances.map(i=>i.id), InteractionType.ITEM_MUTEX)} className="px-1.5 py-0.5 rounded border text-[10px] hover:bg-amber-50 text-amber-600">全组共享不叠加</button>}
                                            <button onClick={() => handleBatchTargetChange(groupInstances.map(i=>i.id), InteractionType.MUTEX)} className="px-1.5 py-0.5 rounded border text-[10px] hover:bg-rose-50 text-rose-600">全组互斥</button>
                                        </div>
                                    )}
                                </div>
                                
                                {isExpanded && (
                                    <div className="bg-gray-50/30 px-4 py-2 space-y-1">
                                         {groupInstances.map(inst => {
                                             const { value, source, isMixed } = getBatchEffectiveRuleInfo(inst.id, cat.id, false);
                                             const isSelected = selectedTargetIds.has(inst.id);
                                             const isSelf = selectedSourceIds.has(inst.id);
                                             
                                             return (
                                                 <div 
                                                    key={inst.id} 
                                                    onClick={() => toggleRowSelection(inst.id)}
                                                    className={`
                                                        flex items-center justify-between p-2 rounded border cursor-pointer transition-all
                                                        ${isSelected ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-200' : 'bg-white border-gray-200 hover:border-brand-200'}
                                                        ${isSelf ? 'opacity-50 pointer-events-none bg-gray-100' : ''}
                                                    `}
                                                 >
                                                     <div className="flex items-center gap-3">
                                                         <div className={`text-gray-300 ${isSelected ? 'text-brand-600' : ''}`}>
                                                             {isSelected ? <CheckSquare size={14}/> : <Square size={14}/>}
                                                         </div>
                                                         <div>
                                                             <div className="text-xs font-bold text-gray-700">{inst.name}</div>
                                                             <div className="text-[10px] text-gray-400">{inst.id}</div>
                                                         </div>
                                                     </div>
                                                     
                                                     <div className="flex items-center gap-6">
                                                         {renderStatusBadge(value, source, isMixed)}
                                                         
                                                         {/* Inline Actions */}
                                                         {isEditing && (
                                                             <div onClick={e => e.stopPropagation()} className="flex gap-1">
                                                                 <button onClick={() => handleSingleTargetChange(inst.id, InteractionType.ALLOW)} className={`w-5 h-5 flex items-center justify-center rounded border ${!isMixed && value === InteractionType.ALLOW ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-gray-400 hover:bg-gray-50'}`} title="同享"><Check size={10}/></button>
                                                                 {showItemMutexBtn && (
                                                                     <button onClick={() => handleSingleTargetChange(inst.id, InteractionType.ITEM_MUTEX)} className={`w-5 h-5 flex items-center justify-center rounded border ${!isMixed && value === InteractionType.ITEM_MUTEX ? 'bg-amber-500 text-white border-amber-600' : 'bg-white text-gray-400 hover:bg-gray-50'}`} title="共享不叠加"><MoreHorizontal size={10}/></button>
                                                                 )}
                                                                 <button onClick={() => handleSingleTargetChange(inst.id, InteractionType.MUTEX)} className={`w-5 h-5 flex items-center justify-center rounded border ${!isMixed && value === InteractionType.MUTEX ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-gray-400 hover:bg-gray-50'}`} title="互斥"><X size={10}/></button>
                                                             </div>
                                                         )}
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                    </div>
                                )}
                          </div>
                      );
                  })}
              </div>
          );
      }
  };

  return (
    <>
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-160px)] relative">
      <RuleGuide isOpen={showGuide} onClose={() => setShowGuide(false)} />

      {/* Add Instance Modal */}
      {showAddModal && (
        <ModalShell open={showAddModal} onClose={() => setShowAddModal(false)} size="lg" zIndex={50} overlayClassName="backdrop-blur-sm bg-black/50">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h3 className="font-bold text-gray-800">添加规则对象</h3>
                    <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                </div>
                
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4 min-h-0">
                    <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-100 flex gap-2">
                        <AlertCircle size={14} className="text-blue-500 shrink-0 mt-0.5"/>
                        <div>
                            从系统数据库中选择具体的活动实例。例如“2024夏季大促”。
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        {dbInstances.filter(i => !instances.some(existing => existing.id === i.id)).length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">暂无更多可选实例</div>
                        ) : (
                            categories.map(cat => {
                                const catInstances = dbInstances.filter(i => 
                                    i.categoryId === cat.id && 
                                    !instances.some(existing => existing.id === i.id)
                                );
                                if (catInstances.length === 0) return null;
                                
                                return (
                                    <div key={cat.id} className="border rounded-lg overflow-hidden">
                                        <div className="bg-gray-50 px-3 py-2 text-xs font-bold text-gray-600 border-b border-gray-100 flex justify-between">
                                            <span>{cat.name}</span>
                                            <span className="font-normal text-gray-400">{catInstances.length}个可选</span>
                                        </div>
                                        <div className="divide-y divide-gray-50">
                                            {catInstances.map(inst => {
                                                const isSelected = selectedDbIds.has(inst.id);
                                                return (
                                                    <div 
                                                        key={inst.id} 
                                                        onClick={() => toggleDbSelection(inst.id)}
                                                        className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-brand-50/50' : ''}`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-gray-300 ${isSelected ? 'text-brand-600' : ''}`}>
                                                                {isSelected ? <CheckSquare size={16}/> : <Square size={16}/>}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-700">{inst.name}</div>
                                                                <div className="text-[10px] text-gray-400">{inst.id}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-500">
                                                            {inst.isPercentage ? `${(inst.value * 10).toFixed(1)}折` : `¥${inst.value}`}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-between items-center shrink-0">
                    <div className="text-xs text-gray-500">
                        已选 {selectedDbIds.size} 项
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg border bg-white text-gray-600 text-sm font-medium hover:bg-gray-50">取消</button>
                        <button 
                            onClick={handleAddFromDb}
                            disabled={selectedDbIds.size === 0}
                            className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            确认添加
                        </button>
                    </div>
                </div>
        </ModalShell>
      )}

      {/* Left: List of Instances (Grouped) */}
      <div className="col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
         <div className="p-4 border-b bg-gray-50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-700">1. 活动实例</h3>
                    <p className="text-xs text-gray-400 mt-0.5">管理所有参与计算的活动</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            setSelectedDbIds(new Set());
                            setShowAddModal(true);
                        }}
                        className="flex items-center gap-1 bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow hover:bg-brand-700 transition-colors"
                    >
                        <Plus size={14} /> 添加规则对象
                    </button>
                </div>
            </div>
            
            {/* New: Scope Tabs for Left Panel */}
            <div className="flex p-1 bg-gray-200/50 rounded-lg">
                {[
                    { id: 'ALL', label: '全部' },
                    { id: 'SINGLE_ITEM', label: '单品级' },
                    { id: 'ORDER', label: '整单级' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setSourceScopeTab(tab.id as any)}
                        className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${sourceScopeTab === tab.id ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="relative">
                <Search size={12} className="absolute left-2 top-2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索..."
                    className="w-full pl-7 pr-6 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:border-brand-500"
                    value={sourceSearchText}
                    onChange={(e) => setSourceSearchText(e.target.value)}
                />
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                 <div className="text-xs text-gray-500 font-medium">
                   已选 {selectedSourceIds.size} 项
                   <span className="text-[10px] text-gray-400 ml-1">· Ctrl+点击多选</span>
                 </div>
                 {selectedSourceIds.size > 0 && (
                     <button onClick={() => setSelectedSourceIds(new Set())} className="text-[10px] text-gray-400 hover:text-gray-600">清空选择</button>
                 )}
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {instances.length === 0 ? (
                <div className="text-center py-10 px-4">
                    <Box size={40} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm font-bold text-gray-600 mb-1">暂无活动实例</p>
                    <p className="text-xs text-gray-400 mb-4">请点击上方按钮从活动库导入</p>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-brand-50 text-brand-600 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors"
                    >
                        + 导入示例活动
                    </button>
                </div>
            ) : categories.map(cat => {
                if (sourceCategoryFilter !== 'ALL' && cat.id !== sourceCategoryFilter) return null;
                if (sourceScopeTab !== 'ALL' && cat.defaultScope !== sourceScopeTab) return null;

                const groupInstances = groupedSourceInstances[cat.id] || [];
                if (groupInstances.length === 0) return null;
                const isExpanded = expandedSourceCats.has(cat.id);
                
                const allInGroupSelected = groupInstances.length > 0 && groupInstances.every(i => selectedSourceIds.has(i.id));
                const someInGroupSelected = groupInstances.some(i => selectedSourceIds.has(i.id));

                return (
                    <div key={cat.id} className="mb-1 animate-fade-in">
                        <div className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-50 rounded">
                            <button 
                                onClick={() => handleSourceGroupSelect(groupInstances.map(i => i.id))}
                                className={`text-gray-400 hover:text-brand-600 ${allInGroupSelected ? 'text-brand-600' : ''}`}
                            >
                                {allInGroupSelected ? <CheckSquare size={14}/> : (someInGroupSelected ? <MinusSquare size={14} className="text-brand-600"/> : <Square size={14}/>)}
                            </button>
                            <button 
                                onClick={() => toggleSourceCat(cat.id)}
                                className="flex-1 flex items-center justify-between text-xs font-bold text-gray-500 select-none"
                            >
                                <span className="flex items-center gap-1">
                                    {cat.name}
                                </span>
                                <div className="flex items-center gap-1">
                                    <span className={`text-[9px] px-1 rounded ${cat.defaultScope === PromoScope.SINGLE_ITEM ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                                        {cat.defaultScope === PromoScope.SINGLE_ITEM ? '单' : '整'}
                                    </span>
                                    <span className="bg-gray-100 px-1.5 rounded-full text-[10px] text-gray-400">{groupInstances.length}</span>
                                    {isExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>}
                                </div>
                            </button>
                        </div>
                        
                        {isExpanded && (
                            <div className="pl-2 space-y-1 mt-1">
                                {groupInstances.map(inst => {
                                    const isSelected = selectedSourceIds.has(inst.id);
                                    return (
                                        <div 
                                            key={inst.id}
                                            onClick={(e) => handleSourceSelect(inst.id, e.ctrlKey || e.metaKey)} 
                                            className={`p-2 rounded-lg cursor-pointer border transition-all flex justify-between items-center group
                                                ${isSelected ? 'bg-brand-50 border-brand-300 ring-1 ring-brand-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`shrink-0 ${isSelected ? 'text-brand-600' : 'text-gray-300 group-hover:text-gray-400'}`}>
                                                    {isSelected ? <CheckSquare size={14}/> : <Square size={14}/>}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className={`font-medium text-xs truncate ${isSelected ? 'text-brand-900' : 'text-gray-700'}`}>
                                                        {inst.name}
                                                        {inst.isStaticType && <span className="ml-1 text-[9px] bg-blue-100 text-blue-600 px-1 rounded border border-blue-200">通用</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); requestDelete(inst.id); }}
                                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="移除此例外配置"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
         </div>
      </div>

      {/* Right: Conflict Config for Selected */}
      <div className="col-span-9 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
         {selectedSources.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <GitMerge size={48} className="mb-4 text-gray-200" />
                 <p>请从左侧选择活动实例，再配置特例规则</p>
             </div>
         ) : (
             <>
                <div className="p-4 border-b bg-gray-50 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                                {selectedSources.length === 1 ? selectedSources[0].name : `已选 ${selectedSources.length} 项`}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                                {sourceScopeInfo.isMixed ? (
                                    <span className="text-[10px] bg-[#262626] text-white px-2 py-0.5 rounded font-medium flex items-center gap-1">
                                        <Layers size={10} /> 单品+整单
                                    </span>
                                ) : (
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${sourceScopeInfo.isSingleItem ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {sourceScopeInfo.isSingleItem ? '单品优惠' : '整单优惠'}
                                    </span>
                                )}
                                <span className="text-xs text-[#8c8c8c]">下方目标已按「单品级」与「整单级」分组。</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowGuide(true)} className="flex items-center gap-1 text-gray-500 hover:text-brand-600 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors">
                                <BookOpen size={14} /> 规则说明
                            </button>
                            <div className="h-4 w-px bg-gray-200"></div>
                            <div className="flex bg-white rounded-lg p-1 border shadow-sm self-start">
                                <button onClick={() => setConfigMode('CATEGORY')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${configMode === 'CATEGORY' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}><Layers size={14} /> 按类型</button>
                                <button onClick={() => setConfigMode('INSTANCE')} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${configMode === 'INSTANCE' ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}><Box size={14} /> 按实例</button>
                            </div>
                            {isEditing && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                    建议在非营业高峰修改，避免影响下单时的优惠计算
                                </span>
                            )}
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  setIsEditing(false);
                                  onSave?.();
                                } else {
                                  setIsEditing(true);
                                }
                              }}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm ${isEditing ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700'}`}
                            >
                              {isEditing ? <Save size={14}/> : <Pencil size={14}/>} {isEditing ? '保存' : '修改'}
                            </button>
                        </div>
                    </div>
                </div>

                {sourceScopeInfo.isMixed && (
                    <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-800">
                        <AlertCircle size={14} className="shrink-0" />
                        由于所选包含单品和整单两类优惠，「共享不叠加」仅在下方【单品级】区域显示，且只对「单品 vs 单品」生效。
                    </div>
                )}

                {/* Target filters */}
                <div className="px-4 py-3 border-b bg-white flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                    <p className="text-[10px] text-gray-400 shrink-0">
                        规则来源：默认规则 → 类型特例 → 实例特例（后者优先）
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search size={12} className="absolute left-2 top-2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="搜索目标..."
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg w-36 focus:outline-none focus:border-brand-500"
                            />
                        </div>
                        <select
                            value={targetStatusFilter}
                            onChange={e => setTargetStatusFilter(e.target.value as typeof targetStatusFilter)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-brand-500 bg-white"
                        >
                            <option value="ALL">全部状态</option>
                            <option value="EDITED">已定制</option>
                            <option value="ALLOW">允许同享</option>
                            <option value="ITEM_MUTEX">共享不叠加</option>
                            <option value="MUTEX">全局互斥</option>
                            <option value="MIXED">多种规则</option>
                        </select>
                        {(filterText || targetStatusFilter !== 'ALL') && (
                            <button onClick={clearTargetFilters} className="text-[10px] text-gray-400 hover:text-gray-600 px-2 py-1">
                                清除筛选
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-20 custom-scrollbar">
                    {/* SECTION 1: Single Item Targets */}
                    <SectionHeader title="目标：单品级规则" icon={Box} count={configMode === 'CATEGORY' ? (targetData.itemTargets as PromotionCategory[]).length : Object.keys(targetData.itemTargets).length} sectionScope={PromoScope.SINGLE_ITEM} />
                    {renderTargetList(targetData.itemTargets, PromoScope.SINGLE_ITEM)}

                    {/* SECTION 2: Order Level Targets */}
                    <div className="mt-8">
                        <SectionHeader title="目标：整单级规则" icon={Layers} count={configMode === 'CATEGORY' ? (targetData.orderTargets as PromotionCategory[]).length : Object.keys(targetData.orderTargets).length} sectionScope={PromoScope.ORDER} />
                        {renderTargetList(targetData.orderTargets, PromoScope.ORDER)}
                    </div>
                </div>
                
                {/* Floating Batch Action Bar (Only shows when explicit row selection is made in INSTANCE mode) */}
                {selectedTargetIds.size > 0 && configMode === 'INSTANCE' && (
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white shadow-xl border border-gray-200 rounded-full px-6 py-3 flex items-center gap-4 animate-bounce-in z-20">
                        <div className="flex items-center gap-2">
                             <CheckSquare size={16} className="text-brand-600" />
                             <span className="font-bold text-gray-700 text-sm whitespace-nowrap">已选 {selectedTargetIds.size} 项</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => applySectionBatchAction(Array.from(selectedTargetIds), 'INHERIT')} className="px-3 py-1.5 rounded-full text-xs font-medium hover:bg-gray-100">恢复默认</button>
                            <button onClick={() => applySectionBatchAction(Array.from(selectedTargetIds), InteractionType.ALLOW)} className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 shadow-sm">设为同享</button>
                            
                            {/* Conditional Item Mutex Button in Global Batch Bar */}
                            {!sourceScopeInfo.isOrder && (
                                <button onClick={() => applySectionBatchAction(Array.from(selectedTargetIds), InteractionType.ITEM_MUTEX)} className="px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 shadow-sm">设为共享不叠加</button>
                            )}
                            
                            <button onClick={() => applySectionBatchAction(Array.from(selectedTargetIds), InteractionType.MUTEX)} className="px-3 py-1.5 rounded-full bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 shadow-sm">设为互斥</button>
                        </div>
                        <button onClick={() => setSelectedTargetIds(new Set())} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
                    </div>
                )}
             </>
         )}
      </div>
    </div>
    <ConfirmActionModal
      open={pendingDeleteId !== null}
      title="确认移除"
      description={
        pendingDeleteInstance ? (
          <>
            确认移除例外配置「<strong className="text-[#262626]">{pendingDeleteInstance.name}</strong>
            」？移除后该对象的特例关系配置将被删除。
          </>
        ) : (
          '确认移除此例外配置？移除后该对象的特例关系配置将被删除。'
        )
      }
      confirmLabel="确认移除"
      variant="danger"
      onCancel={() => setPendingDeleteId(null)}
      onConfirm={() => {
        if (pendingDeleteId) handleDelete(pendingDeleteId);
        setPendingDeleteId(null);
      }}
    />
    </>
  );
};