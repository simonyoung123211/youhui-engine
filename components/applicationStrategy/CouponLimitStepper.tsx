import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface CouponLimitStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  /** 输入非法（非数字）时回退的值，默认取 min */
  fallback?: number;
  disabled?: boolean;
  ariaLabel?: string;
}

export function CouponLimitStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  fallback,
  disabled,
  ariaLabel = '每单优惠券上限',
}: CouponLimitStepperProps) {
  const clamp = (v: number): number => {
    if (!Number.isFinite(v)) return fallback ?? min;
    return Math.min(max, Math.max(min, Math.round(v)));
  };

  const clamped = clamp(value);

  const step = (delta: number) => {
    onChange(clamp(clamped + delta));
  };

  return (
    <div className={`strategy-stepper${disabled ? ' is-disabled' : ''}`}>
      <button
        type="button"
        className="strategy-stepper__btn"
        onClick={() => step(-1)}
        disabled={disabled || clamped <= min}
        aria-label="减少"
      >
        <Minus size={14} />
      </button>
      <input
        type="number"
        className="strategy-stepper__input"
        value={clamped}
        min={min}
        max={max}
        disabled={disabled}
        onChange={e => onChange(clamp(Number(e.target.value)))}
        aria-label={ariaLabel}
      />
      <button
        type="button"
        className="strategy-stepper__btn"
        onClick={() => step(1)}
        disabled={disabled || clamped >= max}
        aria-label="增加"
      >
        <Plus size={14} />
      </button>
      <span className="strategy-stepper__unit">张</span>
    </div>
  );
}
