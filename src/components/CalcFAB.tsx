'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Calculator } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

/**
 * Floating calculator button visible on all pages except /calculator itself.
 * Glassmorphism design, positioned bottom-right above bottom nav on mobile.
 */
export default function CalcFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();

  // Hide on calculator page itself, login, signup, and home
  if (['/calculator', '/login', '/signup', '/'].includes(pathname)) return null;

  return (
    <>
      <style>{`
        @keyframes calc-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes calc-pulse { 0%{box-shadow:0 0 0 0 rgba(200,16,46,0.5)} 70%{box-shadow:0 0 0 14px rgba(200,16,46,0)} 100%{box-shadow:0 0 0 0 rgba(200,16,46,0)} }
        .calc-fab { animation: calc-float 3s ease-in-out infinite; }
        .calc-fab:hover { animation: none; transform: scale(1.12); }
        .calc-fab::after {
          content: ''; position: absolute; inset: -3px; border-radius: 50%;
          background: conic-gradient(from 0deg, #C8102E, #FFB300, #C8102E);
          z-index: -1; opacity: 0; transition: opacity 0.3s;
        }
        .calc-fab:hover::after { opacity: 1; animation: calc-pulse 1.5s ease infinite; }
        /* Hide on mobile when bottom nav is visible — show above it */
        @media (max-width: 1023px) {
          .calc-fab { bottom: 84px !important; right: 16px !important; width: 48px !important; height: 48px !important; }
        }
      `}</style>

      <button
        className="calc-fab"
        onClick={() => router.push('/calculator')}
        title="Premium Calculator"
        aria-label="Open Premium Calculator"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #C8102E 0%, #a00d24 100%)',
          color: '#fff',
          boxShadow: '0 6px 24px rgba(200,16,46,0.45), 0 2px 8px rgba(0,0,0,0.2)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        <Calculator size={22} />
      </button>
    </>
  );
}
