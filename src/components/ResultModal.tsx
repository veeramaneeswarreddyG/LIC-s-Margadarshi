'use client';
/**
 * ResultModal — Reference Image 2 style
 * Glassy rounded card with animated icon, title, message, and action button.
 * Used for login success / failure and any major outcome.
 */
import React, { useEffect, useState } from 'react';

interface ResultModalProps {
  type: 'success' | 'error';
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  type, title, message, actionLabel, onAction,
}) => {
  const [show, setShow] = useState(false);
  const [iconPop, setIconPop] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true), 30);
    const t2 = setTimeout(() => setIconPop(true), 200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const isSuccess = type === 'success';

  const gradientBg = isSuccess
    ? 'linear-gradient(135deg, #a8edca 0%, #5eefa0 50%, #3dd68c 100%)'
    : 'linear-gradient(135deg, #fba4a4 0%, #f87171 50%, #ef4444 100%)';

  const iconBg = isSuccess ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.25)';
  const glowColor = isSuccess ? 'rgba(34,197,94,0.45)' : 'rgba(239,68,68,0.45)';
  const btnBg = isSuccess
    ? 'rgba(255,255,255,0.25)'
    : 'linear-gradient(90deg,rgba(255,255,255,0.20),rgba(255,255,255,0.10))';

  return (
    /* Backdrop */
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15,17,23,0.60)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        opacity: show ? 1 : 0,
        transition: 'opacity 0.35s ease',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: 260,
          background: gradientBg,
          borderRadius: 28,
          padding: '36px 28px 0',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          boxShadow: `0 24px 60px ${glowColor}, 0 4px 20px rgba(0,0,0,0.25)`,
          overflow: 'hidden',
          transform: show ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.9)',
          transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}
      >
        {/* Decorative blobs */}
        <div style={{
          position: 'absolute', top: -30, right: -30,
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(255,255,255,0.12)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: 60, left: -20,
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)', pointerEvents: 'none',
        }} />

        {/* Smiley / Frown badge on icon */}
        <div style={{ position: 'relative', marginBottom: 22 }}>
          {/* Emoji badge */}
          <div style={{
            position: 'absolute', top: -10, right: -10, zIndex: 2,
            width: 26, height: 26, borderRadius: '50%',
            background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            transform: iconPop ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-40deg)',
            transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.15s',
          }}>
            {isSuccess ? '😊' : '😞'}
          </div>

          {/* Big circle icon */}
          <div style={{
            width: 88, height: 88, borderRadius: '50%',
            background: iconBg,
            border: '3px solid rgba(255,255,255,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: iconPop ? 'scale(1)' : 'scale(0.5)',
            transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.05s',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            {isSuccess ? (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path
                  d="M20 6L9 17l-5-5"
                  style={{
                    strokeDasharray: 28,
                    strokeDashoffset: iconPop ? 0 : 28,
                    transition: 'stroke-dashoffset 0.5s ease 0.3s',
                  }}
                />
              </svg>
            ) : (
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"
                  style={{ strokeDasharray: 18, strokeDashoffset: iconPop ? 0 : 18, transition: 'stroke-dashoffset 0.4s ease 0.3s' }} />
                <line x1="6" y1="6" x2="18" y2="18"
                  style={{ strokeDasharray: 18, strokeDashoffset: iconPop ? 0 : 18, transition: 'stroke-dashoffset 0.4s ease 0.42s' }} />
              </svg>
            )}
          </div>
        </div>

        {/* Title */}
        <p style={{
          fontSize: 20, fontWeight: 900, color: 'white',
          letterSpacing: '1.5px', textTransform: 'uppercase',
          marginBottom: 8, textAlign: 'center',
          opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(8px)',
          transition: 'opacity 0.4s ease 0.25s, transform 0.4s ease 0.25s',
        }}>
          {title}
        </p>

        {/* Message */}
        <p style={{
          fontSize: 13, color: 'rgba(255,255,255,0.88)',
          textAlign: 'center', lineHeight: 1.55, marginBottom: 30,
          opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(6px)',
          transition: 'opacity 0.4s ease 0.35s, transform 0.4s ease 0.35s',
        }}>
          {message}
        </p>

        {/* Action button — full-width bottom strip */}
        <button
          onClick={onAction}
          style={{
            width: 'calc(100% + 56px)', marginLeft: -28, marginRight: -28,
            padding: '16px 0',
            border: 'none',
            background: btnBg,
            borderTop: '1.5px solid rgba(255,255,255,0.25)',
            backdropFilter: 'blur(8px)',
            color: 'white',
            fontSize: 13, fontWeight: 800,
            letterSpacing: '1.2px', textTransform: 'uppercase',
            cursor: 'pointer',
            transition: 'background 0.2s, transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.35)')}
          onMouseLeave={e => (e.currentTarget.style.background = isSuccess
            ? 'rgba(255,255,255,0.25)'
            : 'linear-gradient(90deg,rgba(255,255,255,0.20),rgba(255,255,255,0.10))'
          )}
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};
