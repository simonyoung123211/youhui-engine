import React, { useEffect } from 'react';
import { CheckCircle2, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  variant?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, visible, onClose, variant = 'success' }) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, 3200);
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  if (!visible) return null;

  const Icon = variant === 'success' ? CheckCircle2 : Info;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
      <div className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white text-sm rounded-xl shadow-2xl border border-gray-700 max-w-md">
        <Icon size={18} className={variant === 'success' ? 'text-emerald-400 shrink-0' : 'text-blue-400 shrink-0'} />
        <span>{message}</span>
      </div>
    </div>
  );
};
