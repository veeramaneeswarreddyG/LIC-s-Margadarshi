'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, FileText, Calculator, User, MessageCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  route: string;
  badge?: number;
}

export default function BottomNavigation() {
  const router   = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    { id: 'home',       icon: <Home         size={22} />, label: 'Home',       route: '/dashboard' },
    { id: 'policies',   icon: <FileText     size={22} />, label: 'Policies',   route: '/policies',  badge: 0 },
    { id: 'calculator', icon: <Calculator   size={22} />, label: 'Calculator', route: '/calculator' },
    { id: 'vaani',      icon: <MessageCircle size={22} />, label: 'Vaani',     route: '#vaani' },
    { id: 'profile',    icon: <User         size={22} />, label: 'Profile',    route: '/profile' },
  ];

  const isActive = (route: string) => {
    if (route === '#vaani') return false;
    return pathname === route;
  };

  /* ─── Theme-aware palette ─── */
  const bg       = isDark ? 'rgba(18,22,36,0.96)' : 'rgba(255,255,255,0.97)';
  const border   = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.10)';
  const shadow   = isDark ? '0 -4px 24px rgba(0,0,0,0.5)' : '0 -4px 24px rgba(0,0,0,0.10)';
  const inactiveIcon = isDark ? '#6B7280' : '#9AA0A6';
  const inactiveLabel = isDark ? '#4B5563' : '#9AA0A6';
  const tooltipBg    = isDark ? 'rgba(30,41,59,0.97)' : 'rgba(30,41,59,0.92)';

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: 72,
      background: bg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${border}`,
      boxShadow: shadow,
      zIndex: 40,
      transition: 'background 0.3s, border-color 0.3s',
    }}>

      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(200,16,46,0.4), transparent)',
      }} />

      {/* Nav items */}
      <div style={{
        height: '100%', maxWidth: 480, margin: '0 auto',
        padding: '0 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      }}>
        {navItems.map((item) => {
          const active   = isActive(item.route);
          const hovered  = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.route !== '#vaani') {
                  router.push(item.route);
                } else {
                  window.dispatchEvent(new CustomEvent('openVaani'));
                }
                setHoveredItem(null);
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                width: item.id === 'calculator' ? 54 : 60,
                height: item.id === 'calculator' ? 54 : 60,
                borderRadius: item.id === 'calculator' ? '50%' : 14,
                border: 'none',
                cursor: 'pointer',
                background: item.id === 'calculator'
                  ? 'linear-gradient(135deg, #8B5CF6, #6D28D9)'
                  : active
                    ? 'linear-gradient(135deg, #C8102E 0%, #8B0D20 100%)'
                    : hovered
                      ? isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
                      : 'transparent',
                boxShadow: item.id === 'calculator'
                  ? '0 4px 18px rgba(139,92,246,0.45)'
                  : active ? '0 6px 20px rgba(200,16,46,0.35)' : 'none',
                transform: item.id === 'calculator'
                  ? 'translateY(-10px)'
                  : active ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
                gap: 4,
              }}
            >
              {/* Icon */}
              <span style={{
                color: (active || item.id === 'calculator') ? '#FFFFFF' : inactiveIcon,
                display: 'flex', transition: 'color 0.2s',
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}>
                {item.icon}
              </span>

              {/* Label — always visible below icon */}
              <span style={{
                fontSize: 10,
                fontWeight: (active || item.id === 'calculator') ? 700 : 500,
                color: (active || item.id === 'calculator') ? '#FFFFFF' : inactiveLabel,
                letterSpacing: '0.2px',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}>
                {item.label}
              </span>

              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 18, height: 18,
                  background: '#f97316', color: 'white',
                  fontSize: 10, fontWeight: 700,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${bg}`,
                }}>
                  {item.badge}
                </span>
              )}

              {/* Hover tooltip (only for non-active, on desktop hover) */}
              {hovered && !active && (
                <div style={{
                  position: 'absolute', bottom: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 8,
                  background: tooltipBg,
                  color: 'white',
                  fontSize: 11, fontWeight: 600,
                  padding: '5px 10px',
                  borderRadius: 8,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                  pointerEvents: 'none',
                  animation: 'bnFadeIn 0.15s ease',
                }}>
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes bnFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </nav>
  );
}
