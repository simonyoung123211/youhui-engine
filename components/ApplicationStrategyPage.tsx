import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/admin.css';
import { ClipboardList, Pencil, Save, X } from 'lucide-react';
import { PromotionCategory, PromoInstance } from '../types';
import {
  ApplicationStrategyConfig,
  StrategyTab,
  StrategyValidationIssue,
} from '../types/applicationStrategy';
import {
  DEFAULT_APPLICATION_STRATEGY,
  hydrateApplicationStrategy,
} from '../data/defaultApplicationStrategy';
import {
  areApplicationStrategiesEqual,
  validateApplicationStrategy,
} from '../utils/applicationStrategyValidation';
import { MiniProgramTab } from './applicationStrategy/MiniProgramTab';
import { PosTab } from './applicationStrategy/PosTab';

const TABS: { id: StrategyTab; label: string }[] = [
  { id: 'miniprogram', label: '小程序' },
  { id: 'pos', label: '企迈POS' },
];

interface ApplicationStrategyPageProps {
  config: ApplicationStrategyConfig;
  onConfigChange: (config: ApplicationStrategyConfig) => void;
  categories: PromotionCategory[];
  instances: PromoInstance[];
  onSave?: () => void;
  onToast?: (message: string) => void;
}

export function ApplicationStrategyPage({
  config,
  onConfigChange,
  categories,
  instances,
  onSave,
  onToast,
}: ApplicationStrategyPageProps) {
  const [activeTab, setActiveTab] = useState<StrategyTab>('miniprogram');
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ApplicationStrategyConfig>(() => hydrateApplicationStrategy(config));
  const [savedSnapshot, setSavedSnapshot] = useState<ApplicationStrategyConfig>(() =>
    hydrateApplicationStrategy(config)
  );
  const [validationIssues, setValidationIssues] = useState<StrategyValidationIssue[]>([]);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    if (isEditing) return;
    const hydrated = hydrateApplicationStrategy(config);
    setDraft(hydrated);
    setSavedSnapshot(hydrated);
  }, [config, isEditing]);

  const isDirty = useMemo(
    () => !areApplicationStrategiesEqual(draft, savedSnapshot),
    [draft, savedSnapshot]
  );

  const patchDraft = useCallback((patch: Partial<ApplicationStrategyConfig>) => {
    setDraft(prev => ({ ...prev, ...patch }));
    setShowValidation(false);
  }, []);

  const handleStartEdit = () => {
    setDraft(structuredClone(savedSnapshot));
    setValidationIssues([]);
    setShowValidation(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setDraft(structuredClone(savedSnapshot));
    setValidationIssues([]);
    setShowValidation(false);
    setIsEditing(false);
    onToast?.('已取消修改');
  };

  const handleSave = () => {
    if (!isDirty) {
      setIsEditing(false);
      return;
    }

    const issues = validateApplicationStrategy(draft);
    if (issues.length > 0) {
      setValidationIssues(issues);
      setShowValidation(true);
      onToast?.(issues[0].message);
      return;
    }

    setValidationIssues([]);
    setShowValidation(false);
    onConfigChange(structuredClone(draft));
    setSavedSnapshot(structuredClone(draft));
    setIsEditing(false);
    onSave?.();
  };

  const visibleIssues = showValidation ? validationIssues : [];

  return (
    <div className={`page-card page-card--list h-full flex flex-col overflow-hidden${isEditing ? ' strategy-page--editing' : ''}`}>
      <header className="list-page-header list-page-header--compact shrink-0">
        <div className="list-page-header__main">
          <div className="list-page-header__title-row">
            <ClipboardList size={20} className="text-brand-600 shrink-0" aria-hidden />
            <h1 className="list-page-header__title">优惠应用策略</h1>
            {isEditing && (
              <span className="strategy-editing-badge">编辑中</span>
            )}
          </div>
          <p className="list-page-header__desc">
            配置 C/B 端交易场景中的优惠推荐、使用限制与预估价计算口径。
            {isEditing ? ' 修改完成后请保存，或取消放弃本次编辑。' : ' 点击右上角「编辑配置」开始调整。'}
          </p>
        </div>
        <div className="list-page-header__actions">
          {!isEditing ? (
            <button type="button" className="btn btn--primary btn--icon" onClick={handleStartEdit}>
              <Pencil size={14} aria-hidden />
              编辑配置
            </button>
          ) : (
            <>
              <button type="button" className="btn btn--default btn--icon" onClick={handleCancel}>
                <X size={14} aria-hidden />
                取消修改
              </button>
              <button
                type="button"
                className="btn btn--primary btn--icon"
                disabled={!isDirty}
                onClick={handleSave}
              >
                <Save size={14} aria-hidden />
                保存
              </button>
            </>
          )}
        </div>
      </header>

      {visibleIssues.length > 0 && (
        <div className="strategy-validation-banner" role="alert">
          <strong>无法保存：</strong>
          {visibleIssues.map((issue, i) => (
            <span key={issue.field}>
              {i > 0 ? '；' : ''}
              {issue.message}
            </span>
          ))}
        </div>
      )}

      <nav className="sub-tabs shrink-0" aria-label="优惠应用策略分类">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`sub-tab${activeTab === tab.id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className={`flex-1 overflow-y-auto custom-scrollbar${isEditing ? '' : ' strategy-tab-content--readonly'}`}>
        {activeTab === 'miniprogram' && (
          <MiniProgramTab
            config={draft.miniProgram}
            categories={categories}
            readOnly={!isEditing}
            onChange={miniProgram => patchDraft({ miniProgram })}
          />
        )}
        {activeTab === 'pos' && (
          <PosTab
            config={draft.pos}
            categories={categories}
            instances={instances}
            readOnly={!isEditing}
            onChange={pos => patchDraft({ pos })}
          />
        )}
      </div>
    </div>
  );
}

export { DEFAULT_APPLICATION_STRATEGY, hydrateApplicationStrategy };
