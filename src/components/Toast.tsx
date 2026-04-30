import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getPalette = () => {
    switch (type) {
      case 'success':
        return {
          icon: '#16A34A',
          iconBg: 'rgba(34,197,94,0.18)',
          bg: 'rgba(34,197,94,0.10)',
          border: 'rgba(34,197,94,0.25)',
          glow: 'rgba(34,197,94,0.18)',
          title: 'Success',
        };
      case 'error':
        return {
          icon: '#DC2626',
          iconBg: 'rgba(239,68,68,0.18)',
          bg: 'rgba(239,68,68,0.10)',
          border: 'rgba(239,68,68,0.25)',
          glow: 'rgba(239,68,68,0.18)',
          title: 'Something went wrong',
        };
      case 'warning':
        return {
          icon: '#D97706',
          iconBg: 'rgba(245,158,11,0.18)',
          bg: 'rgba(245,158,11,0.10)',
          border: 'rgba(245,158,11,0.25)',
          glow: 'rgba(245,158,11,0.18)',
          title: 'Warning',
        };
      case 'info':
        return {
          icon: '#2563EB',
          iconBg: 'rgba(59,130,246,0.18)',
          bg: 'rgba(59,130,246,0.10)',
          border: 'rgba(59,130,246,0.25)',
          glow: 'rgba(59,130,246,0.18)',
          title: 'Info',
        };
      default:
        return {
          icon: '#475569',
          iconBg: 'rgba(148,163,184,0.18)',
          bg: 'rgba(148,163,184,0.10)',
          border: 'rgba(148,163,184,0.25)',
          glow: 'rgba(148,163,184,0.18)',
          title: 'Notice',
        };
    }
  };

  const palette = getPalette();

  return (
    <div
      role="alert"
      className={`w-full rounded-2xl border px-4 py-3 shadow-2xl transition-all duration-200 transform ${
        isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-[0.98] opacity-0 translate-y-2'
      }`}
      style={{
        background: `linear-gradient(135deg, ${palette.bg} 0%, var(--bg) 70%)`,
        color: 'var(--text-primary)',
        borderColor: palette.border,
        boxShadow: `0 16px 40px ${palette.glow}, var(--shadow-lg)`,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex items-center justify-center"
          style={{
            width: 42,
            height: 42,
            borderRadius: 14,
            background: palette.iconBg,
            border: `1px solid ${palette.border}`,
            color: palette.icon,
            flexShrink: 0,
          }}
        >
          {getIcon()}
        </div>

        <div className="flex-1">
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.2px' }}>{palette.title}</p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
            {message}
          </p>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-1 inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors"
          aria-label="Close notification"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
