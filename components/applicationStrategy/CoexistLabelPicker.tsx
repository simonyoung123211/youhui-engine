import React from 'react';
import { PromotionCategory } from '../../types';
import { SingleItemActivityCategoryId } from '../../types/applicationStrategy';

interface CoexistLabelPickerProps {
  categories: PromotionCategory[];
  selectedIds: SingleItemActivityCategoryId[];
  onChange: (ids: SingleItemActivityCategoryId[]) => void;
  disabled?: boolean;
}

export function CoexistLabelPicker({
  categories,
  selectedIds,
  onChange,
  disabled,
}: CoexistLabelPickerProps) {
  const toggle = (id: SingleItemActivityCategoryId) => {
    if (disabled) return;
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(x => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className={`strategy-check-grid${disabled ? ' is-disabled' : ''}`}>
      {categories.map(cat => {
        const id = cat.id as SingleItemActivityCategoryId;
        const checked = selectedIds.includes(id);
        return (
          <label key={cat.id} className="strategy-check-grid__item">
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(id)}
            />
            <span>{cat.name}</span>
          </label>
        );
      })}
    </div>
  );
}
