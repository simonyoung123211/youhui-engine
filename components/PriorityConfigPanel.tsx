import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { SpecialRule } from '../types';
import { ModalShell } from './ModalShell';
import { ConfirmActionModal } from './ConfirmActionModal';
import { PriorityRuleList } from './PriorityRuleList';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import {
  arePriorityOrdersEqual,
  filterRulesForPriorityPanel,
  moveRulesByOffset,
  moveRulesToBottom,
  moveRulesToIndex,
  moveRulesToTop,
  preparePriorityDraft,
  PriorityPanelScopeFilter,
  PriorityPanelStatusFilter,
  reorderByDrag,
} from '../utils/priorityReorder';

interface PriorityConfigPanelProps {
  open: boolean;
  enabled: boolean;
  rules: SpecialRule[];
  onClose: () => void;
  onToggle: (enabled: boolean) => void;
  onApplyPriority: (rules: SpecialRule[]) => void;
}

type PanelConfirm =
  | { type: 'discard-close' }
  | { type: 'done-dirty' }
  | { type: 'toggle-on' }
  | { type: 'toggle-off' }
  | { type: 'save-priority' }
  | { type: 'save-and-close' };

export const PriorityConfigPanel: React.FC<PriorityConfigPanelProps> = ({
  open,
  enabled,
  rules,
  onClose,
  onToggle,
  onApplyPriority,
}) => {
  const [draftRules, setDraftRules] = useState<SpecialRule[]>([]);
  const [snapshotRules, setSnapshotRules] = useState<SpecialRule[]>([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<PriorityPanelStatusFilter>('ENABLED');
  const [scopeFilter, setScopeFilter] = useState<PriorityPanelScopeFilter>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetIndexInput, setTargetIndexInput] = useState('1');
  const [panelConfirm, setPanelConfirm] = useState<PanelConfirm | null>(null);

  const debouncedKeyword = useDebouncedValue(keyword, 200);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      const prepared = preparePriorityDraft(rules);
      setDraftRules(prepared);
      setSnapshotRules(prepared);
      setKeyword('');
      setStatusFilter('ENABLED');
      setScopeFilter('ALL');
      setSelectedIds(new Set());
      setTargetIndexInput('1');
      setPanelConfirm(null);
    }
    wasOpenRef.current = open;
  }, [open, rules]);

  const isDirty = useMemo(
    () => !arePriorityOrdersEqual(draftRules, snapshotRules),
    [draftRules, snapshotRules]
  );

  const visibleRules = useMemo(
    () =>
      filterRulesForPriorityPanel(draftRules, {
        keyword: debouncedKeyword,
        status: statusFilter,
        relationScope: scopeFilter,
      }),
    [draftRules, debouncedKeyword, statusFilter, scopeFilter]
  );

  const selectedCount = selectedIds.size;
  const dirtyChangeCount = useMemo(() => {
    if (!isDirty) return 0;
    const snapshotIndex = new Map(snapshotRules.map((rule, index) => [rule.id, index]));
    return draftRules.reduce((count, rule, index) => {
      const prevIndex = snapshotIndex.get(rule.id);
      return prevIndex === index ? count : count + 1;
    }, 0);
  }, [draftRules, snapshotRules, isDirty]);

  const closePanelConfirm = () => setPanelConfirm(null);

  const requestClose = () => {
    if (isDirty) {
      setPanelConfirm({ type: 'discard-close' });
      return;
    }
    onClose();
  };

  const handleDone = () => {
    if (isDirty) {
      setPanelConfirm({ type: 'done-dirty' });
      return;
    }
    onClose();
  };

  const applySave = () => {
    onApplyPriority(draftRules);
    setSnapshotRules(draftRules);
  };

  const handleSave = () => {
    if (!isDirty) return;
    setPanelConfirm({ type: 'save-priority' });
  };

  const handlePriorityToggleRequest = (nextEnabled: boolean) => {
    if (nextEnabled === enabled) return;
    setPanelConfirm({ type: nextEnabled ? 'toggle-on' : 'toggle-off' });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.length > 0 && ids.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  };

  const applyBatch = (updater: (rules: SpecialRule[], ids: string[]) => SpecialRule[]) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setDraftRules(prev => updater(prev, ids));
  };

  const handleMoveToIndex = () => {
    const n = Number.parseInt(targetIndexInput, 10);
    if (!Number.isFinite(n) || n < 1) {
      window.alert('请输入有效的序号（从 1 开始）');
      return;
    }
    applyBatch((prev, ids) => moveRulesToIndex(prev, ids, n - 1));
  };

  const renderPanelConfirm = () => {
    if (!panelConfirm) return null;

    if (panelConfirm.type === 'discard-close') {
      return (
        <ConfirmActionModal
          open
          title="放弃未保存调整"
          description="有未保存的优先级调整，确定放弃并关闭吗？"
          confirmLabel="放弃并关闭"
          variant="warning"
          onCancel={closePanelConfirm}
          onConfirm={() => {
            closePanelConfirm();
            onClose();
          }}
        />
      );
    }

    if (panelConfirm.type === 'done-dirty') {
      return (
        <ConfirmActionModal
          open
          title="未保存的优先级调整"
          description="有未保存的优先级调整，请选择后续操作。"
          cancelLabel="取消"
          secondaryLabel="放弃修改并关闭"
          confirmLabel="保存并关闭"
          variant="warning"
          onCancel={closePanelConfirm}
          onSecondary={() => {
            closePanelConfirm();
            onClose();
          }}
          onConfirm={() => setPanelConfirm({ type: 'save-and-close' })}
        />
      );
    }

    if (panelConfirm.type === 'toggle-on') {
      return (
        <ConfirmActionModal
          open
          title="启用显式优先级"
          description="开启后，特例规则将按显式优先级解析，数字越小越优先。此设置会影响线上优惠计算。"
          confirmLabel="确认启用"
          variant="warning"
          onCancel={closePanelConfirm}
          onConfirm={() => {
            onToggle(true);
            closePanelConfirm();
          }}
        />
      );
    }

    if (panelConfirm.type === 'toggle-off') {
      return (
        <ConfirmActionModal
          open
          title="关闭显式优先级"
          description="关闭后将回退到默认解析逻辑（具体度、创建时间），不再使用显式优先级排序。"
          confirmLabel="确认关闭"
          variant="warning"
          onCancel={closePanelConfirm}
          onConfirm={() => {
            onToggle(false);
            closePanelConfirm();
          }}
        />
      );
    }

    const saveDescription =
      dirtyChangeCount > 0
        ? `确认保存优先级调整？当前有 ${dirtyChangeCount} 条规则顺序发生变更，保存后将影响线上优惠计算。`
        : '确认保存优先级调整？保存后将影响线上优惠计算。';

    if (panelConfirm.type === 'save-priority') {
      return (
        <ConfirmActionModal
          open
          title="确认保存优先级"
          description={saveDescription}
          confirmLabel="确认保存"
          variant="warning"
          onCancel={closePanelConfirm}
          onConfirm={() => {
            applySave();
            closePanelConfirm();
          }}
        />
      );
    }

    return (
      <ConfirmActionModal
        open
        title="确认保存优先级"
        description={saveDescription}
        confirmLabel="确认保存并关闭"
        variant="warning"
        onCancel={closePanelConfirm}
        onConfirm={() => {
          applySave();
          closePanelConfirm();
          onClose();
        }}
      />
    );
  };

  if (!open) return null;

  return (
    <>
      <ModalShell
        open={open}
        onClose={requestClose}
        size="lg"
        zIndex={55}
        panelClassName="h-[min(640px,calc(100vh-2rem))]"
      >
        <div className="px-4 py-3 border-b border-[#e8e8e8] flex items-center justify-between bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Settings size={16} className="text-brand-600 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-[#262626]">高级策略</h3>
              <p className="text-[12px] text-[#8c8c8c] mt-0.5 truncate">
                显式优先级与专用调序管理
              </p>
            </div>
          </div>
          <button type="button" onClick={requestClose} className="p-1.5 hover:bg-[#f0f0f0] rounded shrink-0">
            <X size={18} className="text-[#8c8c8c]" />
          </button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="shrink-0 px-4 py-3 border-b border-[#f0f0f0] space-y-3">
            <label className="flex items-start gap-3 cursor-pointer text-[13px]">
              <input
                type="checkbox"
                className="mt-1"
                checked={enabled}
                onChange={e => handlePriorityToggleRequest(e.target.checked)}
              />
              <div>
                <div className="font-medium text-[#262626]">启用显式优先级</div>
                <div className="text-[12px] text-[#8c8c8c] mt-1 leading-relaxed">
                  开启后，在下方优先级管理中调整顺序。数字越小越优先，优先于具体度和创建时间。
                </div>
              </div>
            </label>

            <div className="bg-[#fafafa] border border-[#e8e8e8] rounded p-3 text-[12px] text-[#595959] space-y-1">
              <div className="font-medium text-[#262626] mb-1">解析顺序（开启后）</div>
              <div>1. 显式优先级（数字小者优先）</div>
              <div>2. 具体度（实例↔实例 &gt; 实例↔类型 &gt; 类型↔类型）</div>
              <div>3. 创建时间（越新越优先）</div>
            </div>
          </div>

          {enabled && (
            <div className="flex-1 flex flex-col min-h-0 px-4 py-3 gap-2">
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                <input
                  className="flex-1 min-w-[160px] text-[13px] border border-[#d9d9d9] rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
                  placeholder="搜索规则名称、ID、对象"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                />
                <select
                  className="text-[13px] border border-[#d9d9d9] rounded px-2 py-1.5 bg-white"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as PriorityPanelStatusFilter)}
                >
                  <option value="ENABLED">已启用</option>
                  <option value="DISABLED">已停用</option>
                  <option value="ALL">全部状态</option>
                </select>
                <select
                  className="text-[13px] border border-[#d9d9d9] rounded px-2 py-1.5 bg-white"
                  value={scopeFilter}
                  onChange={e => setScopeFilter(e.target.value as PriorityPanelScopeFilter)}
                >
                  <option value="ALL">全部关系类型</option>
                  <option value="INTRA_GROUP">组内关系</option>
                  <option value="INTER_GROUP">组间关系</option>
                </select>
                <span className="text-[12px] text-[#8c8c8c] whitespace-nowrap">
                  显示 {visibleRules.length} / 共 {draftRules.length} 条
                </span>
              </div>

              <div className="shrink-0 flex flex-wrap items-center gap-2 text-[12px]">
                <span className="text-[#8c8c8c]">
                  已选 <strong className="text-[#595959]">{selectedCount}</strong> 条
                </span>
                <button
                  type="button"
                  className="btn btn--default px-2 py-0.5"
                  disabled={!selectedCount}
                  onClick={() => applyBatch((prev, ids) => moveRulesToTop(prev, ids))}
                >
                  移至顶部
                </button>
                <button
                  type="button"
                  className="btn btn--default px-2 py-0.5"
                  disabled={!selectedCount}
                  onClick={() => applyBatch((prev, ids) => moveRulesToBottom(prev, ids))}
                >
                  移至底部
                </button>
                <span className="inline-flex items-center gap-1">
                  <span className="text-[#8c8c8c]">移至序号</span>
                  <input
                    type="number"
                    min={1}
                    max={draftRules.length}
                    className="w-14 text-[12px] border border-[#d9d9d9] rounded px-1.5 py-0.5"
                    value={targetIndexInput}
                    onChange={e => setTargetIndexInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn--default px-2 py-0.5"
                    disabled={!selectedCount}
                    onClick={handleMoveToIndex}
                  >
                    确定
                  </button>
                </span>
                <button
                  type="button"
                  className="btn btn--default px-2 py-0.5"
                  disabled={!selectedCount}
                  onClick={() => applyBatch((prev, ids) => moveRulesByOffset(prev, ids, -1))}
                >
                  上移
                </button>
                <button
                  type="button"
                  className="btn btn--default px-2 py-0.5"
                  disabled={!selectedCount}
                  onClick={() => applyBatch((prev, ids) => moveRulesByOffset(prev, ids, 1))}
                >
                  下移
                </button>
              </div>

              <PriorityRuleList
                rules={visibleRules}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onDragReorder={(fromId, toId) => {
                  setDraftRules(prev => reorderByDrag(prev, fromId, toId));
                }}
              />
            </div>
          )}

          {!enabled && (
            <div className="flex-1 flex items-center justify-center text-[13px] text-[#bfbfbf] px-6 text-center">
              开启显式优先级后，可在此搜索、拖拽与批量调整规则顺序
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 py-3 border-t border-[#e8e8e8] bg-[#fafafa] flex items-center justify-between gap-3">
          <span className="text-[12px] text-[#8c8c8c]">
            {isDirty ? (
              <span className="text-amber-600">有未保存的优先级调整</span>
            ) : (
              '优先级已同步'
            )}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn--default" onClick={requestClose}>
              取消
            </button>
            {enabled && (
              <button
                type="button"
                className="btn btn--default"
                disabled={!isDirty}
                onClick={handleSave}
              >
                保存优先级
              </button>
            )}
            <button type="button" className="btn btn--primary" onClick={handleDone}>
              完成
            </button>
          </div>
        </div>
      </ModalShell>
      {renderPanelConfirm()}
    </>
  );
};
