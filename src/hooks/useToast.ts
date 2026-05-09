import { useState, useCallback } from 'react';
import React from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-2), { id, message, type }]); // max 3 stacked
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Stacked top-right corner toasts — NO backdrop, NO modal
  const ToastContainer = useCallback(() => {
    if (toasts.length === 0) return null;
    return React.createElement(
      'div',
      {
        style: {
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          width: 400,
          maxWidth: 'calc(100vw - 40px)',
        },
      },
      toasts.map(t =>
        React.createElement(
          'div',
          { key: t.id, style: { pointerEvents: 'auto' } },
          React.createElement(Toast, {
            message: t.message,
            type: t.type,
            onClose: () => removeToast(t.id),
            duration: 4500,
          })
        )
      )
    );
  }, [toasts, removeToast]);

  return { showToast, ToastContainer };
};
