'use client';

import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';

interface VaaniTriggerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

/**
 * Gemini Star Logo + Chat Icon for Vaani Trigger
 * Combined logo with star burst and chat bubble
 */
export default function VaaniTrigger({ isOpen = false, onToggle }: VaaniTriggerProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="fixed top-6 right-6 z-40 group"
      aria-label="Open LIC's Vaani Assistant"
      title="LIC's Vaani - Your Financial Assistant"
    >
      {/* Backdrop glow effect */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-300 ${
          hovered || isOpen ? 'scale-125 opacity-60' : 'scale-100 opacity-0'
        }`}
        style={{
          background: isOpen
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          backdropFilter: 'blur(8px)',
        }}
      />

      {/* Main icon container with liquid glass effect */}
      <div className="relative w-14 h-14 rounded-full flex items-center justify-center overflow-hidden">
        {/* Glass background */}
        <div
          className={`absolute inset-0 transition-all duration-300 ${
            hovered || isOpen ? 'opacity-20 scale-110' : 'opacity-10'
          }`}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50%',
          }}
        />

        {/* Border with gradient */}
        <div
          className={`absolute inset-0 rounded-full transition-all duration-300 ${
            hovered || isOpen ? 'opacity-100' : 'opacity-50'
          }`}
          style={{
            background: isOpen
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.6), rgba(139, 92, 246, 0.6))'
              : 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.4))',
          }}
        />

        {/* Icon content */}
        <div className="relative z-10 flex items-center justify-center">
          {isOpen ? (
            <X
              size={24}
              className={`transition-all duration-300 ${
                isOpen ? 'text-blue-400' : 'text-purple-400'
              }`}
            />
          ) : (
            <GeminiStarIcon hovered={hovered} />
          )}
        </div>
      </div>

      {/* Tooltip label */}
      <div
        className={`absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg whitespace-nowrap pointer-events-none transition-all duration-300 ${
          hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
        style={{
          background: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
        }}
      >
        <p className="text-xs font-semibold text-purple-300">LIC's Vaani</p>
        <p className="text-xs text-gray-400">AI Assistant</p>
      </div>

      {/* Animated star particles (only when not open) */}
      {!isOpen && (
        <>
          <div
            className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
            style={{
              background: 'rgba(139, 92, 246, 0.8)',
              top: '-4px',
              left: '50%',
              animation: hovered ? 'float 2s ease-in-out infinite' : 'none',
              transform: `translateX(-50%) rotate(${hovered ? '360deg' : '0deg'})`,
            }}
          />
          <div
            className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-500 ${
              hovered ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
            style={{
              background: 'rgba(59, 130, 246, 0.8)',
              bottom: '-4px',
              right: '6px',
              animation: hovered ? 'float 2s ease-in-out infinite 0.3s' : 'none',
            }}
          />
        </>
      )}
    </button>
  );
}

/**
 * Gemini Star Icon Component
 * Multi-pointed star with colors inspired by Google Gemini
 */
function GeminiStarIcon({ hovered }: { hovered: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className={`transition-all duration-300 ${hovered ? 'scale-110' : 'scale-100'}`}
    >
      {/* Main 4-pointed Gemini star with color gradient */}
      <defs>
        <linearGradient id="geminiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      {/* Outer points (8 smaller points) */}
      <g>
        {/* Top point */}
        <polygon
          points="12,1 13.5,8 12,7 10.5,8"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
        {/* Top-right point */}
        <polygon
          points="18.9,5.1 14,9 13.5,8 16.5,5"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
        {/* Right point */}
        <polygon
          points="23,12 16,13.5 17,12 16,10.5"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
        {/* Bottom-right point */}
        <polygon
          points="18.9,18.9 14,15 13.5,16 16.5,19"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
        {/* Bottom point */}
        <polygon
          points="12,23 13.5,16 12,17 10.5,16"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
        {/* Bottom-left point */}
        <polygon
          points="5.1,18.9 10,15 10.5,16 7.5,19"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
        {/* Left point */}
        <polygon
          points="1,12 8,13.5 7,12 8,10.5"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
        {/* Top-left point */}
        <polygon
          points="5.1,5.1 10,9 10.5,8 7.5,5"
          fill="url(#geminiGradient)"
          opacity="0.7"
        />
      </g>

      {/* Central star 4-point bright core */}
      <g>
        {/* Top */}
        <polygon
          points="12,2 13,7 12,6 11,7"
          fill="url(#geminiGradient)"
          opacity="1"
        />
        {/* Right */}
        <polygon
          points="22,12 17,13 16,12 17,11"
          fill="url(#geminiGradient)"
          opacity="1"
        />
        {/* Bottom */}
        <polygon
          points="12,22 13,17 12,18 11,17"
          fill="url(#geminiGradient)"
          opacity="1"
        />
        {/* Left */}
        <polygon
          points="2,12 7,13 8,12 7,11"
          fill="url(#geminiGradient)"
          opacity="1"
        />
      </g>

      {/* Center circle with chat bubble hint */}
      <circle cx="12" cy="12" r="4" fill="url(#geminiGradient)" opacity="0.9" />

      {/* Message bubble accent inside star */}
      <g opacity="0.8">
        <path
          d="M11,10 Q10,10 10,11 L10,13 Q10,14 11,14 L13,14 Q14,14 14,13 L14,11 Q14,10 13,10 Z"
          fill="rgba(255,255,255,0.9)"
        />
        {/* Bubble tail */}
        <polygon points="11,14 10,15 10.5,14" fill="rgba(255,255,255,0.9)" />
      </g>
    </svg>
  );
}
