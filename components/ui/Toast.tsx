import React, { useEffect } from 'react';
import { Check, X, Info, AlertTriangle } from './Icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onRemove={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<ToastMessage & { onRemove: () => void }> = ({ type, message, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const bgColors = {
    success: 'bg-white border-green-500',
    error: 'bg-white border-red-500',
    info: 'bg-white border-blue-500',
    warning: 'bg-white border-orange-500'
  };

  const icons = {
    success: <Check size={18} className="text-green-500" />,
    error: <X size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
    warning: <AlertTriangle size={18} className="text-orange-500" />
  };

  return (
    <div className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 ${bgColors[type]} min-w-[300px] animate-in slide-in-from-right fade-in duration-300`}>
      {icons[type]}
      <p className="text-sm font-medium text-slate-800 flex-1">{message}</p>
      <button onClick={onRemove} className="text-slate-400 hover:text-slate-600">
        <X size={14} />
      </button>
    </div>
  );
};
