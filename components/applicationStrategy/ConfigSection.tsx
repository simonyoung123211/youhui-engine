import React from 'react';

interface ConfigSectionProps {
  title: string;
  description?: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  children?: React.ReactNode;
  sectionId?: string;
  readOnly?: boolean;
}

export function ConfigSection({
  title,
  description,
  enabled,
  onEnabledChange,
  children,
  sectionId,
  readOnly,
}: ConfigSectionProps) {
  const disabled = readOnly || !enabled;
  return (
    <section className="strategy-config-section" id={sectionId}>
      <div className="strategy-config-section__header">
        <div className="strategy-config-section__title-wrap">
          <h3 className="strategy-config-section__title">{title}</h3>
          {description && <p className="strategy-config-section__desc">{description}</p>}
        </div>
        <select
          className="strategy-select"
          value={enabled ? 'on' : 'off'}
          disabled={readOnly}
          onChange={e => onEnabledChange(e.target.value === 'on')}
          aria-label={`${title}开关`}
        >
          <option value="on">开启</option>
          <option value="off">关闭</option>
        </select>
      </div>
      {children && (
        <div
          className={`strategy-config-section__body${disabled ? ' is-disabled' : ''}`}
          aria-disabled={disabled}
        >
          {children}
        </div>
      )}
    </section>
  );
}

interface StrategySelectRowProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}

export function StrategySelectRow({
  label,
  hint,
  value,
  onChange,
  options,
  disabled,
}: StrategySelectRowProps) {
  return (
    <div className={`strategy-row${disabled ? ' is-disabled' : ''}`}>
      <div className="strategy-row__main">
        <div className="strategy-row__label">{label}</div>
        {hint && <p className="strategy-row__hint">{hint}</p>}
      </div>
      <select
        className="strategy-select"
        value={value}
        disabled={disabled}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface StrategyCheckboxRowProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
}

export function StrategyCheckboxRow({
  label,
  checked,
  onChange,
  disabled,
  hint,
}: StrategyCheckboxRowProps) {
  return (
    <label className={`strategy-check-row${disabled ? ' is-disabled' : ''}`}>
      <input
        type="checkbox"
        className="strategy-check-row__input"
        checked={checked}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
      />
      <span className="strategy-check-row__text">
        {label}
        {hint && <span className="strategy-check-row__hint">{hint}</span>}
      </span>
    </label>
  );
}

interface StrategyRadioGroupProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  disabled?: boolean;
}

export function StrategyRadioGroup({
  label,
  hint,
  value,
  onChange,
  options,
  disabled,
}: StrategyRadioGroupProps) {
  return (
    <div className={`strategy-radio-group${disabled ? ' is-disabled' : ''}`}>
      <div className="strategy-radio-group__label">{label}</div>
      {hint && <p className="strategy-row__hint">{hint}</p>}
      <div className="strategy-radio-group__options">
        {options.map(opt => (
          <label key={opt.value} className="strategy-radio-option">
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
            />
            <span>
              <span className="strategy-radio-option__label">{opt.label}</span>
              {opt.description && (
                <span className="strategy-radio-option__desc">{opt.description}</span>
              )}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}

interface StrategySubGroupProps {
  title: string;
  children: React.ReactNode;
  error?: string;
}

export function StrategySubGroup({ title, children, error }: StrategySubGroupProps) {
  return (
    <div className="strategy-sub-group">
      <div className="strategy-sub-group__title">{title}</div>
      <div className="strategy-sub-group__content">{children}</div>
      {error && <p className="strategy-field-error">{error}</p>}
    </div>
  );
}
