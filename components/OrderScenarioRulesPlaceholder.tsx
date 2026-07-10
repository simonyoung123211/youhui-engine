import React from 'react';
import '../styles/admin.css';
import { ClipboardList } from 'lucide-react';

export function OrderScenarioRulesPlaceholder() {
  return (
    <div className="page-card page-card--list h-full flex flex-col overflow-hidden">
      <header className="list-page-header list-page-header--compact shrink-0">
        <div className="list-page-header__main">
          <div className="list-page-header__title-row">
            <ClipboardList size={20} className="text-brand-600 shrink-0" aria-hidden />
            <h1 className="list-page-header__title">点单场景规则</h1>
          </div>
          <p className="list-page-header__desc">按点单场景配置优惠适用规则，功能规划中。</p>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center placeholder-page">
        <div className="text-center px-6">
          <p className="text-[14px] text-[#8c8c8c]">页面开发中</p>
          <p className="text-[12px] text-[#bfbfbf] mt-2">需求确认后将在此补充配置能力</p>
        </div>
      </div>
    </div>
  );
}
