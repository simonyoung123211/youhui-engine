import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/admin.css';
import {
  InteractionType,
  PromotionCategory,
  PromoInstance,
  PromoGroup,
  PromoInstanceStatus,
  PROMO_GROUP_ORDER,
  RuleMatrix,
  RuleMember,
  RuleRelationScope,
  SpecialRule,
  SpecialRuleStatus,
  InstanceRuleMap,
} from '../types';
import {
  INSTANCE_TYPE_MAP,
  DEMO_TYPE_A,
  DEMO_TYPE_B,
  DEMO_TYPE_C,
  DEMO_TYPE_LABELS,
  buildDemoSpecialRulesPool,
} from '../data/mockSpecialRules';
import {
  countRulePairs,
  detectSaveImpact,
  expandRulePairs,
  getPairCoverage,
  getRulePairStatuses,
  interactionLabel,
} from '../utils/specialRuleResolver';
import { loadPriorityEnabled, savePriorityEnabled } from '../utils/priorityConfig';
import { InstanceManager } from './InstanceManager';
import { SaveConflictModal } from './SaveConflictModal';
import { PairInspectorPanel } from './PairInspectorPanel';
import { PriorityConfigPanel } from './PriorityConfigPanel';
import { SpecialRuleGuide } from './SpecialRuleGuide';
import { SpecialRuleTeachingDemo } from './SpecialRuleTeachingDemo';
import { ModalShell } from './ModalShell';
import { VirtualList } from './VirtualList';
import { PickerQuickSearch } from './PickerQuickSearch';
import { SpecialRuleListTable } from './SpecialRuleListTable';
import { SpecialRuleListChrome } from './SpecialRuleListChrome';
import {
  toggleSort,
  usePaginatedSpecialRules,
  DEFAULT_SPECIAL_RULE_PAGE_SIZE,
  SpecialRulePageSize,
} from '../hooks/usePaginatedSpecialRules';
import {
  SpecialRuleInteractionFilter,
  SpecialRuleScopeFilter,
  SpecialRuleSortBy,
  SpecialRuleSortDir,
  SpecialRuleStatusFilter,
  computeStatusTabCounts,
} from '../utils/specialRuleQuery';
import {
  applySpecialRuleListUrl,
  readSpecialRuleListUrl,
} from '../utils/specialRuleListUrl';
import { preparePriorityDraft } from '../utils/priorityReorder';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePaginatedInstances } from '../hooks/usePaginatedInstances';
import {
  filterInstancesLocally,
  InstanceStatusFilter,
  queryAllFilteredInstances,
  resolveInstanceStatus,
} from '../utils/instanceQuery';
import {
  ArrowLeft,
  Plus,
  AlertTriangle,
  FlaskConical,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Settings,
  Square,
  CheckSquare,
  Layers,
  Link2,
  Ban,
  Search,
  X,
  Pencil,
  BookOpen,
} from 'lucide-react';
import { PromoRef } from '../types';
import {
  countInstanceCapableCategories,
  getCategoryInstanceMode,
  isTypeOnlyCategory,
} from '../data/promotionCategories';

type ViewMode = 'list' | 'detail' | 'form' | 'inspector';

interface SpecialRuleManagerProps {
  categories: PromotionCategory[];
  instances: PromoInstance[];
  setInstances: React.Dispatch<React.SetStateAction<PromoInstance[]>>;
  instanceRules: InstanceRuleMap;
  onRuleChange: (s: string, t: string, v: InteractionType | 'INHERIT') => void;
  onBatchRuleChange: (s: string, updates: { targetId: string; val: InteractionType | 'INHERIT' }[]) => void;
  onInstanceDelete: (id: string) => void;
  typeMatrix: RuleMatrix;
  dbInstances: PromoInstance[];
  onSave?: () => void;
  onViewDefaultRules?: () => void;
}

const INTERACTION_OPTIONS: { value: InteractionType; label: string; desc: string }[] = [
  { value: InteractionType.ITEM_MUTEX, label: '共享（不叠加）', desc: '历史「共享」，可同时参与，取最优不叠加' },
  { value: InteractionType.MUTEX, label: '互斥', desc: '只能选一个' },
  { value: InteractionType.ALLOW, label: '共享且叠加', desc: '可同时生效并叠加（高级）' },
];

function formatMembers(members: RuleMember[], max = 2): string {
  if (members.length === 0) return '—';
  const head = members.slice(0, max).map(m => m.refName).join('、');
  if (members.length <= max) return head;
  return `${head} 等${members.length}个`;
}

function hasExpiredMembers(rule: SpecialRule): boolean {
  return [...rule.sideA, ...(rule.sideB ?? [])].some(m => m.expired);
}

