import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { ModalShell } from './ModalShell';

export type ConfirmVariant = 'default' | 'warning' | 'danger';

interface ConfirmActionModalProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  secondaryLabel?: string;
  variant?: ConfirmVariant;
  onCancel: () => void;
  onConfirm: () => void;
  onSecondary?: () => void;
}

const CONFIRM_BTN: Record<ConfirmVariant, string> = {
  default: 'btn btn--primary',
  warning: 'btn btn--primary',
  danger: 'btn btn--primary bg-rose-600 hover:bg-rose-700 border-rose-600',
};

const ICON_COLOR: Record<ConfirmVariant, string> = {
  default: 'text-brand-600',
  warning: 'text-amber-500',
  danger: 'text-rose-500',
};

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  secondaryLabel,
  variant = 'default',
  onCancel,
  onConfirm,
  onSecondary,
}) => (
  <ModalShell open={open} onClose={onCancel} size="sm" zIndex={120}>
    <div className="p-4 border-b border-[#e8e8e8] flex items-center justify-between shrink-0">
      <h3 className="text-[15px] font-semibold text-[#262626] flex items-center gap-2">
        <AlertTriangle size={16} className={ICON_COLOR[variant]} />
        {title}
      </h3>
      <button type="button" onClick={onCancel} className="text-[#8c8c8c] hover:text-[#262626]">
        <X size={18} />
      </button>
    </div>

    <div className="p-4 text-[13px] text-[#595959] leading-relaxed">{description}</div>

    <div className="p-4 border-t border-[#e8e8e8] flex justify-end gap-2 shrink-0">
      <button type="button" className="btn btn--default" onClick={onCancel}>
        {cancelLabel}
      </button>
      {secondaryLabel && onSecondary && (
        <button type="button" className="btn btn--default" onClick={onSecondary}>
          {secondaryLabel}
        </button>
      )}
      <button type="button" className={CONFIRM_BTN[variant]} onClick={onConfirm}>
        {confirmLabel}
      </button>
    </div>
  </ModalShell>
);
