import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  warn: 'bg-amber-500 text-white',
  info: 'bg-gray-800 text-white'
};

let idSeq = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = 'info') => {
    const id = ++idSeq;
    setToasts((list) => [...list, { id, message, type }]);
    setTimeout(() => remove(id), 3000);
  }, [remove]);

  const api = {
    push,
    success: (msg) => push(`✅ ${msg}`, 'success'),
    error: (msg) => push(`❌ ${msg}`, 'error'),
    warn: (msg) => push(`⚠️ ${msg}`, 'warn'),
    deleted: (msg = 'Supprimé') => push(`🗑️ ${msg}`, 'info')
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="no-print pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-toast-up rounded-xl px-5 py-3 text-sm font-semibold shadow-modal ${STYLES[t.type] || STYLES.info}`}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside a ToastProvider');
  return ctx;
}