export const SpecialRuleManager: React.FC<SpecialRuleManagerProps> = ({
  categories,
  instances,
  setInstances,
  instanceRules,
  onRuleChange,
  onBatchRuleChange,
  onInstanceDelete,
  typeMatrix,
  dbInstances,
  onSave,
  onViewDefaultRules,
}) => {
  const initialListState = readSpecialRuleListUrl();
  const [rules, setRules] = useState<SpecialRule[]>(() =>
    buildDemoSpecialRulesPool().map((r, i) => ({ ...r, priority: r.priority ?? i + 1 }))
  );
  const [view, setView] = useState<ViewMode>('list');
  const [keyword, setKeyword] = useState(initialListState.keyword);
  const [statusFilter, setStatusFilter] = useState<SpecialRuleStatusFilter>(initialListState.status);
  const [scopeFilter, setScopeFilter] = useState<SpecialRuleScopeFilter>(initialListState.relationScope);
  const [interactionFilter, setInteractionFilter] = useState<SpecialRuleInteractionFilter>(
    initialListState.interaction
  );
  const [expiredOnly, setExpiredOnly] = useState(initialListState.expiredOnly);
  const [listPage, setListPage] = useState(initialListState.page);
  const [listPageSize, setListPageSize] = useState<SpecialRulePageSize>(
    initialListState.pageSize ?? DEFAULT_SPECIAL_RULE_PAGE_SIZE
  );
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [sortBy, setSortBy] = useState<SpecialRuleSortBy>(initialListState.sortBy);
  const [sortDir, setSortDir] = useState<SpecialRuleSortDir>(initialListState.sortDir);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SpecialRule> | null>(null);
  const [formStep, setFormStep] = useState(1);
  const [priorityEnabled, setPriorityEnabled] = useState(loadPriorityEnabled);
  const [priorityPanelOpen, setPriorityPanelOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [inspectorTeachingOpen, setInspectorTeachingOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [pendingSaveStatus, setPendingSaveStatus] = useState<SpecialRuleStatus>('ENABLED');
  const [saveImpact, setSaveImpact] = useState<ReturnType<typeof detectSaveImpact>>({
    overrides: [],
    ineffective: [],
  });
  const [inspectorPair, setInspectorPair] = useState<{
    promoA: PromoRef;
    promoB: PromoRef;
    labelA: string;
    labelB: string;
  } | null>(null);

  const listQuery = usePaginatedSpecialRules(rules, {
    keyword,
    status: statusFilter,
    relationScope: scopeFilter,
    interaction: interactionFilter,
    expiredOnly,
    sortBy,
    sortDir,
    page: listPage,
    pageSize: listPageSize,
  });

  const debouncedKeywordForReset = useDebouncedValue(keyword, 200);
  const skipFilterPageResetRef = useRef(true);

  useEffect(() => {
    if (skipFilterPageResetRef.current) {
      skipFilterPageResetRef.current = false;
      return;
    }
    setListPage(1);
  }, [
    debouncedKeywordForReset,
    statusFilter,
    scopeFilter,
    interactionFilter,
    expiredOnly,
    sortBy,
    sortDir,
    listPageSize,
  ]);

  useEffect(() => {
    if (view !== 'list') return;
    applySpecialRuleListUrl({
      keyword,
      status: statusFilter,
      relationScope: scopeFilter,
      interaction: interactionFilter,
      expiredOnly,
      page: listPage,
      pageSize: listPageSize,
      sortBy,
      sortDir,
    });
  }, [
    view,
    keyword,
    statusFilter,
    scopeFilter,
    interactionFilter,
    expiredOnly,
    listPage,
    listPageSize,
    sortBy,
    sortDir,
  ]);

  useEffect(() => {
    const onPopState = () => {
      const next = readSpecialRuleListUrl();
      setKeyword(next.keyword);
      setStatusFilter(next.status);
      setScopeFilter(next.relationScope);
      setInteractionFilter(next.interaction);
      setExpiredOnly(next.expiredOnly);
      setListPage(next.page);
      setListPageSize(next.pageSize ?? DEFAULT_SPECIAL_RULE_PAGE_SIZE);
      setSortBy(next.sortBy);
      setSortDir(next.sortDir);
      setView('list');
      setSelectedId(null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const selectedRule = useMemo(
    () => rules.find(r => r.id === selectedId) ?? null,
    [rules, selectedId]
  );

  const clearListFilters = () => {
    setKeyword('');
    setStatusFilter('ALL');
    setScopeFilter('ALL');
    setInteractionFilter('ALL');
    setExpiredOnly(false);
    setListPage(1);
    setListPageSize(DEFAULT_SPECIAL_RULE_PAGE_SIZE);
    setSortBy('updatedAt');
    setSortDir('desc');
  };

  const handleListSort = (nextSortBy: SpecialRuleSortBy) => {
    const next = toggleSort({ sortBy, sortDir }, nextSortBy);
    setSortBy(next.sortBy);
    setSortDir(next.sortDir);
  };

  const statusTabCounts = useMemo(
    () =>
      computeStatusTabCounts(rules, {
        keyword: debouncedKeywordForReset,
        relationScope: scopeFilter,
        interaction: interactionFilter,
        expiredOnly,
      }),
    [rules, debouncedKeywordForReset, scopeFilter, interactionFilter, expiredOnly]
  );

  const handlePageSizeChange = (size: SpecialRulePageSize) => {
    setListPageSize(size);
    setListPage(1);
  };

  const handleStatusTabChange = (status: SpecialRuleStatusFilter) => {
    setStatusFilter(status);
    setListPage(1);
  };

  const hasActiveListFilters =
    keyword.trim() !== '' ||
    statusFilter !== 'ALL' ||
    scopeFilter !== 'ALL' ||
    interactionFilter !== 'ALL' ||
    expiredOnly;

  const openCreate = () => {
    setDraft({
      id: `rule_${Date.now()}`,
      name: '',
      relationScope: 'INTER_GROUP',
      interaction: InteractionType.MUTEX,
      sideA: [],
      sideB: [],
      status: 'DISABLED',
    });
    setFormStep(1);
    setView('form');
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const openEdit = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    setSelectedId(id);
    setDraft({ ...rule });
    setFormStep(1);
    setView('form');
  };

  const toggleStatus = (id: string) => {
    setRules(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: r.status === 'ENABLED' ? 'DISABLED' : 'ENABLED',
              updatedAt: new Date().toISOString(),
            }
          : r
      )
    );
  };

  const deleteRule = (id: string) => {
    setRules(prev => prev.filter(r => r.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      setView('list');
    }
  };

  const applyPriorityRules = (updated: SpecialRule[]) => {
    setRules(updated);
  };

  const handlePriorityToggle = (enabled: boolean) => {
    setPriorityEnabled(enabled);
    savePriorityEnabled(enabled);
    if (enabled) {
      setRules(prev => preparePriorityDraft(prev));
    }
  };

  const buildDraftRule = (status?: SpecialRuleStatus): SpecialRule | null => {
    if (!draft?.name?.trim() || !draft.sideA?.length) return null;
    if (draft.relationScope === 'INTRA_GROUP' && draft.sideA.length < 2) return null;
    if (draft.relationScope === 'INTER_GROUP' && !draft.sideB?.length) return null;
    const now = new Date().toISOString();
    const resolvedStatus = status ?? (draft.status as SpecialRuleStatus) ?? 'DISABLED';
    return {
      id: draft.id ?? `${Date.now()}`,
      name: draft.name.trim(),
      relationScope: draft.relationScope as RuleRelationScope,
      interaction: draft.interaction ?? InteractionType.MUTEX,
      sideA: draft.sideA,
      sideB: draft.sideB,
      status: resolvedStatus,
      priority: draft.priority ?? rules.length + 1,
      createdAt: draft.createdAt ?? now,
      createdBy: draft.createdBy ?? '总部运营 / demo',
      updatedAt: now,
      updatedBy: '总部运营 / demo',
    };
  };

  const applySavedRule = (newRule: SpecialRule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === newRule.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newRule;
        return next;
      }
      return [{ ...newRule, priority: prev.length + 1 }, ...prev];
    });
    setSelectedId(newRule.id);
    setSaveModalOpen(false);
    setDraft(null);
    setView('detail');
    onSave?.();
  };

  const requestSave = (status: SpecialRuleStatus) => {
    const newRule = buildDraftRule(status);
    if (!newRule) return;
    if (status === 'DISABLED') {
      applySavedRule(newRule);
      return;
    }
    const impact = detectSaveImpact(rules, newRule, priorityEnabled, INSTANCE_TYPE_MAP);
    if (impact.overrides.length === 0 && impact.ineffective.length === 0) {
      applySavedRule(newRule);
      return;
    }
    setPendingSaveStatus(status);
    setSaveImpact(impact);
    setSaveModalOpen(true);
  };

  const confirmSave = () => {
    const newRule = buildDraftRule(pendingSaveStatus);
    if (!newRule) return;
    applySavedRule(newRule);
  };

  if (view === 'inspector') {
    return (
      <div className="h-full flex flex-col">
        <div className="mb-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setView('list')}
            className="flex items-center gap-1 text-[13px] text-[#595959] hover:text-brand-600"
          >
            <ArrowLeft size={14} /> 返回规则列表
          </button>
          <span className="text-[#d9d9d9]">|</span>
          <span className="text-[13px] font-medium text-[#262626]">高级 · 生效关系排查</span>
          <button
            type="button"
            onClick={() => setInspectorTeachingOpen(v => !v)}
            className="ml-auto flex items-center gap-1 text-[12px] text-brand-600 hover:underline"
          >
            <BookOpen size={13} />
            {inspectorTeachingOpen ? '收起教学示例' : '查看 A/B/C 教学示例'}
            {inspectorTeachingOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>
        {inspectorTeachingOpen && (
          <div className="mb-3 shrink-0">
            <SpecialRuleTeachingDemo
              rules={rules}
              priorityEnabled={priorityEnabled}
              compact
            />
          </div>
        )}
        <div className="flex-1 min-h-0">
          <InstanceManager
            categories={categories}
            instances={instances}
            setInstances={setInstances}
            instanceRules={instanceRules}
            onRuleChange={onRuleChange}
            onBatchRuleChange={onBatchRuleChange}
            onInstanceDelete={onInstanceDelete}
            typeMatrix={typeMatrix}
            dbInstances={dbInstances}
            onSave={onSave}
          />
        </div>
      </div>
    );
  }

  if (view === 'form' && draft) {
    return (
      <>
        <RuleForm
          draft={draft}
          setDraft={setDraft}
          step={formStep}
          setStep={setFormStep}
          categories={categories}
          instances={dbInstances}
          priorityEnabled={priorityEnabled}
          existingRules={rules}
          onCancel={() => setView('list')}
          onRequestSave={requestSave}
        />
        <SaveConflictModal
          open={saveModalOpen}
          overrides={saveImpact.overrides}
          ineffective={saveImpact.ineffective}
          confirmLabel={pendingSaveStatus === 'ENABLED' ? '确认保存并启用' : '确认保存'}
          onCancel={() => setSaveModalOpen(false)}
          onConfirm={confirmSave}
        />
      </>
    );
  }

  if (view === 'detail' && selectedRule) {
    return (
      <>
        <RuleDetail
          rule={selectedRule}
          rules={rules}
          priorityEnabled={priorityEnabled}
          onBack={() => setView('list')}
          onToggleStatus={() => toggleStatus(selectedRule.id)}
          onDelete={() => deleteRule(selectedRule.id)}
          onInspectPair={setInspectorPair}
        />
        {inspectorPair && (
          <PairInspectorPanel
            open
            promoA={inspectorPair.promoA}
            promoB={inspectorPair.promoB}
            labelA={inspectorPair.labelA}
            labelB={inspectorPair.labelB}
            coverage={getPairCoverage(
              rules,
              inspectorPair.promoA,
              inspectorPair.promoB,
              priorityEnabled
            )}
            onClose={() => setInspectorPair(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="page-card page-card--list h-full flex flex-col overflow-hidden">
      <SpecialRuleListChrome
        keyword={keyword}
        onKeywordChange={setKeyword}
        status={statusFilter}
        onStatusChange={handleStatusTabChange}
        statusCounts={statusTabCounts}
        relationScope={scopeFilter}
        onRelationScopeChange={setScopeFilter}
        interaction={interactionFilter}
        onInteractionChange={setInteractionFilter}
        expiredOnly={expiredOnly}
        onExpiredOnlyChange={setExpiredOnly}
        filterExpanded={filterExpanded}
        onFilterExpandedChange={setFilterExpanded}
        hasActiveFilters={hasActiveListFilters}
        onClearFilters={clearListFilters}
        statsHint={`已启用 ${listQuery.stats.enabled} · 组间 ${listQuery.stats.interGroup}`}
        priorityEnabled={priorityEnabled}
        bannerExpanded={bannerExpanded}
        onBannerExpandedChange={setBannerExpanded}
        onViewDefaultRules={onViewDefaultRules}
        onOpenInspector={() => setView('inspector')}
        onOpenGuide={() => setGuideOpen(true)}
        onOpenPriorityPanel={() => setPriorityPanelOpen(true)}
        onCreate={openCreate}
      />

      <PriorityConfigPanel
        open={priorityPanelOpen}
        enabled={priorityEnabled}
        rules={rules}
        onClose={() => setPriorityPanelOpen(false)}
        onToggle={handlePriorityToggle}
        onApplyPriority={applyPriorityRules}
      />

      <SpecialRuleGuide
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        rules={rules}
        priorityEnabled={priorityEnabled}
      />

      <SpecialRuleListTable
        items={listQuery.items}
        total={listQuery.total}
        page={listPage}
        totalPages={listQuery.totalPages}
        pageSize={listQuery.pageSize}
        loading={listQuery.loading}
        error={listQuery.error}
        isDebouncing={listQuery.isDebouncing}
        priorityEnabled={priorityEnabled}
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleListSort}
        onOpenPriorityPanel={() => setPriorityPanelOpen(true)}
        onPageChange={setListPage}
        onRetry={listQuery.retry}
        onToggleStatus={toggleStatus}
        onOpenDetail={openDetail}
        onEdit={openEdit}
        onDelete={deleteRule}
        poolTotal={rules.length}
        hasActiveFilters={hasActiveListFilters}
        onCreate={openCreate}
        onClearFilters={clearListFilters}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
};

function RuleDetail({
  rule,
  rules,
  priorityEnabled,
  onBack,
  onToggleStatus,
  onDelete,
  onInspectPair,
}: {
  rule: SpecialRule;
  rules: SpecialRule[];
  priorityEnabled: boolean;
  onBack: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  onInspectPair: (pair: { promoA: PromoRef; promoB: PromoRef; labelA: string; labelB: string }) => void;
}) {
  const pairStatuses = getRulePairStatuses(rule, rules, priorityEnabled, INSTANCE_TYPE_MAP);

  return (
    <div className="page-card h-full overflow-auto">
      <div className="p-4 border-b border-[#e8e8e8] flex items-center justify-between">
        <button type="button" className="flex items-center gap-1 text-[13px] text-[#595959]" onClick={onBack}>
          <ArrowLeft size={14} /> 返回列表
        </button>
        <div className="flex gap-2">
          <button type="button" className="btn btn--default" onClick={onToggleStatus}>
            {rule.status === 'ENABLED' ? '停用' : '启用'}
          </button>
          <button type="button" className="btn btn--default text-red-500" onClick={onDelete}>
            删除
          </button>
        </div>
      </div>

      {hasExpiredMembers(rule) && (
        <div className="mx-4 mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-[13px] text-amber-800 flex items-center gap-2">
          <AlertTriangle size={14} />
          本规则含已失效优惠对象，请检查是否需要更新（不会自动停用规则）
        </div>
      )}

      <div className="p-4">
        <section className="border border-[#e8e8e8] rounded p-4 max-w-2xl">
          <h3 className="text-[15px] font-semibold mb-3">规则快照</h3>
          <dl className="space-y-2 text-[13px]">
            <div className="flex">
              <dt className="w-24 text-[#8c8c8c]">规则名称</dt>
              <dd>{rule.name}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-[#8c8c8c]">规则 ID</dt>
              <dd className="font-mono text-[12px]">{rule.id}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-[#8c8c8c]">关系类型</dt>
              <dd>{rule.relationScope === 'INTRA_GROUP' ? '组内关系' : '组间关系'}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-[#8c8c8c]">关系</dt>
              <dd>{interactionLabel(rule.interaction)}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-[#8c8c8c]">规则对象</dt>
              <dd>
                {rule.sideA.map(m => (
                  <span
                    key={m.refId}
                    className={`inline-block mr-1 mb-1 px-2 py-0.5 rounded text-[12px] border ${
                      m.expired ? 'bg-gray-100 text-gray-400 line-through' : 'bg-brand-50 text-brand-700 border-brand-200'
                    }`}
                  >
                    {m.refName}
                  </span>
                ))}
              </dd>
            </div>
            {rule.relationScope === 'INTER_GROUP' && (
              <div className="flex">
                <dt className="w-24 text-[#8c8c8c]">限制对象</dt>
                <dd>
                  {(rule.sideB ?? []).map(m => (
                    <span
                      key={m.refId}
                      className={`inline-block mr-1 mb-1 px-2 py-0.5 rounded text-[12px] border ${
                        m.expired ? 'bg-gray-100 text-gray-400 line-through' : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}
                    >
                      {m.refName}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            <div className="flex">
              <dt className="w-24 text-[#8c8c8c]">展开关系对</dt>
              <dd>{countRulePairs(rule)} 对</dd>
            </div>
            <div className="flex">
              <dt className="w-24 text-[#8c8c8c]">创建时间</dt>
              <dd>{rule.createdAt.replace('T', ' ').slice(0, 19)}</dd>
            </div>
            {rule.priority != null && (
              <div className="flex">
                <dt className="w-24 text-[#8c8c8c]">优先级</dt>
                <dd>{rule.priority}</dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <div className="px-4 pb-4">
        <h4 className="text-[13px] font-medium mb-2">本规则关系对生效状态</h4>
        <div className="border border-[#e8e8e8] rounded overflow-hidden">
          <table className="table">
            <thead>
              <tr>
                <th>对象 A</th>
                <th>对象 B</th>
                <th>本规则设定</th>
                <th>实际生效</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {pairStatuses.map(ps => (
                <tr key={`${ps.promoA.id}-${ps.promoB.id}`}>
                  <td>{ps.labelA}</td>
                  <td>{ps.labelB}</td>
                  <td>{interactionLabel(ps.ruleInteraction)}</td>
                  <td>
                    {ps.effective ? (
                      <span className="text-brand-600 font-medium">
                        {interactionLabel(ps.finalInteraction!)}
                      </span>
                    ) : (
                      <span className="text-amber-600 text-[12px]">
                        未生效
                        {ps.winningRule && `（听「${ps.winningRule.name}」）`}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-[12px] text-brand-600 hover:underline"
                      onClick={() =>
                        onInspectPair({
                          promoA: ps.promoA,
                          promoB: ps.promoB,
                          labelA: ps.labelA,
                          labelB: ps.labelB,
                        })
                      }
                    >
                      命中链
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const RELATION_META: Record<
  InteractionType,
  { label: string; icon: typeof Layers; example: string; accent: string; active: string }
> = {
  [InteractionType.ITEM_MUTEX]: {
    label: '共享（不叠加）',
    icon: Layers,
    example: '可同时参与，取最优不叠加',
    accent: 'text-amber-600',
    active: 'border-amber-400 bg-amber-50',
  },
  [InteractionType.MUTEX]: {
    label: '互斥',
    icon: Ban,
    example: '只能二选一',
    accent: 'text-rose-600',
    active: 'border-rose-400 bg-rose-50',
  },
  [InteractionType.ALLOW]: {
    label: '共享且叠加',
    icon: Link2,
    example: '可同时生效并叠加',
    accent: 'text-brand-600',
    active: 'border-brand-400 bg-brand-50',
  },
  [InteractionType.OVERWRITE]: {
    label: '覆盖',
    icon: Ban,
    example: '',
    accent: 'text-gray-500',
    active: 'border-gray-300 bg-gray-50',
  },
};

function FormSection({
  index,
  title,
  hint,
  children,
}: {
  index: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
          {index}
        </span>
        <h3 className="text-[13px] font-semibold text-[#262626]">{title}</h3>
        {hint && <span className="text-[11px] text-[#8c8c8c]">{hint}</span>}
      </div>
      <div className="pl-7">{children}</div>
    </section>
  );
}

function RangeCard({
  active,
  title,
  desc,
  variant,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  variant: 'intra' | 'inter';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 border rounded transition-colors ${
        active ? 'border-brand-500 bg-brand-50' : 'border-[#e8e8e8] hover:border-brand-300 bg-white'
      }`}
    >
      <svg viewBox="0 0 88 40" className="w-full h-9 mb-2">
        {variant === 'intra' ? (
          <g fill="none" stroke={active ? '#00b578' : '#bfbfbf'} strokeWidth="1.5">
            <circle cx="44" cy="8" r="4" fill={active ? '#00b578' : '#d9d9d9'} stroke="none" />
            <circle cx="22" cy="30" r="4" fill={active ? '#00b578' : '#d9d9d9'} stroke="none" />
            <circle cx="66" cy="30" r="4" fill={active ? '#00b578' : '#d9d9d9'} stroke="none" />
            <path d="M44 8 L22 30 M44 8 L66 30 M22 30 L66 30" />
          </g>
        ) : (
          <g fill="none" stroke={active ? '#00b578' : '#bfbfbf'} strokeWidth="1.5">
            <circle cx="20" cy="12" r="4" fill={active ? '#00b578' : '#d9d9d9'} stroke="none" />
            <circle cx="20" cy="28" r="4" fill={active ? '#00b578' : '#d9d9d9'} stroke="none" />
            <circle cx="68" cy="12" r="4" fill={active ? '#f97316' : '#d9d9d9'} stroke="none" />
            <circle cx="68" cy="28" r="4" fill={active ? '#f97316' : '#d9d9d9'} stroke="none" />
            <path d="M20 12 L68 12 M20 12 L68 28 M20 28 L68 12 M20 28 L68 28" />
          </g>
        )}
      </svg>
      <div className={`text-[13px] font-medium ${active ? 'text-brand-700' : 'text-[#262626]'}`}>
        {title}
      </div>
      <div className="text-[11px] text-[#8c8c8c] mt-0.5">{desc}</div>
    </button>
  );
}

function RelationCard({
  interaction,
  active,
  onClick,
}: {
  interaction: InteractionType;
  active: boolean;
  onClick: () => void;
}) {
  const meta = RELATION_META[interaction];
  const Icon = meta.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-3 border rounded transition-colors ${
        active ? meta.active : 'border-[#e8e8e8] hover:border-brand-300 bg-white'
      }`}
    >
      <Icon size={18} className={`${meta.accent} mb-1.5`} />
      <div className="text-[13px] font-medium text-[#262626]">{meta.label}</div>
      <div className="text-[11px] text-[#8c8c8c] mt-0.5">{meta.example}</div>
    </button>
  );
}

function RelationBadge({ interaction }: { interaction: InteractionType }) {
  const meta = RELATION_META[interaction];
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${meta.accent}`}>
      <meta.icon size={12} />
      {meta.label}
    </span>
  );
}

interface PickerGroup {
  key: string;
  title: string;
  subtitle?: string;
  items: RuleMember[];
}

const PICKER_TYPE_PAGE_SIZE = 40;
const PICKER_INSTANCE_ROW_HEIGHT = 68;
const PICKER_CATEGORY_ROW_HEIGHT = 76;

function toTypeMember(cat: PromotionCategory): RuleMember {
  return { refType: 'TYPE', refId: cat.id, refName: cat.name };
}

function toInstanceMember(inst: PromoInstance): RuleMember {
  return { refType: 'INSTANCE', refId: inst.id, refName: inst.name };
}

function formatEffectiveRange(inst: PromoInstance): string {
  const fmt = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };
  if (!inst.effectiveStart && !inst.effectiveEnd) return '长期有效';
  return `${fmt(inst.effectiveStart)} ~ ${fmt(inst.effectiveEnd)}`;
}

const INSTANCE_STATUS_META: Record<
  PromoInstanceStatus,
  { label: string; className: string }
> = {
  ENABLED: { label: '生效中', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DISABLED: { label: '已停用', className: 'bg-[#f5f5f5] text-[#8c8c8c] border-[#e8e8e8]' },
  EXPIRED: { label: '已过期', className: 'bg-rose-50 text-rose-600 border-rose-200' },
  PENDING: { label: '未开始', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

function InstanceStatusBadge({ status }: { status: PromoInstanceStatus }) {
  const meta = INSTANCE_STATUS_META[status];
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${meta.className}`}>
      {meta.label}
    </span>
  );
}

function PickerTypeRow({
  member,
  selected,
  typeOnly,
  onToggle,
}: {
  member: RuleMember;
  selected: boolean;
  typeOnly?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2 px-3 py-2 text-[13px] text-left transition-colors ${
        selected ? 'bg-brand-50 text-brand-700' : 'hover:bg-[#fafafa] text-[#262626]'
      }`}
    >
      {selected ? (
        <CheckSquare size={14} className="text-brand-600 shrink-0" />
      ) : (
        <Square size={14} className="text-[#bfbfbf] shrink-0" />
      )}
      <span className="flex-1 truncate">{member.refName}</span>
      {typeOnly ? (
        <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded border border-amber-100 shrink-0">
          仅类型
        </span>
      ) : (
        <span className="text-[10px] text-[#bfbfbf] shrink-0">类型</span>
      )}
    </button>
  );
}

function PickerInstanceRow({
  inst,
  selected,
  disabled,
  onToggle,
}: {
  inst: PromoInstance;
  selected: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const status = resolveInstanceStatus(inst);
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`w-full h-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors overflow-hidden border-b border-[#f5f5f5] ${
        disabled ? 'opacity-40 cursor-not-allowed' : selected ? 'bg-brand-50' : 'hover:bg-[#fafafa]'
      }`}
    >
      <div className="pt-0.5 shrink-0">
        {selected ? (
          <CheckSquare size={14} className="text-brand-600" />
        ) : (
          <Square size={14} className="text-[#bfbfbf]" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[13px] truncate ${selected ? 'text-brand-700 font-medium' : 'text-[#262626]'}`}>
            {inst.name}
          </span>
          <InstanceStatusBadge status={status} />
        </div>
        <div className="text-[10px] text-[#bfbfbf] truncate mt-0.5">{inst.id}</div>
        <div className="text-[10px] text-[#8c8c8c] mt-0.5">{formatEffectiveRange(inst)}</div>
      </div>
    </button>
  );
}

function ObjectPickerModal({
  open,
  label,
  categories,
  instances,
  initialValue,
  onConfirm,
  onClose,
}: {
  open: boolean;
  label: string;
  categories: PromotionCategory[];
  instances: PromoInstance[];
  initialValue: RuleMember[];
  onConfirm: (members: RuleMember[]) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<RuleMember[]>(initialValue);
  const [tab, setTab] = useState<'TYPE' | 'INSTANCE'>('TYPE');
  const [typeSearch, setTypeSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'ALL' | PromoGroup>('ALL');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  const [typePage, setTypePage] = useState<Record<string, number>>({});

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [categorySearch, setCategorySearch] = useState('');
  const [instanceSearch, setInstanceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstanceStatusFilter>('ALL');
  const [selectAllLoading, setSelectAllLoading] = useState(false);

  const paginatedInstances = usePaginatedInstances(
    instances,
    selectedCategoryId,
    instanceSearch,
    statusFilter,
    open && tab === 'INSTANCE'
  );

  const instanceCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    instances.forEach(i => map.set(i.categoryId, (map.get(i.categoryId) ?? 0) + 1));
    return map;
  }, [instances]);

  const pickInitialCategoryId = (members: RuleMember[]) => {
    const instMember = members.find(m => m.refType === 'INSTANCE');
    if (instMember) {
      const inst = instances.find(i => i.id === instMember.refId);
      if (inst) return inst.categoryId;
    }
    const typeMember = members.find(m => m.refType === 'TYPE');
    if (typeMember) return typeMember.refId;
    const firstWithInstances = categories.find(
      c => getCategoryInstanceMode(c) === 'INSTANCE' && (instanceCountByCategory.get(c.id) ?? 0) > 0
    );
    return firstWithInstances?.id ?? categories[0]?.id ?? null;
  };

  const pickInitialTab = (members: RuleMember[]): 'TYPE' | 'INSTANCE' => {
    if (members.some(m => m.refType === 'INSTANCE')) return 'INSTANCE';
    return 'TYPE';
  };

  const instanceCapableCategoryCount = useMemo(
    () => countInstanceCapableCategories(categories),
    [categories]
  );

  useEffect(() => {
    if (!open) return;
    setDraft(initialValue);
    setTab(pickInitialTab(initialValue));
    setTypeSearch('');
    setGroupFilter('ALL');
    setOpenGroups(new Set());
    setTypePage({});
    setCategorySearch('');
    setInstanceSearch('');
    setStatusFilter('ALL');
    setSelectAllLoading(false);
    setSelectedCategoryId(pickInitialCategoryId(initialValue));
  }, [open, initialValue]);

  const typeQuery = typeSearch.trim().toLowerCase();
  const categoryQuery = categorySearch.trim().toLowerCase();
  const isSel = (id: string) => draft.some(m => m.refId === id);
  const isTypeSel = (catId: string) => draft.some(m => m.refType === 'TYPE' && m.refId === catId);

  const typeGroups = useMemo((): PickerGroup[] => {
    return PROMO_GROUP_ORDER.filter(g => groupFilter === 'ALL' || g === groupFilter)
      .map(g => ({
        key: g,
        title: g,
        items: categories
          .filter(
            c =>
              c.group === g &&
              (c.name.toLowerCase().includes(typeQuery) || c.description.toLowerCase().includes(typeQuery))
          )
          .map(toTypeMember),
      }))
      .filter(x => x.items.length > 0);
  }, [categories, typeQuery, groupFilter]);

  const categoryRows = useMemo(() => {
    return categories
      .filter(c => {
        if (groupFilter !== 'ALL' && c.group !== groupFilter) return false;
        if (!categoryQuery) return true;
        return (
          c.name.toLowerCase().includes(categoryQuery) ||
          c.group.toLowerCase().includes(categoryQuery)
        );
      })
      .sort((a, b) => {
        const gDiff = PROMO_GROUP_ORDER.indexOf(a.group) - PROMO_GROUP_ORDER.indexOf(b.group);
        if (gDiff !== 0) return gDiff;
        return a.name.localeCompare(b.name, 'zh-CN');
      });
  }, [categories, groupFilter, categoryQuery]);

  const selectedCategory = useMemo(
    () => categories.find(c => c.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId]
  );
  const selectedIsTypeOnly = selectedCategory ? isTypeOnlyCategory(selectedCategory) : false;

  const filteredInstancesLocal = useMemo(() => {
    if (!selectedCategoryId) return [];
    return filterInstancesLocally(instances, {
      categoryId: selectedCategoryId,
      keyword: instanceSearch,
      status: statusFilter,
    });
  }, [instances, selectedCategoryId, instanceSearch, statusFilter]);

  useEffect(() => {
    setOpenGroups(new Set(typeGroups.map(g => g.key)));
    setTypePage({});
  }, [typeQuery, groupFilter, tab, typeGroups]);

  useEffect(() => {
    if (tab !== 'INSTANCE') return;
    if (selectedCategoryId && categoryRows.some(c => c.id === selectedCategoryId)) return;
    setSelectedCategoryId(categoryRows[0]?.id ?? null);
  }, [tab, categoryRows, selectedCategoryId]);

  const toggleMember = (m: RuleMember) =>
    setDraft(prev =>
      isSel(m.refId) ? prev.filter(x => x.refId !== m.refId) : [...prev, m]
    );

  const clearCategoryRefs = (catId: string, prev: RuleMember[]) => {
    const instIds = new Set(instances.filter(i => i.categoryId === catId).map(i => i.id));
    return prev.filter(m => m.refId !== catId && !(m.refType === 'INSTANCE' && instIds.has(m.refId)));
  };

  const toggleTypeForCategory = (cat: PromotionCategory) => {
    const member = toTypeMember(cat);
    setDraft(prev => {
      if (isTypeSel(cat.id)) return prev.filter(m => m.refId !== cat.id);
      return [...clearCategoryRefs(cat.id, prev), member];
    });
  };

  const toggleInstance = (inst: PromoInstance) => {
    const member = toInstanceMember(inst);
    setDraft(prev => {
      if (isSel(inst.id)) return prev.filter(m => m.refId !== inst.id);
      const withoutType = prev.filter(m => !(m.refType === 'TYPE' && m.refId === inst.categoryId));
      return [...withoutType, member];
    });
  };

  const selectAllFilteredInstances = async () => {
    if (!selectedCategory || isTypeSel(selectedCategory.id)) return;
    setSelectAllLoading(true);
    try {
      const all = await queryAllFilteredInstances(instances, {
        categoryId: selectedCategory.id,
        keyword: instanceSearch,
        status: statusFilter,
      });
      const allSelected = all.length > 0 && all.every(i => isSel(i.id));
      if (allSelected) {
        const ids = new Set(all.map(i => i.id));
        setDraft(prev => prev.filter(m => !(m.refType === 'INSTANCE' && ids.has(m.refId))));
        return;
      }
      const members = all.map(toInstanceMember);
      setDraft(prev => {
        const base = clearCategoryRefs(selectedCategory.id, prev);
        const existing = new Set(base.map(m => m.refId));
        const toAdd = members.filter(m => !existing.has(m.refId));
        return [...base, ...toAdd];
      });
    } finally {
      setSelectAllLoading(false);
    }
  };

  const getTypeGroupVisibleItems = (group: PickerGroup) => {
    const limit = typePage[group.key] ?? PICKER_TYPE_PAGE_SIZE;
    return group.items.slice(0, limit);
  };

  const loadMoreTypeGroup = (group: PickerGroup) => {
    setTypePage(prev => ({
      ...prev,
      [group.key]: (prev[group.key] ?? PICKER_TYPE_PAGE_SIZE) + PICKER_TYPE_PAGE_SIZE,
    }));
  };

  const toggleTypeGroup = (key: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleTypeGroupAll = (items: RuleMember[]) => {
    const allSelected = items.every(i => isSel(i.refId));
    if (allSelected) {
      const ids = new Set(items.map(i => i.refId));
      setDraft(prev => prev.filter(m => !ids.has(m.refId)));
    } else {
      const existing = new Set(draft.map(m => m.refId));
      const toAdd = items.filter(i => !existing.has(i.refId));
      setDraft(prev => [...prev, ...toAdd]);
    }
  };

  const groupTabs: { id: 'ALL' | PromoGroup; label: string }[] = [
    { id: 'ALL', label: '全部分类' },
    ...PROMO_GROUP_ORDER.map(g => ({ id: g, label: g })),
  ];

  const typeSelectedForCategory = selectedCategory ? isTypeSel(selectedCategory.id) : false;
  const selectedInstanceCountInCategory = selectedCategory
    ? draft.filter(
        m =>
          m.refType === 'INSTANCE' &&
          instances.find(i => i.id === m.refId)?.categoryId === selectedCategory.id
      ).length
    : 0;
  const allFilteredSelected =
    filteredInstancesLocal.length > 0 && filteredInstancesLocal.every(i => isSel(i.id));
  const instanceListItems = paginatedInstances.items;
  const instanceListTotal = paginatedInstances.total;

  const renderTypeTab = () => (
    <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0 custom-scrollbar">
      {typeGroups.length === 0 ? (
        <div className="text-center text-[13px] text-[#bfbfbf] py-12">无匹配类型</div>
      ) : (
        <div className="space-y-1">
          {typeGroups.map(group => {
            const isGroupOpen = openGroups.has(group.key);
            const visibleItems = getTypeGroupVisibleItems(group);
            const hasMore = visibleItems.length < group.items.length;
            const selCount = group.items.filter(i => isSel(i.refId)).length;
            const allInGroup = selCount === group.items.length && group.items.length > 0;

            return (
              <div key={group.key} className="border border-[#f0f0f0] rounded overflow-hidden">
                <div className="flex items-center gap-1 bg-[#fafafa] border-b border-[#f0f0f0]">
                  <button
                    type="button"
                    onClick={() => toggleTypeGroup(group.key)}
                    className="flex-1 flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-left min-w-0"
                  >
                    {isGroupOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    <span className="flex-1 truncate text-[#262626]">{group.title}</span>
                    {selCount > 0 && <span className="text-[10px] text-brand-600">已选 {selCount}</span>}
                    <span className="text-[10px] text-[#bfbfbf]">{group.items.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTypeGroupAll(group.items)}
                    className="px-2 py-2 border-l border-[#f0f0f0] text-[#bfbfbf] hover:text-brand-600"
                    title="全选本组"
                  >
                    {allInGroup ? <CheckSquare size={14} className="text-brand-600" /> : <Square size={14} />}
                  </button>
                </div>
                {isGroupOpen && (
                  <div className="divide-y divide-[#f5f5f5]">
                    {visibleItems.map(m => {
                      const cat = categories.find(c => c.id === m.refId);
                      return (
                        <PickerTypeRow
                          key={m.refId}
                          member={m}
                          selected={isSel(m.refId)}
                          typeOnly={cat ? isTypeOnlyCategory(cat) : false}
                          onToggle={() => toggleMember(m)}
                        />
                      );
                    })}
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => loadMoreTypeGroup(group)}
                        className="w-full py-2 text-[12px] text-brand-600 hover:bg-brand-50"
                      >
                        加载更多（还剩 {group.items.length - visibleItems.length} 条）
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderInstanceTab = () => (
    <div className="flex-1 flex min-h-0">
      {/* 左栏 · 优惠类型 */}
      <div className="w-[200px] lg:w-[220px] shrink-0 border-r border-[#f0f0f0] flex flex-col bg-[#fafafa]">
        <div className="px-2.5 py-2 border-b border-[#f0f0f0] space-y-2 shrink-0">
          <div className="text-[11px] font-medium text-[#8c8c8c]">优惠类型</div>
          <div className="relative">
            <Search size={11} className="absolute left-2 top-2 text-[#bfbfbf]" />
            <input
              className="w-full pl-6 pr-2 py-1.5 text-[12px] border border-[#e8e8e8] rounded bg-white focus:outline-none focus:border-brand-500"
              placeholder="搜类型"
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 min-h-0">
          {categoryRows.length === 0 ? (
            <div className="text-center text-[12px] text-[#bfbfbf] py-8 px-2">无匹配类型</div>
          ) : (
            <VirtualList
              className="h-full custom-scrollbar py-1"
              items={categoryRows}
              rowHeight={PICKER_CATEGORY_ROW_HEIGHT}
              getItemKey={cat => cat.id}
              renderItem={cat => {
                const typeOnly = isTypeOnlyCategory(cat);
                const count = instanceCountByCategory.get(cat.id) ?? 0;
                const active = selectedCategoryId === cat.id;
                const typeSelected = isTypeSel(cat.id);
                const instSelected = draft.filter(
                  m =>
                    m.refType === 'INSTANCE' &&
                    instances.find(i => i.id === m.refId)?.categoryId === cat.id
                ).length;

                return (
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`w-full h-full text-left px-2.5 py-2 border-l-2 transition-colors ${
                      active ? 'border-brand-500 bg-white' : 'border-transparent hover:bg-white/70'
                    }`}
                  >
                    <div className={`text-[13px] truncate ${active ? 'text-brand-700 font-medium' : 'text-[#262626]'}`}>
                      {cat.name}
                    </div>
                    <div className="text-[10px] text-[#bfbfbf] mt-0.5 truncate">{cat.group}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {typeOnly ? (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1 rounded border border-amber-100">
                          仅类型
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#8c8c8c]">{count} 个实例</span>
                      )}
                      {typeSelected && (
                        <span className="text-[10px] text-brand-600 bg-brand-50 px-1 rounded">已选类型</span>
                      )}
                      {instSelected > 0 && (
                        <span className="text-[10px] text-brand-600">+{instSelected}</span>
                      )}
                    </div>
                  </button>
                );
              }}
            />
          )}
        </div>
      </div>

      {/* 右栏 · 活动实例 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {!selectedCategory ? (
          <div className="flex-1 flex items-center justify-center text-[13px] text-[#bfbfbf] px-6 text-center">
            请从左侧选择优惠类型，查看其下的活动实例或选择整个类型
          </div>
        ) : selectedIsTypeOnly ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 text-center">
            <div className="text-[15px] font-medium text-[#262626]">{selectedCategory.name}</div>
            <div className="text-[11px] text-[#8c8c8c] mt-1">{selectedCategory.group}</div>
            <p className="text-[13px] text-[#595959] mt-4 leading-relaxed max-w-sm">
              该优惠类型无活动实例，特例规则请直接选择<strong className="font-medium">整个类型</strong>。
            </p>
            <p className="text-[12px] text-[#bfbfbf] mt-2">
              适用于支付方式、平台团购、消费特权、储值搭售折扣等
            </p>
            <button
              type="button"
              onClick={() => toggleTypeForCategory(selectedCategory)}
              className={`mt-5 px-4 py-2 text-[13px] rounded border transition-colors ${
                typeSelectedForCategory
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-brand-600 border-brand-300 hover:bg-brand-50'
              }`}
            >
              {typeSelectedForCategory ? '已选整个类型' : '选择整个类型'}
            </button>
          </div>
        ) : (
          <>
            <div className="px-3 py-2.5 border-b border-[#f0f0f0] shrink-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-[#262626] truncate">{selectedCategory.name}</div>
                  <div className="text-[11px] text-[#8c8c8c] mt-0.5">
                    {selectedCategory.group} · 共 {instanceCountByCategory.get(selectedCategory.id) ?? 0} 个实例
                    {instanceListTotal !== (instanceCountByCategory.get(selectedCategory.id) ?? 0) &&
                      ` · 筛选后 ${instanceListTotal} 个`}
                    {paginatedInstances.isDebouncing && ' · 搜索中…'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleTypeForCategory(selectedCategory)}
                    className={`px-2 py-1 text-[11px] rounded border transition-colors ${
                      typeSelectedForCategory
                        ? 'bg-brand-500 text-white border-brand-500'
                        : 'bg-white text-brand-600 border-brand-200 hover:bg-brand-50'
                    }`}
                  >
                    {typeSelectedForCategory ? '已选整个类型' : '选择整个类型'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void selectAllFilteredInstances()}
                    disabled={
                      instanceListTotal === 0 || typeSelectedForCategory || selectAllLoading
                    }
                    className="px-2 py-1 text-[11px] rounded border bg-white text-[#595959] border-[#d9d9d9] hover:border-brand-300 disabled:opacity-40"
                  >
                    {selectAllLoading
                      ? '处理中…'
                      : allFilteredSelected
                        ? '取消全选'
                        : `全选筛选结果 (${instanceListTotal})`}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Search size={12} className="absolute left-2 top-2 text-[#bfbfbf]" />
                  <input
                    className="w-full pl-7 pr-2 py-1.5 text-[12px] border border-[#e8e8e8] rounded focus:outline-none focus:border-brand-500"
                    placeholder="搜索实例名称或 ID"
                    value={instanceSearch}
                    onChange={e => setInstanceSearch(e.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as InstanceStatusFilter)}
                  className="text-[12px] border border-[#e8e8e8] rounded px-2 py-1.5 bg-white focus:outline-none focus:border-brand-500"
                >
                  <option value="ALL">全部状态</option>
                  <option value="ENABLED">生效中</option>
                  <option value="PENDING">未开始</option>
                  <option value="DISABLED">已停用</option>
                  <option value="EXPIRED">已过期</option>
                </select>
              </div>

              {typeSelectedForCategory && (
                <div className="text-[11px] text-brand-700 bg-brand-50 border border-brand-100 rounded px-2 py-1">
                  已选择「{selectedCategory.name}」整个类型，规则将作用于该类型下全部实例。如需指定部分实例，请先取消类型选择。
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              {instanceListTotal === 0 && !paginatedInstances.loading ? (
                <div className="flex-1 flex items-center justify-center text-[13px] text-[#bfbfbf]">
                  无匹配实例
                </div>
              ) : (
                <>
                  <VirtualList
                    className="flex-1 custom-scrollbar"
                    items={instanceListItems}
                    rowHeight={PICKER_INSTANCE_ROW_HEIGHT}
                    getItemKey={inst => inst.id}
                    onEndReached={paginatedInstances.loadMore}
                    renderItem={inst => (
                      <PickerInstanceRow
                        inst={inst}
                        selected={isSel(inst.id)}
                        disabled={typeSelectedForCategory}
                        onToggle={() => toggleInstance(inst)}
                      />
                    )}
                  />
                  {(paginatedInstances.loading || paginatedInstances.hasMore) && (
                    <div className="shrink-0 px-3 py-2 border-t border-[#f0f0f0] bg-[#fafafa] text-[11px] text-[#8c8c8c] text-center">
                      {paginatedInstances.loading
                        ? '加载中…'
                        : `已加载 ${instanceListItems.length} / ${instanceListTotal}，继续滚动加载更多`}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-3 py-1.5 border-t border-[#f0f0f0] bg-[#fafafa] text-[11px] text-[#8c8c8c] shrink-0">
              本类型已选：
              {typeSelectedForCategory ? ' 整个类型' : ` ${selectedInstanceCountInCategory} 个实例`}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      size="lg"
      zIndex={60}
      panelClassName="h-[min(640px,calc(100vh-2rem))]"
    >
        <div className="px-4 py-3 border-b border-[#e8e8e8] flex items-center justify-between bg-[#fafafa] shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-[15px] font-semibold text-[#262626] truncate">{label}</h3>
            <p className="text-[12px] text-[#8c8c8c] mt-0.5">
              {tab === 'INSTANCE'
                ? '部分类型无活动实例，请直接选择整个类型；其余类型可在右侧选实例'
                : '支持按业务分类筛选优惠类型'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 hover:bg-[#f0f0f0] rounded shrink-0">
            <X size={18} className="text-[#8c8c8c]" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-[#f0f0f0] space-y-2 shrink-0 bg-white">
          <div className="flex flex-wrap items-center gap-2">
            {(['TYPE', 'INSTANCE'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-3 py-1 text-[12px] rounded ${
                  tab === t ? 'bg-brand-500 text-white' : 'bg-[#f5f5f5] text-[#595959] hover:bg-[#ebebeb]'
                }`}
              >
                {t === 'TYPE'
                  ? `优惠类型 (${categories.length})`
                  : `活动实例 (${instanceCapableCategoryCount} 类有可实例)`}
              </button>
            ))}
            <span className="text-[11px] text-[#bfbfbf] ml-auto shrink-0">已选 {draft.length} 项</span>
          </div>

          {tab === 'TYPE' && (
            <>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-[#bfbfbf]" />
                <input
                  className="w-full pl-8 pr-3 py-2 text-[13px] border border-[#e8e8e8] rounded focus:outline-none focus:border-brand-500"
                  placeholder="搜索优惠类型"
                  value={typeSearch}
                  onChange={e => setTypeSearch(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex flex-wrap items-center gap-1 max-h-[52px] overflow-y-auto custom-scrollbar">
                {groupTabs.map(tabItem => (
                  <button
                    key={tabItem.id}
                    type="button"
                    onClick={() => setGroupFilter(tabItem.id)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors shrink-0 ${
                      groupFilter === tabItem.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-[#f5f5f5] text-[#595959] hover:bg-[#ebebeb]'
                    }`}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {tab === 'INSTANCE' && (
            <div className="space-y-2">
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                支付方式、平台团购、消费特权、储值搭售折扣等无活动实例，请直接选择整个类型
              </p>
              <PickerQuickSearch
                categories={categories}
                instances={instances}
                groupFilter={groupFilter}
                onSelectType={cat => {
                  if (isTypeOnlyCategory(cat)) {
                    toggleTypeForCategory(cat);
                    setSelectedCategoryId(cat.id);
                    return;
                  }
                  setTab('INSTANCE');
                  setSelectedCategoryId(cat.id);
                }}
                onSelectInstance={(inst, cat) => {
                  setTab('INSTANCE');
                  setSelectedCategoryId(cat.id);
                  toggleInstance(inst);
                }}
              />
              <div className="flex flex-wrap items-center gap-1">
                {groupTabs.map(tabItem => (
                  <button
                    key={tabItem.id}
                    type="button"
                    onClick={() => setGroupFilter(tabItem.id)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors shrink-0 ${
                      groupFilter === tabItem.id
                        ? 'bg-brand-500 text-white'
                        : 'bg-[#f5f5f5] text-[#595959] hover:bg-[#ebebeb]'
                    }`}
                  >
                    {tabItem.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {tab === 'TYPE' ? renderTypeTab() : renderInstanceTab()}

        {draft.length > 0 && (
          <div className="px-4 py-2 border-t border-[#f0f0f0] bg-[#fafafa] max-h-[72px] overflow-y-auto shrink-0 custom-scrollbar">
            <div className="flex flex-wrap gap-1">
              {draft.map(m => (
                <span
                  key={m.refId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border bg-white text-[#595959] border-[#e8e8e8] max-w-[160px]"
                >
                  <span className="truncate">{m.refName}</span>
                  <button
                    type="button"
                    className="hover:text-rose-500 shrink-0"
                    onClick={() => toggleMember(m)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 py-2.5 border-t border-[#e8e8e8] bg-[#fafafa] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[12px] text-[#8c8c8c] shrink-0">已选 {draft.length} 项</span>
            {draft.length > 0 && (
              <button
                type="button"
                onClick={() => setDraft([])}
                className="text-[12px] text-[#8c8c8c] hover:text-rose-500 shrink-0"
              >
                清空
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-[13px] border border-[#d9d9d9] rounded bg-white text-[#595959] hover:border-[#bfbfbf]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => onConfirm(draft)}
              className="px-3 py-1.5 text-[13px] rounded bg-brand-500 text-white hover:bg-brand-600"
            >
              确定
            </button>
          </div>
        </div>
    </ModalShell>
  );
}

function ObjectPickerField({
  label,
  accent,
  categories,
  instances,
  value,
  onChange,
}: {
  label: string;
  accent: 'brand' | 'orange';
  categories: PromotionCategory[];
  instances: PromoInstance[];
  value: RuleMember[];
  onChange: (members: RuleMember[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const remove = (id: string) => onChange(value.filter(m => m.refId !== id));
  const categoryById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const memberTypeLabel = (m: RuleMember) => {
    if (m.refType === 'INSTANCE') return '实例';
    const cat = categoryById.get(m.refId);
    if (cat && isTypeOnlyCategory(cat)) return '类型·无实例';
    return '类型';
  };

  const chipCls =
    accent === 'orange'
      ? 'bg-orange-50 text-orange-700 border-orange-200'
      : 'bg-brand-50 text-brand-700 border-brand-200';

  const btnCls =
    accent === 'orange'
      ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
      : 'border-brand-300 text-brand-600 hover:bg-brand-50';

  return (
    <>
      <div className="border border-[#e8e8e8] rounded bg-white">
        <div className="px-3 py-2.5 border-b border-[#f0f0f0] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-[#262626]">{label}</div>
            <div className="text-[11px] text-[#8c8c8c] mt-0.5">
              {value.length > 0
                ? `已选 ${value.length} 个对象`
                : '尚未选择；支付方式、平台团购等无活动实例，请选类型'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`shrink-0 flex items-center gap-1 px-3 py-1.5 text-[12px] border rounded transition-colors ${btnCls}`}
          >
            <Pencil size={12} />
            {value.length > 0 ? '编辑' : '选择对象'}
          </button>
        </div>

        {value.length > 0 ? (
          <div className="px-3 py-2.5 flex flex-wrap gap-1 max-h-28 overflow-auto">
            {value.map(m => (
              <span
                key={m.refId}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${chipCls}`}
              >
                {m.refName}
                <span className="text-[9px] opacity-60">{memberTypeLabel(m)}</span>
                <button type="button" className="hover:text-rose-500" onClick={() => remove(m.refId)}>
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full px-3 py-6 text-[12px] text-[#bfbfbf] hover:text-brand-600 hover:bg-[#fafafa] transition-colors"
          >
            点击选择优惠类型；支付方式、平台团购等无活动实例
          </button>
        )}
      </div>

      <ObjectPickerModal
        open={open}
        label={label}
        categories={categories}
        instances={instances}
        initialValue={value}
        onConfirm={members => {
          onChange(members);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

function getFormValidationIssues(
  draft: Partial<SpecialRule>,
  sideA: RuleMember[],
  sideB: RuleMember[],
  isIntra: boolean
): string[] {
  const issues: string[] = [];
  if (!draft.name?.trim()) issues.push('请填写规则名称');
  if (sideA.length === 0) {
    issues.push(isIntra ? '请选择至少 2 个组内对象' : '请选择左侧规则对象');
  } else if (isIntra && sideA.length < 2) {
    issues.push('组内关系至少选择 2 个对象');
  }
  if (!isIntra && sideB.length === 0) issues.push('请选择右侧限制对象');
  return issues;
}

function RuleForm({
  draft,
  setDraft,
  categories,
  instances,
  priorityEnabled,
  existingRules,
  onCancel,
  onRequestSave,
}: {
  draft: Partial<SpecialRule>;
  setDraft: React.Dispatch<React.SetStateAction<Partial<SpecialRule> | null>>;
  step: number;
  setStep: (n: number) => void;
  categories: PromotionCategory[];
  instances: PromoInstance[];
  priorityEnabled: boolean;
  existingRules: SpecialRule[];
  onCancel: () => void;
  onRequestSave: (status: SpecialRuleStatus) => void;
}) {
  const isNew = !draft.createdAt;
  const isIntra = draft.relationScope === 'INTRA_GROUP';
  const sideA = draft.sideA ?? [];
  const sideB = draft.sideB ?? [];
  const interaction = draft.interaction ?? InteractionType.MUTEX;
  const validationIssues = getFormValidationIssues(draft, sideA, sideB, isIntra);
  const ready = validationIssues.length === 0;
  const [saveHint, setSaveHint] = useState<string | null>(null);

  const handleSaveClick = (status: SpecialRuleStatus) => {
    if (!ready) {
      setSaveHint(validationIssues.join('；'));
      return;
    }
    setSaveHint(null);
    onRequestSave(status);
  };

  const previewRule: SpecialRule = {
    id: draft.id ?? '__draft__',
    name: draft.name ?? '',
    relationScope: draft.relationScope ?? 'INTER_GROUP',
    interaction,
    sideA,
    sideB,
    status: 'ENABLED',
    priority: draft.priority,
    createdAt: draft.createdAt ?? new Date().toISOString(),
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
  };

  const pairCount = ready ? countRulePairs(previewRule) : 0;
  const previewImpact = ready
    ? detectSaveImpact(existingRules, previewRule, priorityEnabled, INSTANCE_TYPE_MAP)
    : { overrides: [], ineffective: [] };

  return (
    <div className="page-card h-full flex flex-col overflow-hidden">
      <div className="p-4 border-b border-[#e8e8e8] flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] text-[#595959] flex items-center gap-1 hover:text-brand-600"
        >
          <ArrowLeft size={14} /> 取消
        </button>
        <ChevronRight size={12} className="text-[#d9d9d9]" />
        <span className="text-[15px] font-semibold">
          {isNew ? '新建特例规则' : '编辑特例规则'}
        </span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 左栏 · 配置 */}
        <div className="flex-1 overflow-auto p-5 space-y-6 min-w-0">
          <FormSection index={1} title="规则名称">
            <input
              className="w-full max-w-md border border-[#d9d9d9] rounded px-3 py-2 text-[13px] focus:outline-none focus:border-brand-500"
              placeholder="如：满减与平台券互斥"
              value={draft.name ?? ''}
              onChange={e => {
                setDraft(d => ({ ...d, name: e.target.value }));
                setSaveHint(null);
              }}
            />
          </FormSection>

          <FormSection index={2} title="关系范围">
            <div className="grid grid-cols-2 gap-3 max-w-md">
              <RangeCard
                active={isIntra}
                title="组内关系"
                desc="一批对象，彼此之间关系相同"
                variant="intra"
                onClick={() => setDraft(d => ({ ...d, relationScope: 'INTRA_GROUP', sideB: [] }))}
              />
              <RangeCard
                active={!isIntra}
                title="组间关系"
                desc="左右两批，两两结对"
                variant="inter"
                onClick={() => setDraft(d => ({ ...d, relationScope: 'INTER_GROUP' }))}
              />
            </div>
          </FormSection>

          <FormSection
            index={3}
            title="优惠对象"
            hint="支持优惠类型与活动实例混选"
          >
            <div className={isIntra ? 'max-w-lg' : 'grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl'}>
              <ObjectPickerField
                label={isIntra ? '规则对象（组内成员）' : '规则对象（左）'}
                accent="brand"
                categories={categories}
                instances={instances}
                value={sideA}
                onChange={m => {
                  setDraft(d => ({ ...d, sideA: m }));
                  setSaveHint(null);
                }}
              />
              {!isIntra && (
                <ObjectPickerField
                  label="限制对象（右）"
                  accent="orange"
                  categories={categories}
                  instances={instances}
                  value={sideB}
                  onChange={m => {
                    setDraft(d => ({ ...d, sideB: m }));
                    setSaveHint(null);
                  }}
                />
              )}
            </div>
          </FormSection>

          <FormSection index={4} title="关系">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl">
              {INTERACTION_OPTIONS.map(opt => (
                <RelationCard
                  key={opt.value}
                  interaction={opt.value}
                  active={interaction === opt.value}
                  onClick={() => setDraft(d => ({ ...d, interaction: opt.value }))}
                />
              ))}
            </div>
          </FormSection>

          {priorityEnabled && (
            <FormSection index={5} title="优先级" hint="数字越小越优先">
              <input
                type="number"
                min={1}
                className="w-32 border border-[#d9d9d9] rounded px-3 py-2 text-[13px] focus:outline-none focus:border-brand-500"
                value={draft.priority ?? existingRules.length + 1}
                onChange={e => setDraft(d => ({ ...d, priority: parseInt(e.target.value, 10) || 1 }))}
              />
            </FormSection>
          )}
        </div>

        {/* 右栏 · 实时预览 */}
        <aside className="w-[300px] lg:w-[320px] shrink-0 border-l border-[#e8e8e8] bg-[#fafafa] overflow-auto p-4 flex flex-col gap-3">
          <div className="text-[13px] font-semibold text-[#262626] flex items-center gap-1.5">
            <FlaskConical size={14} className="text-brand-600" />
            实时预览
          </div>

          {/* 规则摘要 */}
          <div className="bg-white border border-[#e8e8e8] rounded p-3">
            <div className="text-[11px] text-[#8c8c8c]">规则摘要</div>
            <div className="mt-1 text-[13px] font-medium text-[#262626] truncate">
              {draft.name?.trim() || '未命名规则'}
            </div>
            <div className="mt-2 flex items-center flex-wrap gap-1.5 text-[12px] text-[#595959]">
              <span className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                {isIntra ? `组内 ${sideA.length} 个` : `左 ${sideA.length} 个`}
              </span>
              <span className="text-[#bfbfbf]">{isIntra ? '彼此' : '↔'}</span>
              {!isIntra && (
                <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                  右 {sideB.length} 个
                </span>
              )}
              <span className="text-[#bfbfbf]">→</span>
              <RelationBadge interaction={interaction} />
            </div>
          </div>

          {/* 关系对数量 */}
          <div className="bg-white border border-[#e8e8e8] rounded p-3 flex items-baseline gap-2">
            <span className="text-[22px] font-semibold text-brand-600">{pairCount}</span>
            <span className="text-[12px] text-[#8c8c8c]">对关系将建立</span>
          </div>

          {/* 覆盖 / 不生效（仅启用时） */}
          {ready && (previewImpact.overrides.length > 0 || previewImpact.ineffective.length > 0) && (
            <div className="bg-white border border-[#e8e8e8] rounded p-3 space-y-2">
              {isNew && (
                <p className="text-[11px] text-[#8c8c8c]">以下影响仅在「保存并启用」时发生</p>
              )}
              {previewImpact.overrides.length > 0 && (
                <div>
                  <div className="text-[12px] font-medium text-amber-700 flex items-center gap-1">
                    <AlertTriangle size={12} /> 将覆盖 {previewImpact.overrides.length} 对
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {previewImpact.overrides.slice(0, 3).map(o => (
                      <li key={o.pairKey} className="text-[11px] text-[#8c8c8c]">
                        {o.promoALabel} ↔ {o.promoBLabel}：{interactionLabel(o.currentInteraction)} →{' '}
                        {interactionLabel(o.newInteraction)}
                      </li>
                    ))}
                    {previewImpact.overrides.length > 3 && (
                      <li className="text-[11px] text-[#bfbfbf]">
                        等 {previewImpact.overrides.length} 对
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {previewImpact.ineffective.length > 0 && (
                <div>
                  <div className="text-[12px] font-medium text-[#595959]">
                    {previewImpact.ineffective.length} 对不生效
                  </div>
                  <ul className="mt-1 space-y-0.5">
                    {previewImpact.ineffective.slice(0, 3).map(o => (
                      <li key={o.pairKey} className="text-[11px] text-[#bfbfbf]">
                        {o.promoALabel} ↔ {o.promoBLabel}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </aside>
      </div>

      {/* 底部操作栏 · 始终可见 */}
      <div className="shrink-0 border-t border-[#e8e8e8] bg-white px-4 py-2.5 flex items-center justify-between gap-4 shadow-[0_-1px_0_#f0f0f0]">
        <div className="min-w-0 flex-1">
          {saveHint ? (
            <p className="text-[12px] text-amber-700 flex items-start gap-1.5">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{saveHint}</span>
            </p>
          ) : ready ? (
            <p className="text-[12px] text-[#595959] flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-brand-600 shrink-0" />
              <span>
                {isNew
                  ? '配置完整。「保存」为停用草稿；「保存并启用」将立即生效'
                  : '配置完整，可以保存'}
              </span>
            </p>
          ) : (
            <p className="text-[12px] text-[#8c8c8c] flex items-center gap-1.5 min-w-0">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <span className="truncate">还需完成：{validationIssues.join('、')}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isNew ? (
            <>
              <button
                type="button"
                className={`btn btn--primary ${ready ? '' : 'opacity-70'}`}
                onClick={() => handleSaveClick('DISABLED')}
                title="保存为停用状态，不会立即生效"
              >
                保存
              </button>
              <button
                type="button"
                className={`btn btn--default border-brand-200 text-brand-600 hover:bg-brand-50 ${ready ? '' : 'opacity-70'}`}
                onClick={() => handleSaveClick('ENABLED')}
                title="保存并立即启用，可能影响线上规则"
              >
                保存并启用
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`btn btn--primary ${ready ? '' : 'opacity-70'}`}
              onClick={() => handleSaveClick(draft.status === 'ENABLED' ? 'ENABLED' : 'DISABLED')}
            >
              保存
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export { DEMO_TYPE_LABELS, DEMO_TYPE_A, DEMO_TYPE_B, DEMO_TYPE_C };
