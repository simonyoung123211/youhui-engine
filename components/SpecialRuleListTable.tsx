import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, FileSearch, MoreHorizontal, Plus } from 'lucide-react';
import { InteractionType, RuleMember, SpecialRule } from '../types';
import { interactionLabel } from '../utils/specialRuleResolver';
import { SpecialRuleSortBy, SpecialRuleSortDir } from '../utils/specialRuleQuery';
import {
  SPECIAL_RULE_PAGE_SIZE_OPTIONS,
  SpecialRulePageSize,
} from '../hooks/usePaginatedSpecialRules';
import { VirtualList } from './VirtualList';

const ROW_HEIGHT = 64;
const MEMBER_VISIBLE_LIMIT = 2;

function MemberCell({
  members,
  columnLabel,
}: {
  members: RuleMember[];
  columnLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (members.length === 0) {
    return (
      <div className="flex items-center h-full text-[13px] text-[#bfbfbf]">—</div>
    );
  }

  const visible = members.slice(0, MEMBER_VISIBLE_LIMIT);
  const overflow = members.length - MEMBER_VISIBLE_LIMIT;

  return (
    <div
      ref={wrapRef}
      className="relative flex items-center min-w-0 h-full py-1"
      data-member-snapshot=""
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {visible.map(m => (
          <span
            key={m.refId}
            className="rule-member-chip"
            title={m.refName}
          >
            <span className="truncate max-w-[88px]">{m.refName}</span>
            {m.expired && (
              <AlertTriangle size={10} className="text-amber-500 shrink-0" aria-label="已失效" />
            )}
          </span>
        ))}
        {overflow > 0 && (
          <button
            type="button"
            className="rule-member-more"
            onClick={() => setOpen(v => !v)}
            title={`查看全部${columnLabel}`}
          >
            +{overflow}
          </button>
        )}
      </div>

      {open && overflow > 0 && (
        <div className="rule-member-snapshot" role="dialog" aria-label={`${columnLabel}快照`}>
          <div className="rule-member-snapshot__title">
            {columnLabel}
            <span className="text-[#bfbfbf] font-normal"> · 共 {members.length} 个</span>
          </div>
          <ul className="rule-member-snapshot__list custom-scrollbar">
            {members.map(m => (
              <li key={m.refId} className="rule-member-snapshot__item">
                <span className="truncate flex-1 min-w-0" title={m.refName}>
                  {m.refName}
                </span>
                <span className="rule-member-snapshot__tag">
                  {m.refType === 'TYPE' ? '类型' : '实例'}
                </span>
                {m.expired && (
                  <span className="rule-member-snapshot__tag rule-member-snapshot__tag--warn">
                    已失效
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function hasExpiredMembers(rule: SpecialRule): boolean {
  return [...rule.sideA, ...(rule.sideB ?? [])].some(m => m.expired);
}

function gridTemplate(priorityEnabled: boolean): string {
  if (priorityEnabled) {
    return '56px minmax(180px,1.4fr) minmax(88px,0.7fr) minmax(110px,1fr) 80px minmax(110px,1fr) 88px minmax(100px,0.8fr) 112px 96px';
  }
  return 'minmax(180px,1.4fr) minmax(88px,0.7fr) minmax(110px,1fr) 80px minmax(110px,1fr) 88px minmax(100px,0.8fr) 112px 96px';
}

function SortHeaderButton({
  label,
  active,
  sortDir,
  onClick,
}: {
  label: string;
  active: boolean;
  sortDir?: SpecialRuleSortDir;
  onClick: () => void;
}) {
  return (
    <button type="button" className="rule-list-sort-btn" onClick={onClick}>
      <span>{label}</span>
      {active &&
        (sortDir === 'asc' ? (
          <ArrowUp size={12} className="shrink-0" />
        ) : (
          <ArrowDown size={12} className="shrink-0" />
        ))}
    </button>
  );
}

function ListHeader({
  priorityEnabled,
  sortBy,
  sortDir,
  onSort,
}: {
  priorityEnabled: boolean;
  sortBy: SpecialRuleSortBy;
  sortDir: SpecialRuleSortDir;
  onSort: (sortBy: SpecialRuleSortBy) => void;
}) {
  return (
    <div
      className="rule-list-grid rule-list-grid--header shrink-0"
      style={{ gridTemplateColumns: gridTemplate(priorityEnabled) }}
    >
      {priorityEnabled && (
        <div>
          <SortHeaderButton
            label="优先级"
            active={sortBy === 'priority'}
            sortDir={sortDir}
            onClick={() => onSort('priority')}
          />
        </div>
      )}
      <div>
        <SortHeaderButton
          label="规则名称"
          active={sortBy === 'name'}
          sortDir={sortDir}
          onClick={() => onSort('name')}
        />
      </div>
      <div className="rule-list-col--meta">关系类型</div>
      <div>规则对象</div>
      <div>关系</div>
      <div className="rule-list-col--meta">限制对象</div>
      <div>状态</div>
      <div className="rule-list-col--optional">
        <SortHeaderButton
          label="创建时间"
          active={sortBy === 'createdAt'}
          sortDir={sortDir}
          onClick={() => onSort('createdAt')}
        />
      </div>
      <div>操作</div>
    </div>
  );
}

function SkeletonRows({ count, priorityEnabled }: { count: number; priorityEnabled: boolean }) {
  const colCount = priorityEnabled ? 9 : 8;
  return (
    <div className="divide-y divide-[#f0f0f0]">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rule-list-grid rule-list-grid--row animate-pulse"
          style={{ gridTemplateColumns: gridTemplate(priorityEnabled), height: ROW_HEIGHT }}
        >
          {Array.from({ length: colCount }, (_, j) => (
            <div key={j} className="self-center h-3 bg-[#f0f0f0] rounded w-2/3 mx-3 my-5" />
          ))}
        </div>
      ))}
    </div>
  );
}

function RowActionsMenu({
  rule,
  onEdit,
  onToggleStatus,
  onOpenDetail,
  onDelete,
}: {
  rule: SpecialRule;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative inline-flex items-center">
      <button
        type="button"
        className="p-1 rounded hover:bg-[#f0f0f0] text-[#8c8c8c]"
        aria-label="更多操作"
        onClick={e => {
          e.stopPropagation();
          setOpen(v => !v);
        }}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="rule-list-row-menu" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => {
              onEdit(rule.id);
              setOpen(false);
            }}
          >
            修改
          </button>
          <button
            type="button"
            onClick={() => {
              onToggleStatus(rule.id);
              setOpen(false);
            }}
          >
            {rule.status === 'ENABLED' ? '停用' : '启用'}
          </button>
          <button type="button" className="text-rose-600" onClick={() => {
            onDelete(rule.id);
            setOpen(false);
          }}>
            删除
          </button>
        </div>
      )}
    </div>
  );
}

interface RuleRowProps {
  rule: SpecialRule;
  priorityEnabled: boolean;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

function RuleRow({
  rule,
  priorityEnabled,
  onOpenDetail,
  onEdit,
  onToggleStatus,
  onDelete,
}: RuleRowProps) {
  const [copied, setCopied] = useState(false);

  const copyRuleId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(rule.id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  const statusClass =
    rule.status === 'ENABLED' ? 'rule-list-grid--status-enabled' : 'rule-list-grid--status-disabled';

  return (
    <div
      className={`rule-list-grid rule-list-grid--row rule-list-grid--clickable ${statusClass}`}
      style={{ gridTemplateColumns: gridTemplate(priorityEnabled), height: ROW_HEIGHT }}
      onClick={e => {
        if ((e.target as HTMLElement).closest('button, [data-member-snapshot]')) return;
        onOpenDetail(rule.id);
      }}
    >
      {priorityEnabled && (
        <div className="flex items-center justify-center font-mono text-[12px] text-[#595959]">
          {rule.priority ?? '—'}
        </div>
      )}
      <div className="min-w-0 flex flex-col justify-center py-2">
        <div className="rule-name-cell">
          <div className="rule-name-cell__top">
            <span className="rule-name-cell__name truncate" title={rule.name}>
              {rule.name}
            </span>
            <span
              className={`rule-tag rule-tag--${rule.relationScope === 'INTRA_GROUP' ? 'intra' : 'inter'}`}
            >
              {rule.relationScope === 'INTRA_GROUP' ? '组内' : '组间'}
            </span>
            {hasExpiredMembers(rule) && (
              <span title="含已失效对象" className="text-amber-500 shrink-0">
                <AlertTriangle size={12} />
              </span>
            )}
          </div>
          <button
            type="button"
            className="rule-name-cell__id"
            title={copied ? '已复制' : '点击复制规则 ID'}
            onClick={copyRuleId}
          >
            {copied ? 'ID 已复制' : rule.id}
          </button>
        </div>
      </div>
      <div className="rule-list-col--meta flex items-center text-[13px] text-[#595959]">
        {rule.relationScope === 'INTRA_GROUP' ? '组内关系' : '组间关系'}
      </div>
      <MemberCell members={rule.sideA} columnLabel="规则对象" />
      <div className="flex items-center">
        <span
          className={
            rule.interaction === InteractionType.MUTEX
              ? 'table__limit--mutex'
              : 'table__limit--share'
          }
        >
          {interactionLabel(rule.interaction)}
        </span>
      </div>
      {rule.relationScope === 'INTER_GROUP' ? (
        <MemberCell members={rule.sideB ?? []} columnLabel="限制对象" />
      ) : (
        <div className="rule-list-col--meta flex items-center h-full text-[13px] text-[#bfbfbf]">—</div>
      )}
      <div className="flex items-center">
        <span
          className={`status-dot ${rule.status === 'ENABLED' ? 'status-dot--green' : 'status-dot--gray'}`}
        >
          {rule.status === 'ENABLED' ? '已启用' : '已停用'}
        </span>
      </div>
      <div className="rule-list-col--optional flex items-center">
        <div className="table__time">{rule.createdAt.replace('T', ' ').slice(0, 19)}</div>
      </div>
      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="text-[12px] text-brand-600 hover:underline px-1"
          onClick={() => onOpenDetail(rule.id)}
        >
          查看
        </button>
        <RowActionsMenu
          rule={rule}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onOpenDetail={onOpenDetail}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export interface SpecialRuleListTableProps {
  items: SpecialRule[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  loading: boolean;
  error: string | null;
  isDebouncing: boolean;
  priorityEnabled: boolean;
  sortBy: SpecialRuleSortBy;
  sortDir: SpecialRuleSortDir;
  onSort: (sortBy: SpecialRuleSortBy) => void;
  onOpenPriorityPanel?: () => void;
  onPageChange: (page: number) => void;
  onRetry: () => void;
  onToggleStatus: (id: string) => void;
  onOpenDetail: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  poolTotal: number;
  hasActiveFilters: boolean;
  onCreate?: () => void;
  onClearFilters?: () => void;
  onPageSizeChange: (size: SpecialRulePageSize) => void;
}

function ListEmptyState({
  poolTotal,
  hasActiveFilters,
  onCreate,
  onClearFilters,
}: {
  poolTotal: number;
  hasActiveFilters: boolean;
  onCreate?: () => void;
  onClearFilters?: () => void;
}) {
  const noData = poolTotal === 0;
  return (
    <div className="table-empty-state">
      <div className="table-empty-state__icon" aria-hidden>
        <FileSearch size={40} strokeWidth={1.25} className="text-[#d9d9d9]" />
      </div>
      <p className="table-empty-state__title">{noData ? '暂无特例规则' : '无匹配规则'}</p>
      <p className="table-empty-state__desc">
        {noData
          ? '创建第一条特例规则，覆盖默认优惠关系'
          : '请调整筛选条件或重置后重试'}
      </p>
      {noData && onCreate ? (
        <button type="button" className="btn btn--primary btn--icon" onClick={onCreate}>
          <Plus size={14} />
          新建规则
        </button>
      ) : (
        hasActiveFilters &&
        onClearFilters && (
          <button type="button" className="btn btn--default" onClick={onClearFilters}>
            重置筛选
          </button>
        )
      )}
    </div>
  );
}

export function SpecialRuleListTable({
  items,
  total,
  page,
  totalPages,
  pageSize,
  loading,
  error,
  isDebouncing,
  priorityEnabled,
  sortBy,
  sortDir,
  onSort,
  onOpenPriorityPanel,
  onPageChange,
  onRetry,
  onToggleStatus,
  onOpenDetail,
  onEdit,
  onDelete,
  poolTotal,
  hasActiveFilters,
  onCreate,
  onClearFilters,
  onPageSizeChange,
}: SpecialRuleListTableProps) {
  const pageButtons = useMemo(() => {
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, totalPages, page]);
    if (page > 1) pages.add(page - 1);
    if (page < totalPages) pages.add(page + 1);
    if (page > 2) pages.add(page - 2);
    if (page < totalPages - 1) pages.add(page + 2);
    return [...pages].sort((a, b) => a - b);
  }, [page, totalPages]);

  const showEmpty = !loading && !error && total === 0;
  const showSkeleton = loading && items.length === 0;

  return (
    <div className="rule-list flex flex-col flex-1 min-h-0 px-4 pb-4">
      <div className="rule-list__summary shrink-0 py-2 text-[12px] text-[#8c8c8c] flex flex-wrap items-center gap-x-3 gap-y-1">
        <span>
          共 <strong className="text-[#595959] font-medium">{total}</strong> 条
          {isDebouncing && ' · 搜索中…'}
        </span>
        {total > 0 && (
          <>
            <span>
              第 {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} 条
            </span>
            {priorityEnabled && onOpenPriorityPanel && (
              <button
                type="button"
                className="text-amber-600 hover:underline"
                onClick={onOpenPriorityPanel}
              >
                请在「高级策略」中调整优先级
              </button>
            )}
          </>
        )}
      </div>

      <div className="rule-list__table flex flex-col flex-1 min-h-0 border border-[#f0f0f0] rounded overflow-hidden bg-white">
        <div className="overflow-x-auto shrink-0 border-b border-[#f0f0f0]">
          <div className="min-w-[960px]">
            <ListHeader
              priorityEnabled={priorityEnabled}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={onSort}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 min-w-0 overflow-x-auto">
          <div className="min-w-[960px] h-full flex flex-col">
            {error && (
              <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[13px] text-[#8c8c8c] py-12">
                <span>{error}</span>
                <button type="button" className="btn btn--default" onClick={onRetry}>
                  重试
                </button>
              </div>
            )}

            {showEmpty && (
              <div className="flex-1 flex items-center justify-center py-12">
                <ListEmptyState
                  poolTotal={poolTotal}
                  hasActiveFilters={hasActiveFilters}
                  onCreate={onCreate}
                  onClearFilters={onClearFilters}
                />
              </div>
            )}

            {showSkeleton && (
              <SkeletonRows count={8} priorityEnabled={priorityEnabled} />
            )}

            {!error && !showEmpty && !showSkeleton && (
              <VirtualList
                className="flex-1"
                items={items}
                rowHeight={ROW_HEIGHT}
                getItemKey={rule => rule.id}
                renderItem={rule => (
                  <RuleRow
                    rule={rule}
                    priorityEnabled={priorityEnabled}
                    onOpenDetail={onOpenDetail}
                    onEdit={onEdit}
                    onToggleStatus={onToggleStatus}
                    onDelete={onDelete}
                  />
                )}
              />
            )}

            {loading && items.length > 0 && (
              <div className="shrink-0 py-1.5 text-center text-[11px] text-[#8c8c8c] bg-[#fafafa] border-t border-[#f0f0f0]">
                加载中…
              </div>
            )}
          </div>
        </div>

        {total > 0 && (
          <div className="rule-list__pager shrink-0 flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-t border-[#f0f0f0] bg-[#fafafa] text-[12px]">
            <div className="flex items-center gap-3 text-[#8c8c8c]">
              <label className="inline-flex items-center gap-1.5">
                每页
                <select
                  className="rule-list__page-size"
                  value={pageSize}
                  disabled={loading}
                  onChange={e => onPageSizeChange(Number(e.target.value) as SpecialRulePageSize)}
                >
                  {SPECIAL_RULE_PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                条
              </label>
              <span>
                第 {page} / {totalPages} 页
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="btn btn--default px-2 py-0.5"
                disabled={page <= 1 || loading}
                onClick={() => onPageChange(page - 1)}
              >
                上一页
              </button>
              {pageButtons.map((p, idx) => {
                const prev = pageButtons[idx - 1];
                const gap = prev !== undefined && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {gap && <span className="px-1 text-[#bfbfbf]">…</span>}
                    <button
                      type="button"
                      className={`min-w-[28px] px-2 py-0.5 rounded border text-[12px] ${
                        p === page
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-white border-[#d9d9d9] text-[#595959] hover:border-brand-300'
                      }`}
                      disabled={loading}
                      onClick={() => onPageChange(p)}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}
              <button
                type="button"
                className="btn btn--default px-2 py-0.5"
                disabled={page >= totalPages || loading}
                onClick={() => onPageChange(page + 1)}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
