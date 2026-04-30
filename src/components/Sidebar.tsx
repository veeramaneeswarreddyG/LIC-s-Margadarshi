'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, FileText, Bell, LogOut, ChevronRight,
  Shield, Heart, PiggyBank, AlertCircle,
  Wallet, Settings, Phone, Newspaper, Moon, Sun,
  TrendingUp, Home, Menu, X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';


export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { isDark, setIsDark } = useTheme();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ label: string; y: number } | null>(null);

  if (!user) return null;

  const initials = (user.name || 'U')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const activeTab = (() => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/policies')  return 'policies';
    if (pathname === '/plans')     return 'plans';
    if (pathname === '/news')      return 'news';
    if (pathname === '/profile')   return 'settings';
    return 'dashboard';
  })();

  const handleSignOut = async () => {
    try { await signOut(); router.push('/login'); } catch {}
  };

  /* ─── Colour palette (light vs dark) ─── */
  const D = isDark;
  const SB = {
    bg:        D ? '#1B1D2A'                         : '#FFFFFF',
    text:      D ? '#7B859A'                         : '#5F6368',
    active:    D ? '#FFFFFF'                         : '#1a1a1a',
    activeBg:  D ? 'rgba(200,16,46,0.15)'            : 'rgba(200,16,46,0.08)',
    hoverBg:   D ? 'rgba(255,255,255,0.05)'          : 'rgba(0,0,0,0.04)',
    hoverText: D ? '#C0C8D8'                         : '#202124',
    divider:   D ? 'rgba(255,255,255,0.06)'          : '#EBEBEB',
    section:   D ? '#3A4060'                         : '#B0B8C8',
    srchBg:    D ? 'rgba(255,255,255,0.06)'          : '#F1F3F4',
    srchBdr:   D ? 'rgba(255,255,255,0.05)'          : '#E0E0E0',
    thBg:      D ? 'rgba(255,255,255,0.05)'          : '#F1F3F4',
    shadow:    D ? '0 20px 60px rgba(0,0,0,0.45)'   : '0 8px 40px rgba(0,0,0,0.10)',
    inputClr:  D ? '#E2E8F0'                         : '#202124',
  };

  const NAV = [
    { id: 'dashboard',     label: 'Dashboard',     icon: Home,       route: '/dashboard', badge: null },
    { id: 'policies',      label: 'My Policies',   icon: FileText,   route: '/policies',  badge: null },
    { id: 'plans',         label: 'Explore Plans', icon: TrendingUp, route: '/plans',     badge: null },
    { id: 'payments',      label: 'Payments',      icon: Wallet,     route: '/policies',  badge: 3    },
    { id: 'news',          label: 'LIC News',      icon: Newspaper,  route: '/news',      badge: null },
    { id: 'notifications', label: 'Notifications', icon: Bell,       route: '/dashboard', badge: 14   },
  ];
  const BTNS = [
    { id: 'settings', label: 'Settings', icon: Settings, route: '/profile'   },
    { id: 'support',  label: 'Support',  icon: Phone,    route: '/dashboard' },
  ];
  const GRP = [
    { label: 'Term Plans',    color: '#3B82F6', bg: 'rgba(59,130,246,0.15)',  icon: Shield      },
    { label: 'Endowment',     color: '#10B981', bg: 'rgba(16,185,129,0.15)',  icon: Heart       },
    { label: 'Pension Plans', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', icon: PiggyBank   },
    { label: 'Claim Help',    color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   icon: AlertCircle },
  ];

  /* ─── Single nav button (desktop expanded/collapsed + mobile) ─── */
  const NavBtn = ({
    id, label, icon: Icon, route, badge, exp,
  }: { id: string; label: string; icon: any; route: string; badge: number | null; exp: boolean }) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => { router.push(route); setMobileOpen(false); }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          gap: exp ? 12 : 0,
          justifyContent: exp ? 'flex-start' : 'center',
          padding: exp ? '10px 10px' : '10px 0',
          borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: 1,
          background: active ? SB.activeBg : 'transparent',
          color: active ? '#C8102E' : SB.text,
          fontWeight: active ? 600 : 400, fontSize: 13,
          transition: 'all 0.15s',
          whiteSpace: 'nowrap', overflow: 'hidden',
          borderLeft: active ? '3px solid #C8102E' : '3px solid transparent',
          position: 'relative',
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = SB.hoverBg;
            (e.currentTarget as HTMLElement).style.color = SB.hoverText;
          }
          if (!exp) {
            const r = e.currentTarget.getBoundingClientRect();
            setTooltip({ label, y: r.top + r.height / 2 });
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = SB.text;
          }
          setTooltip(null);
        }}
      >
        <Icon size={17} style={{ flexShrink: 0, opacity: active ? 1 : 0.65 }} />
        {exp && <span style={{ flex: 1 }}>{label}</span>}
        {badge && exp && (
          <span style={{ fontSize: 10, fontWeight: 700, background: '#E53E3E', color: 'white', padding: '1px 7px', borderRadius: 20, flexShrink: 0 }}>{badge}</span>
        )}
        {badge && !exp && (
          <span style={{ position: 'absolute', top: 7, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#E53E3E', border: `1.5px solid ${SB.bg}` }} />
        )}
      </button>
    );
  };

  /* ─── Sidebar inner content (reused for desktop + mobile drawer) ─── */
  const SidebarInner = ({ exp }: { exp: boolean }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Logo header */}
      <div style={{ height: 64, flexShrink: 0, display: 'flex', alignItems: 'center', padding: exp ? '0 12px 0 14px' : '0 6px', justifyContent: exp ? 'flex-start' : 'center', gap: exp ? 10 : 0 }}>
        <img
          src="/lic-emblem.png"
          alt="LIC"
          style={{
            height: exp ? 40 : 34,
            width: 'auto',
            objectFit: 'contain',
            flexShrink: 0,
            filter: D ? 'brightness(0) invert(1)' : 'none',
            transition: 'filter 0.3s, height 0.3s',
          }}
        />
        {exp && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: SB.active, whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>LIC Margadarshi</div>
              <div style={{ fontSize: 10, color: SB.text, fontWeight: 500, marginTop: 1 }}>Insurance Portal</div>
            </div>
            {/* Close btn for mobile drawer */}
            {mobileOpen && (
              <button onClick={() => setMobileOpen(false)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: SB.hoverBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SB.text, flexShrink: 0 }}>
                <X size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Search */}
      <div style={{ padding: exp ? '0 12px 10px' : '0 10px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: SB.srchBg, borderRadius: 10, padding: exp ? '9px 12px' : '9px 0', justifyContent: 'center', border: `1px solid ${SB.srchBdr}` }}>
          <Search size={14} style={{ color: SB.text, flexShrink: 0 }} />
          {exp && <input placeholder="Search..." style={{ background: 'none', border: 'none', outline: 'none', fontSize: 13, color: SB.inputClr, width: '100%' }} />}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 8px', scrollbarWidth: 'none' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: SB.section, padding: exp ? '4px 8px 8px' : '4px 0 8px', textAlign: exp ? 'left' : 'center' }}>Menu</div>
        {NAV.map(item => <NavBtn key={item.id} {...item} exp={exp} />)}
        <div style={{ height: 1, background: SB.divider, margin: '10px 4px' }} />
        {BTNS.map(item => <NavBtn key={item.id} {...item} badge={null} exp={exp} />)}
        <div style={{ height: 1, background: SB.divider, margin: '10px 4px' }} />
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: SB.section, padding: exp ? '0 8px 8px' : '0 0 8px', textAlign: exp ? 'left' : 'center' }}>Group</div>
        {GRP.map(item => (
          <button key={item.label} onClick={() => { router.push('/plans'); setMobileOpen(false); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: exp ? 12 : 0, justifyContent: exp ? 'flex-start' : 'center', padding: exp ? '8px 10px' : '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', marginBottom: 1, background: 'transparent', color: SB.text, fontSize: 13, transition: 'all 0.15s', whiteSpace: 'nowrap', overflow: 'hidden', borderLeft: '3px solid transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = SB.hoverBg; (e.currentTarget as HTMLElement).style.color = SB.hoverText; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = SB.text; }}
          >
            <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <item.icon size={13} style={{ color: item.color }} />
            </div>
            {exp && <><span style={{ flex: 1 }}>{item.label}</span><ChevronRight size={13} style={{ color: SB.section, flexShrink: 0 }} /></>}
          </button>
        ))}
      </nav>


      {/* Theme toggle */}
      <div style={{ padding: exp ? '8px 12px' : '8px 10px', borderTop: `1px solid ${SB.divider}` }}>
        {exp ? (
          <div style={{ display: 'flex', background: SB.thBg, borderRadius: 10, padding: 3 }}>
            <button onClick={() => setIsDark(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: !D ? 'rgba(200,16,46,0.12)' : 'transparent', color: !D ? '#C8102E' : SB.text, fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}><Sun size={12} /> Light</button>
            <button onClick={() => setIsDark(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: D ? 'rgba(255,255,255,0.1)' : 'transparent', color: D ? '#FFFFFF' : SB.text, fontSize: 12, fontWeight: 600, transition: 'all 0.2s' }}><Moon size={12} /> Dark</button>
          </div>
        ) : (
          <button onClick={() => setIsDark(!D)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', background: SB.thBg, border: 'none', borderRadius: 10, cursor: 'pointer', color: SB.text, transition: 'all 0.2s' }}>
            {D ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        )}
      </div>

      {/* User card */}
      <div style={{ padding: exp ? '10px 14px 14px' : '8px 10px 14px', display: 'flex', alignItems: 'center', gap: exp ? 10 : 0, justifyContent: exp ? 'flex-start' : 'center', borderTop: `1px solid ${SB.divider}` }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#C8102E,#8B0D20)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', boxShadow: '0 2px 8px rgba(200,16,46,0.35)' }}>{initials}</div>
        {exp && (
          <>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: SB.active, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'User'}</div>
              <div style={{ fontSize: 10, color: SB.text, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.phoneNumber}</div>
            </div>
            <button onClick={handleSignOut} title="Sign Out"
              style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: SB.hoverBg, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: SB.text, transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = SB.hoverBg; (e.currentTarget as HTMLElement).style.color = SB.text; }}
            ><LogOut size={14} /></button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ─── DESKTOP sidebar (≥1024px) ─── */}
      <aside style={{
        width: sidebarOpen ? 256 : 72,
        flexShrink: 0, background: SB.bg,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 12, bottom: 12, left: 12, zIndex: 50,
        borderRadius: 18, overflow: 'visible',
        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s',
        boxShadow: SB.shadow,
      }}
        className="sb-desktop"
      >
        {/* Clip container */}
        <div style={{ height: '100%', borderRadius: 18, overflow: 'hidden' }}>
          <SidebarInner exp={sidebarOpen} />
        </div>

        {/* Collapse toggle pill */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ position: 'absolute', top: 20, right: -12, width: 24, height: 24, borderRadius: '50%', background: '#3B82F6', border: `2.5px solid ${SB.bg}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff', boxShadow: '0 2px 12px rgba(59,130,246,0.7)', zIndex: 60, transition: 'transform 0.2s, box-shadow 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.15)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          <ChevronRight size={12} style={{ transform: sidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' }} />
        </button>

        {/* Desktop tooltip */}
        {!sidebarOpen && tooltip && (
          <div style={{ position: 'fixed', left: 88, top: tooltip.y - 14, background: D ? '#2D3354' : '#fff', color: D ? '#E2E8F0' : '#1B1D2A', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', zIndex: 999, pointerEvents: 'none', whiteSpace: 'nowrap', border: `1px solid ${SB.srchBdr}` }}>
            {tooltip.label}
          </div>
        )}
      </aside>

      {/* ─── MOBILE top bar (<1024px) ─── */}
      <div className="sb-mobile-bar" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56,
        background: SB.bg,
        borderBottom: `1px solid ${D ? 'rgba(255,255,255,0.07)' : '#E0E0E0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', zIndex: 50,
        boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
      }}>
        <button onClick={() => setMobileOpen(true)} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: SB.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: SB.active }}>
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src="/lic-emblem.png"
            alt="LIC"
            style={{
              height: 30,
              width: 'auto',
              objectFit: 'contain',
              filter: D ? 'brightness(0) invert(1)' : 'none',
              transition: 'filter 0.3s',
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 800, color: SB.active }}>LIC Margadarshi</span>
        </div>
        <button onClick={() => setIsDark(!D)} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: SB.hoverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: SB.text }}>
          {D ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* ─── MOBILE slide-in drawer ─── */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: SB.bg, zIndex: 70, boxShadow: '4px 0 32px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
            <SidebarInner exp={true} />
          </div>
        </>
      )}

      {/* ─── Responsive CSS ─── */}
      <style>{`
        /* Desktop: show sidebar, hide mobile bar */
        @media (min-width: 1024px) {
          .sb-desktop  { display: flex !important; }
          .sb-mobile-bar { display: none !important; }
        }
        /* Mobile/tablet: hide desktop sidebar, show top bar */
        @media (max-width: 1023px) {
          .sb-desktop { display: none !important; }
          .sb-mobile-bar { display: flex !important; }
        }
      `}</style>
    </>
  );
}
