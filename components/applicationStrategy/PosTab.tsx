import React from 'react';
import { StrategySelectRow } from './ConfigSection';
import { ActivityScopeTable } from './ActivityScopeTable';
import { PromotionCategory, PromoInstance } from '../../types';
import { ApplicationStrategyConfig } from '../../types/applicationStrategy';

interface PosTabProps {
  config: ApplicationStrategyConfig['pos'];
  categories: PromotionCategory[];
  instances: PromoInstance[];
  onChange: (next: ApplicationStrategyConfig['pos']) => void;
  readOnly?: boolean;
}

const AUTO_OPTIONS = [
  { value: 'MANUAL', label: '不自动执行' },
  { value: 'AUTO', label: '自动执行' },
];

const BOOL_OPTIONS = [
  { value: 'yes', label: '支持' },
  { value: 'no', label: '不支持' },
];

const MUTEX_OPTIONS = [
  { value: 'yes', label: '开启' },
  { value: 'no', label: '关闭' },
];

const SCOPE_OPTIONS = [
  { value: 'ALL', label: '全部活动' },
  { value: 'SPECIFIED', label: '指定计算活动' },
];

export function PosTab({ config, categories, instances, onChange, readOnly = false }: PosTabProps) {
  const patch = (partial: Partial<ApplicationStrategyConfig['pos']>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="strategy-tab-content">
      <div className="strategy-section-heading">活动执行设置</div>

      <div className={`strategy-config-block${readOnly ? ' is-readonly' : ''}`}>
        <StrategySelectRow
          label="进入结账页自动执行参与优惠"
          value={config.autoExecuteOnCheckout}
          disabled={readOnly}
          onChange={v => patch({ autoExecuteOnCheckout: v as 'AUTO' | 'MANUAL' })}
          options={AUTO_OPTIONS}
        />
        <StrategySelectRow
          label="进入点单页自动执行参与优惠"
          value={config.autoExecuteOnOrder}
          disabled={readOnly}
          onChange={v => patch({ autoExecuteOnOrder: v as 'AUTO' | 'MANUAL' })}
          options={AUTO_OPTIONS}
        />
        <StrategySelectRow
          label="会员码余额支核一体"
          hint="会员余额充足时，自动参与优惠并使用余额点单"
          value={config.memberBalanceIntegrated ? 'yes' : 'no'}
          disabled={readOnly}
          onChange={v => patch({ memberBalanceIntegrated: v === 'yes' })}
          options={BOOL_OPTIONS}
        />
        <StrategySelectRow
          label="付款码支核一体支持优惠共享互斥设置"
          hint="开启后，付款码支核一体完全依据活动自动执行范围及优惠共享互斥配置参与优惠"
          value={config.paymentCodeRespectMutex ? 'yes' : 'no'}
          disabled={readOnly}
          onChange={v => patch({ paymentCodeRespectMutex: v === 'yes' })}
          options={MUTEX_OPTIONS}
        />
        <StrategySelectRow
          label="自动执行活动范围"
          hint="以下活动、券与资产抵扣适用于支核一体。POS 自动执行范围包括：满M件N折、满减、限时折扣、买赠、会员价、付费会员价等。"
          value={config.activityScope}
          disabled={readOnly}
          onChange={v => patch({ activityScope: v as 'ALL' | 'SPECIFIED' })}
          options={SCOPE_OPTIONS}
        />
      </div>

      {config.activityScope === 'SPECIFIED' && (
        <ActivityScopeTable
          selectedIds={config.specifiedActivities.map(a => a.instanceId)}
          categories={categories}
          instances={instances}
          readOnly={readOnly}
          onChange={ids => patch({ specifiedActivities: ids.map(instanceId => ({ instanceId })) })}
        />
      )}
    </div>
  );
}
