import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(null);
let nextToastId = 1;

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const ToastItem = ({ toast, dismiss }) => {
  const timerRef = useRef(null);
  const remainingRef = useRef(3000);
  const startedAtRef = useRef(Date.now());
  const [exiting, setExiting] = useState(false);

  const requestDismiss = useCallback(() => {
    window.clearTimeout(timerRef.current);
    setExiting(true);
    window.setTimeout(() => dismiss(toast.id), 180);
  }, [dismiss, toast.id]);

  const startTimer = useCallback(() => {
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(requestDismiss, remainingRef.current);
  }, [requestDismiss]);

  const pauseTimer = () => {
    window.clearTimeout(timerRef.current);
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
  };

  useEffect(() => {
    startTimer();
    return () => window.clearTimeout(timerRef.current);
  }, [startTimer]);

  return (
    <div
      className={`pizzara-toast toast-${toast.type}${exiting ? ' toast-exiting' : ''}`}
      role="status"
      aria-live="polite"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
    >
      <span className="toast-icon" aria-hidden="true">
        {toast.type === 'success' ? '✓' : toast.type === 'error' ? '!' : toast.type === 'warning' ? '!' : 'i'}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={requestDismiss}>×</button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const add = useCallback((message, type = 'info') => {
    setToasts((current) => {
      if (current.some((toast) => toast.message === message && toast.type === type)) return current;
      const next = [...current, { id: nextToastId++, message, type }];
      return next.slice(-3);
    });
  }, []);

  const value = {
    success: (message) => add(message, 'success'),
    error: (message) => add(message, 'error'),
    warning: (message) => add(message, 'warning'),
    info: (message) => add(message, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pizzara-toast-stack" aria-label="Notifications">
        {toasts.map((toast) => <ToastItem key={toast.id} toast={toast} dismiss={dismiss} />)}
      </div>
    </ToastContext.Provider>
  );
};
