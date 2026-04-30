'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Home, FileText, Calculator, User, MessageCircle } from 'lucide-react';

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  route: string;
  badge?: number;
}

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation('common');
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      id: 'home',
      icon: <Home size={24} />,
      label: 'Home',
      route: '/dashboard',
    },
    {
      id: 'policies',
      icon: <FileText size={24} />,
      label: 'Policies',
      route: '/policies',
      badge: 0,
    },
    {
      id: 'calculator',
      icon: <Calculator size={24} />,
      label: 'Calculator',
      route: '/calculator',
    },
    {
      id: 'vaani',
      icon: <MessageCircle size={24} />,
      label: "Vaani",
      route: '#vaani',
    },
    {
      id: 'profile',
      icon: <User size={24} />,
      label: 'Profile',
      route: '/profile',
    },
  ];

  const isActive = (route: string) => {
    if (route === '#vaani') return false;
    return pathname === route;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-900/95 via-slate-900/90 to-slate-900/80 backdrop-blur-xl border-t border-white/10 z-40">
      {/* Container */}
      <div className="h-full max-w-md mx-auto px-4 flex items-center justify-between">
        {navItems.map((item) => {
          const active = isActive(item.route);
          const isHovered = hoveredItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.route !== '#vaani') {
                  router.push(item.route);
                } else {
                  // Trigger Vaani modal
                  window.dispatchEvent(new CustomEvent('openVaani'));
                }
                setHoveredItem(null);
              }}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="relative flex flex-col items-center justify-center w-16 h-16 rounded-full transition-all duration-300 group"
              style={{
                background: active
                  ? 'linear-gradient(135deg, #C8102E 0%, #8B0D20 100%)'
                  : isHovered
                    ? 'rgba(200, 16, 46, 0.2)'
                    : 'transparent',
                boxShadow: active
                  ? '0 8px 24px rgba(200, 16, 46, 0.4)'
                  : 'none',
                transform: active || isHovered ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              {/* Icon */}
              <span
                className="transition-all duration-300"
                style={{
                  color: active ? '#FFFFFF' : '#A0AEC0',
                  opacity: active ? 1 : 0.7,
                  transform: active || isHovered ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                {item.icon}
              </span>

              {/* Badge */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}

              {/* Label Tooltip */}
              {(isHovered || active) && (
                <div
                  className="absolute -top-10 px-3 py-1 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap border border-white/20 pointer-events-none animate-fadeIn"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {item.label}

                  {/* Arrow */}
                  <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0"
                    style={{
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid rgba(30,41,59,0.95)',
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* CSS */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
}
