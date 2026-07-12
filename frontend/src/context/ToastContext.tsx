import React, { createContext, useContext, useState } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  React.useEffect(() => {
    const handleGlobalToast = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.message) {
        showToast(detail.message, detail.type || 'info');
      }
    };
    window.addEventListener('toast-notification', handleGlobalToast);
    return () => {
      window.removeEventListener('toast-notification', handleGlobalToast);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => removeToast(t.id)}
            className={`cursor-pointer p-4 rounded-xl shadow-2xl border transition-all duration-300 transform translate-y-0 scale-100 flex items-center justify-between text-sm font-medium ${
              t.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/30'
                : t.type === 'error'
                  ? 'bg-rose-950/90 text-rose-300 border-rose-500/30'
                  : t.type === 'warning'
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-700/30'
            }`}
          >
            <span>{t.message}</span>
            <button className="ml-4 text-xs opacity-50 hover:opacity-100">&times;</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
