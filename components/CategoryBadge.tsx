import React from 'react';
import { PromotionCategory, PromoScope, PromoGroup } from '../types';

interface CategoryBadgeProps {
  category: PromotionCategory;
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className = '' }) => {
  let tagText = '';
  let tagColor = '';

  if (category.group === PromoGroup.PAYMENT) {
    tagText = '支付';
    tagColor = 'bg-purple-100 text-purple-700 border-purple-200';
  } else if (category.defaultScope === PromoScope.SINGLE_ITEM) {
    tagText = '单品';
    tagColor = 'bg-blue-100 text-blue-700 border-blue-200';
  } else {
    tagText = '整单';
    tagColor = 'bg-orange-100 text-orange-700 border-orange-200';
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${tagColor} ${className}`}>
      {tagText}
    </span>
  );
};

export const CategoryLabel: React.FC<{ category: PromotionCategory; className?: string }> = ({ category, className = '' }) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span>{category.name}</span>
      <CategoryBadge category={category} />
    </div>
  );
};
