import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─── Toast Context ───────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

// ─── Confirm Context ──────────────────────────────────────────────────────────
const ConfirmContext = createContext(null);

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within AppProvider');
  return ctx;
};

// ─── Toast Component ─────────────────────────────────────────────────────────
const ICONS = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
};

const COLORS = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-indigo-500',
  warning: 'bg-amber-500',
};

function ToastItem({ toast, onRemove }) {
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-2xl text-white min-w-[280px] max-w-[360px] animate-slide-in-right ${COLORS[toast.type] || COLORS.info}`}
      style={{ animation: 'slideInRight 0.3s ease-out' }}
    >
      <span className="flex-shrink-0 mt-0.5">{ICONS[toast.type] || ICONS.info}</span>
      <div className="flex-1 min-w-0">
        {toast.title && <p className="font-black text-sm uppercase tracking-wide">{toast.title}</p>}
        <p className="text-sm font-medium opacity-90 leading-snug">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity ml-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Dialog Component ─────────────────────────────────────────────────
function ConfirmDialog({ dialog, onConfirm, onCancel }) {
  if (!dialog) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
        onClick={e => e.stopPropagation()}
      >
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${
          dialog.type === 'danger' ? 'bg-red-50' : 'bg-indigo-50'
        }`}>
          {dialog.type === 'danger' ? '⚠️' : 'ℹ️'}
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">{dialog.title || 'Are you sure?'}</h3>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">{dialog.message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
          >
            {dialog.cancelText || 'Cancel'}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 font-bold rounded-xl shadow-md transition-colors text-white ${
              dialog.type === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {dialog.confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Combined Provider ────────────────────────────────────────────────────────
let toastIdCounter = 0;

export function AppProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const resolverRef = useRef(null);

  // Toast API
  const addToast = useCallback((message, type = 'success', title = '') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, title = 'Success') => addToast(msg, 'success', title),
    error: (msg, title = 'Error') => addToast(msg, 'error', title),
    info: (msg, title = '') => addToast(msg, 'info', title),
    warning: (msg, title = 'Warning') => addToast(msg, 'warning', title),
  };

  // Confirm API — returns a Promise<boolean>
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmDialog(
        typeof options === 'string'
          ? { message: options }
          : options
      );
    });
  }, []);

  const handleConfirm = () => {
    setConfirmDialog(null);
    resolverRef.current?.(true);
  };

  const handleCancel = () => {
    setConfirmDialog(null);
    resolverRef.current?.(false);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <ConfirmDialog dialog={confirmDialog} onConfirm={handleConfirm} onCancel={handleCancel} />
        <style>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100%); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.85); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
