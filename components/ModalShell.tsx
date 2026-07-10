import React from 'react';
import { createPortal } from 'react-dom';

/** 弹框尺寸：与 ObjectPicker 等保持一致 */
export type ModalSize = 'sm' | 'md' | 'lg';

const PANEL_MAX_W: Record<ModalSize, string> = {
  sm: 'max-w-[min(400px,calc(100vw-2rem))]',
  md: 'max-w-[min(520px,calc(100vw-2rem))]',
  lg: 'max-w-[min(720px,calc(100vw-2rem))]',
};

export const MODAL_MAX_HEIGHT = 'max-h-[min(640px,calc(100vh-2rem))]';

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: React.ReactNode;
  zIndex?: number;
  overlayClassName?: string;
  panelClassName?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  open,
  onClose,
  size = 'md',
  children,
  zIndex = 100,
  overlayClassName = '',
  panelClassName = '',
}) => {
  if (!open) return null;

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 ${overlayClassName}`}
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className={`bg-white w-full ${PANEL_MAX_W[size]} ${MODAL_MAX_HEIGHT} rounded-lg shadow-xl flex flex-col overflow-hidden ${panelClassName}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};
