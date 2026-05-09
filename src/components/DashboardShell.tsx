'use client';

import React from 'react';
import Sidebar from './Sidebar';
import CalcFAB from './CalcFAB';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';

interface DashboardShellProps {
  children: React.ReactNode;
  noPadding?: boolean;
}

export default function DashboardShell({ children, noPadding }: DashboardShellProps) {
  const { isDark, mounted } = useTheme();
  const { open } = useSidebar();

  // Desktop margin: 12px gap + sidebar-width + 12px gap
  const marginLeft = open ? 280 : 96;

  // Use light theme values until mounted to match SSR output exactly.
  // After mount, the real localStorage preference is applied with no mismatch.
  const bg    = mounted && isDark ? '#0F1117' : '#F3F4F6';
  const color = mounted && isDark ? '#E2E8F0' : '#202124';

  return (
    // suppressHydrationWarning prevents React from warning about the
    // intentional light→dark switch that happens after mount.
    <div
      suppressHydrationWarning
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: bg,
        color,
        fontFamily: 'Inter, sans-serif',
        transition: 'background 0.3s, color 0.3s',
      }}
    >
      <Sidebar />

      {/* ── Responsive styles ── */}
      <style suppressHydrationWarning>{`
        .shell-main {
          flex: 1;
          min-width: 0;
          box-sizing: border-box;
          /* Desktop: offset for fixed floating sidebar */
          margin-left: ${marginLeft}px;
          padding: ${noPadding ? '0' : '16px 20px 40px'};
          transition: margin-left 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        /* Tablet / Mobile: no left margin, add top space for the top bar */
        @media (max-width: 1023px) {
          .shell-main {
            margin-left: 0 !important;
            padding-top: ${noPadding ? '56px' : '72px'} !important;
            padding-left: ${noPadding ? '0' : '16px'} !important;
            padding-right: ${noPadding ? '0' : '16px'} !important;
          }
        }
      `}</style>

      <main className="shell-main">
        {children}
      </main>

      <CalcFAB />
    </div>
  );
}
