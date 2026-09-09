import React, { useState, useEffect, useCallback } from 'react';
import { 
  PromotionCategory, 
  InteractionType, 
  RuleMatrix,
  PromoInstance,
  InstanceRuleMap,
} from './types';
import { RuleBuilder } from './components/RuleBuilder';
import { RuleGuide } from './components/RuleGuide';
import { SpecialRuleManager } from './components/SpecialRuleManager';
import { PriorityManager } from './components/PriorityManager';
import { ApplicationStrategyPage, hydrateApplicationStrategy } from './components/ApplicationStrategyPage';
import { ApplicationStrategyConfig } from './types/applicationStrategy';
import { StackingPilotConfig } from './types/stackingPilot';
import { hydrateStackingPilot } from './data/defaultStackingPilot';
import { Toast } from './components/Toast';
import { loadDemoState, saveDemoState } from './utils/storage';
import {
  INITIAL_CATEGORIES,
  hydrateMatrix,
  hydratePriorityList,
  hydrateInstances,
} from './data/promotionCategories';
import { DATABASE_INSTANCES } from './data/demoInstances';
import { 
  Settings, 
  GitMerge,
  ListOrdered,
  ClipboardList,
  Share2,
  ChevronDown,
  ChevronRight,
  Store,
} from 'lucide-react';

type ActiveTab = 'builder' | 'priority' | 'instances' | 'scenario';

const SHARE_MUTEX_CHILDREN: { id: ActiveTab; label: string; icon: typeof Settings }[] = [
  { id: 'builder', label: '默认规则', icon: Settings },
  { id: 'instances', label: '特例规则', icon: GitMerge },
];

const TOP_LEVEL_NAV: { id: ActiveTab; label: string; icon: typeof ListOrdered }[] = [
  { id: 'priority', label: '计算顺序', icon: ListOrdered },
  { id: 'scenario', label: '优惠应用策略', icon: ClipboardList },
];

