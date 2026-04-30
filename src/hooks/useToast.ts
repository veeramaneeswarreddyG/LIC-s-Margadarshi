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
    const id = Date.now().toString();
    const newToast: ToastMessage = { id, message, type };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const ToastContainer = useCallback(() => (
    toasts.length === 0
      ? null
      : React.createElement(
          'div',
          {
            className: 'fixed inset-0 z-50 flex items-center justify-center px-4',
          },
          // light backdrop (prevents the old "side section" feel)
          React.createElement('div', {
            className: 'absolute inset-0 bg-black/20 backdrop-blur-[1px]',
            onClick: () => removeToast(toasts[0].id),
          }),
          React.createElement(
            'div',
            { className: 'relative w-full max-w-sm pointer-events-auto' },
            // show the latest toast as a centered popup
            React.createElement(Toast, {
              key: toasts[toasts.length - 1].id,
              message: toasts[toasts.length - 1].message,
              type: toasts[toasts.length - 1].type,
              onClose: () => removeToast(toasts[toasts.length - 1].id),
            })
          )
        )
  ), [toasts, removeToast]);

  return {
    showToast,
    ToastContainer,
  };
};
