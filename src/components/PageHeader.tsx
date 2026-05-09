'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface PageHeaderProps {
  children: React.ReactNode;
}

/**
 * Matches the dashboard glass-pill floating navbar style.
 * Wrap your <header> content with this instead of a raw <header>.
 */
export default function PageHeader({ children }: PageHeaderProps) {
  const { isDark } = useTheme();
  const D = isDark;

  const navBg     = D ? 'rgba(18,22,36,0.92)' : 'rgba(255,255,255,0.82)';
  const navBorder = D ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)';
  const navShadow = D
    ? '0 4px 24px rgba(0,0,0,0.4)'
    : '0 4px 24px rgba(200,16,46,0.08), 0 1px 3px rgba(60,64,67,0.10)';

  return (
    <>
      {/* Outer wrapper – sticky float */}
      <div style={{
        position: 'sticky',
        top: 12,
        zIndex: 150,
        padding: '0 20px',
        margin: '12px 20px 0',
      }}>
        {/* Inner pill */}
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px 0 12px',
          background: navBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 100,
          border: `1px solid ${navBorder}`,
          boxShadow: navShadow,
          transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
        }}>
          {children}
        </div>
      </div>

      {/* Responsive: full-width on mobile */}
      <style>{`
        @media (max-width: 1023px) {
          .page-header-outer {
            margin: 0 !important;
            top: 0 !important;
            padding: 0 !important;
          }
          .page-header-inner {
            border-radius: 0 !important;
            border-left: none !important;
            border-right: none !important;
            border-top: none !important;
          }
        }
      `}</style>
    </>
  );
}
