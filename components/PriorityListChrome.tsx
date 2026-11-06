import React from 'react';
import { Calculator, ChevronDown, MonitorCheck, Pencil, RotateCcw, Save, X } from 'lucide-react';
import { StackingStrategy } from './StackingStrategyConfirmModal';

export interface PriorityListChromeProps {
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRequestSave: () => void;
  onResetDefault: () => void;
  onOpenCalcGuide: () => void;
  newCategoryNotice?: string | null;
  stackingStrategy: StackingStrategy;
  onOpenStrategy: () => void;
}

export function PriorityListChrome({
  isEditing,
  onStartEdit,
  onCancelEdit,
  onRequestSave,
  onResetDefault,
  onOpenCalcGuide,
  newCategoryNotice,
  stackingStrategy,
  onOpenStrategy,
}: PriorityListChromeProps) {
  return (
    <>
      <header className="list-page-header list-page-header--compact shrink-0">
        <div className="list-page-header__main">
          <div className="list-page-header__title-row">
            <Calculator className="text-brand-600 shrink-0" size={20} aria-hidden />
            <h1 className="list-page-header__title">计算顺序</h1>
          </div>
          <p className="list-page-header__desc">
            多种优惠科目可一起用时，按下方顺序依次计算：先算单品，再算整单。本页配置的是优惠科目的计算顺序。
          </p>
        </div>
        <div className="list-page-header__actions">
          <button
            type="button"
            className="btn btn--link btn--sm calc-order-strategy-entry"
            disabled={isEditing}
            onClick={onOpenStrategy}
            title={isEditing ? '请先保存或取消顺序调整，再切换 POS 计算顺序' : '配置企迈 POS 多种优惠一起用时按什么顺序计算'}
          >
            <MonitorCheck size={14} />
            POS计算顺序
            <span className="calc-order-strategy-entry__pill">
              {stackingStrategy === 'STATIC_PRIORITY' ? '按计算顺序' : '按录入先后'}
            </span>
          </button>
          {!isEditing ? (
            <button type="button" className="btn btn--primary btn--icon" onClick={onStartEdit}>
              <Pencil size={14} />
              调整顺序
            </button>
          ) : (
            <>
              <button type="button" className="btn btn--default btn--icon btn--sm" onClick={onResetDefault}>
                <RotateCcw size={13} />
                恢复默认
              </button>
              <button type="button" className="btn btn--default btn--icon" onClick={onCancelEdit}>
                <X size={14} />
                取消
              </button>
              <button type="button" className="btn btn--primary btn--icon" onClick={onRequestSave}>
                <Save size={14} />
                保存
              </button>
            </>
          )}
        </div>
      </header>

      {newCategoryNotice && (
        <div className="calc-order-notice shrink-0" role="status">
          {newCategoryNotice}
        </div>
      )}

      <div className="info-banner-wrap shrink-0">
        <button type="button" className="info-banner-toggle" onClick={onOpenCalcGuide}>
          <span className="info-banner-toggle__label">计算顺序说明</span>
          <span className="info-banner-toggle__preview">
            一般用系统默认即可；仅在优惠可一起用时，顺序才会影响顾客实付
          </span>
          <span className="info-banner-toggle__action">查看完整说明</span>
          <ChevronDown size={14} className="info-banner-toggle__chevron info-banner-toggle__chevron--open" />
        </button>
      </div>
    </>
  );
}
