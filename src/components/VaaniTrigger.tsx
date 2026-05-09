'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface VaaniTriggerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * VaaniTrigger — Floating Action Button
 * - Fixed bottom-right on mobile, bottom-right on desktop
 * - Animated Gemini-style 4-pointed star
 * - Pulsing glow ring when closed
 * - Smooth open/close transition
 * - Hover tooltip
 */
export default function VaaniTrigger({ isOpen = false, onToggle }: VaaniTriggerProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      {/* ── Floating button ── */}
      <button
        id="vaani-fab"
        onClick={onToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={isOpen ? "Close LIC's Vaani" : "Open LIC's Vaani AI Assistant"}
        title="LIC's Vaani – AI Assistant"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 60,
          height: 60,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          zIndex: 9990,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isOpen
            ? 'linear-gradient(135deg, #1e293b, #334155)'
            : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: isOpen
            ? '0 4px 20px rgba(0,0,0,0.4)'
            : hovered
              ? '0 8px 32px rgba(124,58,237,0.7), 0 0 0 8px rgba(124,58,237,0.15)'
              : '0 6px 24px rgba(124,58,237,0.5), 0 0 0 0px rgba(124,58,237,0)',
          transform: hovered && !isOpen ? 'scale(1.1)' : isOpen ? 'scale(0.95)' : 'scale(1)',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
          outline: 'none',
        }}
      >
        {/* Pulse ring (only when closed) */}
        {!isOpen && (
          <span style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px solid rgba(124,58,237,0.5)',
            animation: 'vaaniPulse 2.4s ease-out infinite',
            pointerEvents: 'none',
          }} />
        )}

        {/* Second pulse ring (offset) */}
        {!isOpen && (
          <span style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: '2px solid rgba(99,102,241,0.3)',
            animation: 'vaaniPulse 2.4s ease-out infinite 0.8s',
            pointerEvents: 'none',
          }} />
        )}

        {/* Icon: Gemini Star or X */}
        <span style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s',
          transform: isOpen ? 'rotate(90deg) scale(0.9)' : hovered ? 'scale(1.15)' : 'scale(1)',
        }}>
          {isOpen
            ? <X size={24} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
            : <GeminiStar />
          }
        </span>
      </button>

      {/* Hover tooltip — appears to the left of the button */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          bottom: 42,
          right: 100,
          background: 'rgba(15,15,25,0.95)',
          border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 10,
          padding: '6px 14px',
          pointerEvents: 'none',
          zIndex: 9991,
          opacity: hovered && !isOpen ? 1 : 0,
          transform: hovered && !isOpen ? 'translateX(0)' : 'translateX(8px)',
          transition: 'opacity 0.2s, transform 0.2s',
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>LIC's Vaani</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>AI Assistant · Gemini</div>
        {/* Arrow */}
        <div style={{
          position: 'absolute',
          right: -6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderLeft: '6px solid rgba(15,15,25,0.95)',
        }} />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes vaaniPulse {
          0%   { transform: scale(1);    opacity: 0.8; }
          70%  { transform: scale(1.6);  opacity: 0; }
          100% { transform: scale(1.6);  opacity: 0; }
        }
        /* Mobile: nudge button above bottom nav if present */
        @media (max-width: 767px) {
          #vaani-fab {
            bottom: 90px !important;
            right: 16px !important;
            width: 52px !important;
            height: 52px !important;
          }
        }
      `}</style>
    </>
  );
}

/** 4-pointed Gemini-style star SVG */
function GeminiStar() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="gs" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#e879f9" />
          <stop offset="50%"  stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      {/* 4-pointed star — top/bottom/left/right blades */}
      <path
        d="M12 2 C12 2 13 7 12 9 C11 7 12 2 12 2Z"
        fill="url(#gs)" opacity="0.95"
      />
      <path
        d="M22 12 C22 12 17 13 15 12 C17 11 22 12 22 12Z"
        fill="url(#gs)" opacity="0.95"
      />
      <path
        d="M12 22 C12 22 13 17 12 15 C11 17 12 22 12 22Z"
        fill="url(#gs)" opacity="0.95"
      />
      <path
        d="M2 12 C2 12 7 13 9 12 C7 11 2 12 2 12Z"
        fill="url(#gs)" opacity="0.95"
      />
      {/* Diagonal blades (softer) */}
      <path d="M18.36 5.64 C18.36 5.64 15 9 13.5 10.5 C14.5 9 18.36 5.64 18.36 5.64Z" fill="url(#gs)" opacity="0.55"/>
      <path d="M18.36 18.36 C18.36 18.36 15 15 13.5 13.5 C14.5 15 18.36 18.36 18.36 18.36Z" fill="url(#gs)" opacity="0.55"/>
      <path d="M5.64 18.36 C5.64 18.36 9 15 10.5 13.5 C9.5 15 5.64 18.36 5.64 18.36Z" fill="url(#gs)" opacity="0.55"/>
      <path d="M5.64 5.64 C5.64 5.64 9 9 10.5 10.5 C9.5 9 5.64 5.64 5.64 5.64Z" fill="url(#gs)" opacity="0.55"/>
      {/* Bright center */}
      <circle cx="12" cy="12" r="2.5" fill="url(#gs)" opacity="1" />
      <circle cx="12" cy="12" r="1.2" fill="white" opacity="0.9" />
    </svg>
  );
}
