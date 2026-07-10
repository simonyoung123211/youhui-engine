import { useMemo, useState } from 'react';
import '../styles/admin.css';
import { MOCK_SHARE_MUTEX_RULES, type ShareMutexRule } from '../data/mockShareMutexRules';
import {
  SpecialCaseConfigPanel,
  loadSpecialCaseConfig,
  saveSpecialCaseConfig,
  type MemberPriceRelationMode,
} from './SpecialCaseConfigPanel';

const LEGACY_RULE_CONFIG_URL = 'https://console-pre.qmai.cn/marketingCenter/sharingRelation/index';

export function ShareMutexPage({ onViewDefaultRules }: { onViewDefaultRules?: () => void }) {
  const [keyword, setKeyword] = useState('');
  const [specialCaseOpen, setSpecialCaseOpen] = useState(false);
  const [specialCaseMode, setSpecialCaseMode] = useState<MemberPriceRelationMode>(loadSpecialCaseConfig);

  const filteredRules = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return MOCK_SHARE_MUTEX_RULES;
    return MOCK_SHARE_MUTEX_RULES.filter(
      (r) => r.name.toLowerCase().includes(q) || r.id.includes(q)
    );
  }, [keyword]);

  return (
    <div className="page-card">
      <div className="info-banner">
            <svg className="info-banner__icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 110 1.5.75.75 0 010-1.5zm-.75 3h1.5v4.5h-1.5V7z" />
            </svg>
            <span>
              共享互斥规则用于定义促销优惠之间的叠加关系。当多个优惠同时满足使用条件时，系统将根据此处配置的共享/互斥关系决定哪些优惠可以同时生效。组内关系作用于同一优惠组内的优惠类型，组间关系作用于不同优惠组之间。
            </span>
          </div>
          <div className="info-banner__links">
            <div className="info-banner__tip">
              <svg className="info-banner__tip-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M4 2h6l3 3v9a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
                <path d="M10 2v3h3M5.5 8h5M5.5 10.5h5" />
              </svg>
              <span className="info-banner__tip-text">
                手动创建的同享互斥规则优先级在默认规则之上， 查看
                <a
                  className="info-banner__link"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onViewDefaultRules?.();
                  }}
                >
                  默认同享互斥规则
                </a>
              </span>
            </div>
            <a
              className="info-banner__link"
              href={LEGACY_RULE_CONFIG_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看旧版规则配置
            </a>
          </div>

          <div className="page-toolbar">
            <div className="page-toolbar__left">
              <div className="page-toolbar__search-wrap">
                <svg className="page-toolbar__search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="7" cy="7" r="4.5" /><path d="M11 11l3 3" />
                </svg>
                <input
                  className="page-toolbar__search"
                  placeholder="搜索规则名称"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn--default">
                筛选
              </button>
              <button
                type="button"
                className="btn btn--default special-case-entry"
                onClick={() => setSpecialCaseOpen(true)}
              >
                特例配置
              </button>
            </div>
            <button type="button" className="btn btn--primary">
              + 新建规则
            </button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>规则名称</th>
                  <th>关系类型</th>
                  <th>规则对象</th>
                  <th>限制类型</th>
                  <th>共享/互斥对象</th>
                  <th>规则状态</th>
                  <th>更新时间</th>
                  <th>创建时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: '#8c8c8c', padding: '32px' }}>
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => <RuleRow key={rule.id} rule={rule} />)
                )}
              </tbody>
            </table>
          </div>

          <SpecialCaseConfigPanel
            open={specialCaseOpen}
            onClose={() => setSpecialCaseOpen(false)}
            value={specialCaseMode}
            onSave={(mode) => {
              setSpecialCaseMode(mode);
              saveSpecialCaseConfig(mode);
            }}
          />
    </div>
  );
}

function RuleRow({ rule }: { rule: ShareMutexRule }) {
  return (
    <tr>
      <td>
        <div className="table__rule-name">{rule.name}</div>
        <div className="table__rule-id">{rule.id}</div>
      </td>
      <td>{rule.relationType}</td>
      <td>{rule.ruleObjectCount}</td>
      <td>
        <span className={rule.limitType === '共享' ? 'table__limit--share' : 'table__limit--mutex'}>
          {rule.limitType}
        </span>
      </td>
      <td>{rule.targetCount}</td>
      <td>
        <span className="table__status">
          <span className="table__status-icon">✓</span>
          {rule.status}
        </span>
      </td>
      <td>
        <div className="table__time">
          <div className="table__time-user">{rule.updatedBy}</div>
          <div>{rule.updatedAt}</div>
        </div>
      </td>
      <td>
        <div className="table__time">{rule.createdAt}</div>
      </td>
      <td>
        <div className="table__actions">
          <button type="button">启用</button>
          <button type="button">复制</button>
          <button type="button">查看</button>
          <button type="button">删除</button>
        </div>
      </td>
    </tr>
  );
}