const App: React.FC = () => {
  const [categories] = useState<PromotionCategory[]>(INITIAL_CATEGORIES);
  const [typeMatrix, setTypeMatrix] = useState<RuleMatrix>(() => {
    const saved = loadDemoState();
    return hydrateMatrix(saved?.typeMatrix, INITIAL_CATEGORIES);
  });
  const [priorityList, setPriorityList] = useState<string[]>(() => {
    const saved = loadDemoState();
    return hydratePriorityList(saved?.priorityList, INITIAL_CATEGORIES);
  });
  const [instanceRules, setInstanceRules] = useState<InstanceRuleMap>(() => loadDemoState()?.instanceRules ?? {});
  const [stackingStrategy, setStackingStrategy] = useState<'STATIC_PRIORITY' | 'OPERATION_ORDER'>(
    () => loadDemoState()?.stackingStrategy ?? 'STATIC_PRIORITY'
  );
  const [instances, setInstances] = useState<PromoInstance[]>(() => {
    const saved = loadDemoState();
    return hydrateInstances(saved?.instances, DATABASE_INSTANCES, INITIAL_CATEGORIES);
  });
  const [applicationStrategy, setApplicationStrategy] = useState<ApplicationStrategyConfig>(() =>
    hydrateApplicationStrategy(loadDemoState()?.applicationStrategy)
  );
  const [stackingPilot, setStackingPilot] = useState<StackingPilotConfig>(() =>
    hydrateStackingPilot(loadDemoState()?.stackingPilot)
  );

  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  
  const [activeTab, setActiveTab] = useState<ActiveTab>('builder');
  const [shareMutexOpen, setShareMutexOpen] = useState(true);
  const [ruleGuideOpen, setRuleGuideOpen] = useState(false);

  const isShareMutexChild = activeTab === 'builder' || activeTab === 'instances';

  useEffect(() => {
    if (isShareMutexChild) setShareMutexOpen(true);
  }, [activeTab]);

  useEffect(() => {
    saveDemoState({
      typeMatrix,
      instanceRules,
      priorityList,
      stackingStrategy,
      instances,
      applicationStrategy,
      stackingPilot,
    });
  }, [
    typeMatrix,
    instanceRules,
    priorityList,
    stackingStrategy,
    instances,
    applicationStrategy,
    stackingPilot,
  ]);

  const showDemoSaveToast = useCallback((label: string) => {
    setToast({
      message: `${label}已保存`,
      visible: true,
    });
  }, []);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const handleTypeMatrixChange = (rowId: string, colId: string, newVal: InteractionType) => {
    setTypeMatrix(prev => {
      const next = { ...prev };
      if (!next[rowId]) next[rowId] = {};
      next[rowId][colId] = newVal;
      if (rowId !== colId) {
         if (!next[colId]) next[colId] = {};
         next[colId][rowId] = newVal;
      }
      return next;
    });
  };

  const handleInstanceRuleChange = (sourceId: string, targetId: string, val: InteractionType | 'INHERIT') => {
    setInstanceRules(prev => {
      const next = { ...prev };
      if (!next[sourceId]) next[sourceId] = {};
      if (val === 'INHERIT') {
        delete next[sourceId][targetId];
        if (next[targetId]) delete next[targetId][sourceId];
      } else {
        next[sourceId][targetId] = val;
        if (!next[targetId]) next[targetId] = {};
        next[targetId][sourceId] = val;
      }
      return next;
    });
  };

  const handleBatchInstanceRuleChange = (sourceId: string, updates: {targetId: string, val: InteractionType | 'INHERIT'}[]) => {
    setInstanceRules(prev => {
      const next = { ...prev };
      if (!next[sourceId]) next[sourceId] = {};
      updates.forEach(({targetId, val}) => {
          if (val === 'INHERIT') {
              delete next[sourceId][targetId];
              if (next[targetId]) delete next[targetId][sourceId];
          } else {
              next[sourceId][targetId] = val;
              if (!next[targetId]) next[targetId] = {};
              next[targetId][sourceId] = val;
          }
      });
      return next;
    });
  };

  const handleInstanceDelete = (id: string) => {
      setInstances(prev => prev.filter(i => i.id !== id));
      setInstanceRules(prev => {
          const next = { ...prev };
          delete next[id];
          Object.keys(next).forEach(sourceId => {
              if (next[sourceId] && next[sourceId][id]) {
                  delete next[sourceId][id];
              }
          });
          return next;
      });
  };

  return (
    <div className="min-h-screen flex bg-[#f0f2f5] font-sans">
      {/* Sidebar · 企微白底风 */}
      <aside className="w-56 bg-white border-r border-[#e8e8e8] flex flex-col fixed h-full z-20 hidden md:flex">
        <div className="px-4 py-3 border-b border-[#e8e8e8] flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-brand-500 flex items-center justify-center text-white text-xs font-bold">优</div>
          <span className="font-semibold text-[15px] text-[#262626]">优惠计算规则</span>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3 space-y-0.5">
          {/* 共享互斥 · 父菜单 */}
          <div>
            <button
              type="button"
              onClick={() => setShareMutexOpen(prev => !prev)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded text-[13px] transition-colors ${
                isShareMutexChild ? 'text-brand-600 font-medium' : 'text-[#262626] hover:bg-[#f5f5f5]'
              }`}
            >
              <Share2 size={16} className="shrink-0 opacity-80" />
              <span className="flex-1 text-left">共享互斥</span>
              {shareMutexOpen ? <ChevronDown size={12} className="text-[#8c8c8c]" /> : <ChevronRight size={12} className="text-[#8c8c8c]" />}
            </button>

            {shareMutexOpen && (
              <div className="mt-0.5 space-y-0.5">
                {SHARE_MUTEX_CHILDREN.map(item => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-2 pl-9 pr-3 py-2 rounded text-[13px] transition-colors ${
                        active ? 'bg-brand-500 text-white font-medium' : 'text-[#262626] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      <item.icon size={14} className="shrink-0 opacity-80" />
                      <span className="text-left">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 顶级菜单 */}
          {TOP_LEVEL_NAV.map(item => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-[13px] transition-colors ${
                  active ? 'bg-brand-500 text-white font-medium' : 'text-[#262626] hover:bg-[#f5f5f5]'
                }`}
              >
                <item.icon size={16} className="shrink-0 opacity-80" />
                <span className="text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-[#e8e8e8]">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#f5f5f5] cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center">
              <Store size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-[#262626] truncate">我的门店</div>
              <div className="text-[11px] text-[#8c8c8c] truncate">已开通优惠管理</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 md:ml-56 overflow-hidden h-screen flex flex-col relative">
        <div className="flex-1 overflow-hidden relative z-10 p-3 md:p-4">
            {activeTab === 'builder' && (
            <div className="animate-fade-in h-full">
                <RuleBuilder
                  categories={categories}
                  matrix={typeMatrix}
                  onChange={handleTypeMatrixChange}
                  onSave={() => showDemoSaveToast('默认规则')}
                />
            </div>
            )}

            {activeTab === 'instances' && (
            <div className="animate-fade-in h-full">
                <SpecialRuleManager
                    categories={categories}
                    instances={instances}
                    setInstances={setInstances}
                    instanceRules={instanceRules}
                    onRuleChange={handleInstanceRuleChange}
                    onBatchRuleChange={handleBatchInstanceRuleChange}
                    onInstanceDelete={handleInstanceDelete}
                    typeMatrix={typeMatrix}
                    dbInstances={DATABASE_INSTANCES}
                    onSave={() => showDemoSaveToast('特例规则')}
                    onViewDefaultRules={() => setActiveTab('builder')}
                    stackingPilot={stackingPilot}
                    onStackingPilotChange={setStackingPilot}
                    onToast={showToast}
                />
            </div>
            )}

            {activeTab === 'priority' && (
            <div className="animate-fade-in h-full overflow-hidden">
                <PriorityManager 
                    categories={categories}
                    priorityList={priorityList}
                    setPriorityList={setPriorityList}
                    stackingStrategy={stackingStrategy}
                    setStackingStrategy={setStackingStrategy}
                    onSave={() => showDemoSaveToast('计算顺序')}
                    onOpenRuleGuide={() => setRuleGuideOpen(true)}
                    onToast={showToast}
                />
            </div>
            )}

            {activeTab === 'scenario' && (
            <div className="animate-fade-in h-full overflow-hidden">
                <ApplicationStrategyPage
                  config={applicationStrategy}
                  onConfigChange={setApplicationStrategy}
                  categories={categories}
                  instances={instances}
                  onSave={() => showDemoSaveToast('优惠应用策略')}
                  onToast={showToast}
                />
            </div>
            )}

        </div>

        <Toast message={toast.message} visible={toast.visible} onClose={closeToast} />
        <RuleGuide isOpen={ruleGuideOpen} onClose={() => setRuleGuideOpen(false)} />
      </main>
    </div>
  );
};

export default App;
