import React, { useState, useRef, useEffect } from 'react';
import { InteractionType, PromoScope } from '../types';
import { Check, X } from 'lucide-react';

interface MatrixCellProps {
  rowId: string;
  colId: string;
  rowScope: PromoScope;
  colScope: PromoScope;
  value: InteractionType;
  onChange: (r: string, c: string, val: InteractionType) => void;
  disabled?: boolean;
  isSelf?: boolean;
}

export const MatrixCell: React.FC<MatrixCellProps> = ({ 
    rowId, colId, rowScope, colScope, value, onChange, disabled 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (nextState: InteractionType) => {
    onChange(rowId, colId, nextState);
    setIsOpen(false);
  };

  const renderIcon = () => {
    switch (value) {
      case InteractionType.ALLOW:
        return (
          <div className="w-5 h-5 bg-[#10b981] rounded-[3px] flex items-center justify-center text-white shadow-sm">
            <Check size={14} strokeWidth={4} />
          </div>
        );
      case InteractionType.MUTEX:
        return (
          <div className="w-5 h-5 bg-[#fb7185] rounded-[3px] flex items-center justify-center text-white shadow-sm">
            <X size={14} strokeWidth={4} />
          </div>
        );
      case InteractionType.ITEM_MUTEX:
        return (
          <div className="w-5 h-5 bg-[#60a5fa] rounded-[3px] flex items-center justify-center text-white shadow-sm">
            <div className="w-2 h-2 border-[2.5px] border-white transform rotate-45"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center" ref={dropdownRef}>
      <div 
        className={`w-full h-full min-h-[52px] flex items-center justify-center transition-colors ${disabled ? 'cursor-default' : 'cursor-pointer hover:bg-gray-100/50'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {renderIcon()}
      </div>

      {isOpen && !disabled && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.1)] rounded-lg py-2 z-50 w-36 text-sm text-gray-700">
          <button 
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleSelect(InteractionType.ALLOW); }}
          >
            共享且叠加
          </button>
          <button 
            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
            onClick={(e) => { e.stopPropagation(); handleSelect(InteractionType.MUTEX); }}
          >
            完全互斥
          </button>
          {rowScope === PromoScope.SINGLE_ITEM && colScope === PromoScope.SINGLE_ITEM && (
            <button 
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
              onClick={(e) => { e.stopPropagation(); handleSelect(InteractionType.ITEM_MUTEX); }}
            >
              共享不叠加
            </button>
          )}
        </div>
      )}
    </div>
  );
};