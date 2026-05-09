'use client';
import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const PALETTE: Record<ToastType, {
  border: string; icon: string; iconBg: string;
  bg: string; glow: string; title: string;
}> = {
  success: {
    border: '#22c55e',
    icon: '#16a34a',
    iconBg: 'rgba(34,197,94,0.14)',
    bg: '#ffffff',
    glow: 'rgba(34,197,94,0.18)',
    title: 'Success!',
  },
  error: {
    border: '#ef4444',
    icon: '#dc2626',
    iconBg: 'rgba(239,68,68,0.14)',
    bg: '#ffffff',
    glow: 'rgba(239,68,68,0.18)',
    title: 'Error!',
  },
  warning: {
    border: '#f59e0b',
    icon: '#d97706',
    iconBg: 'rgba(245,158,11,0.14)',
    bg: '#ffffff',
    glow: 'rgba(245,158,11,0.18)',
    title: 'Warning!',
  },
  info: {
    border: '#3b82f6',
    icon: '#2563eb',
    iconBg: 'rgba(59,130,246,0.14)',
    bg: '#ffffff',
    glow: 'rgba(59,130,246,0.18)',
    title: 'Info',
  },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={22} />,
  error:   <AlertCircle  size={22} />,
  warning: <AlertTriangle size={22} />,
  info:    <Info          size={22} />,
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  const [visible, setVisible] = useState(false);
  const p = PALETTE[type];

  useEffect(() => {
    // mount → slide in
    const tIn = setTimeout(() => setVisible(true), 30);
    // auto dismiss
    const tOut = setTimeout(() => { setVisible(false); setTimeout(onClose, 350); }, duration);
    return () => { clearTimeout(tIn); clearTimeout(tOut); };
  }, [duration, onClose]);

  const dismiss = () => { setVisible(false); setTimeout(onClose, 350); };

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        width: '100%',
        maxWidth: 400,
        background: p.bg,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: `0 8px 32px ${p.glow}, 0 2px 8px rgba(0,0,0,0.12)`,
        border: `1.5px solid ${p.border}`,
        // slide-in from right
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(40px) scale(0.97)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
      }}
    >
      {/* Coloured left accent bar */}
      <div style={{ width: 6, alignSelf: 'stretch', background: p.border, flexShrink: 0 }} />

      {/* Icon circle */}
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: p.iconBg, color: p.icon,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, margin: '14px 12px 14px 16px',
      }}>
        {ICONS[type]}
      </div>

      {/* Text */}
      <div style={{ flex: 1, padding: '14px 0', minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 800, color: p.icon, letterSpacing: '-0.1px', marginBottom: 2 }}>
          {p.title}
        </p>
        <p style={{ fontSize: 12.5, color: '#5f6368', lineHeight: 1.45, wordBreak: 'break-word' }}>
          {message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        aria-label="Close"
        style={{
          flexShrink: 0, width: 30, height: 30, borderRadius: '50%',
          border: `1.5px solid ${p.border}`,
          background: p.iconBg, color: p.icon,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', margin: '0 14px', transition: 'transform 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
