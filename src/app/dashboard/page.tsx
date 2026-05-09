'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Search, FileText, Users, Calendar, Calculator,
  CreditCard, Bell, LogOut, User, TrendingUp, Shield,
  ChevronRight, AlertCircle, CheckCircle, Clock, Star,
  ArrowUpRight, Wallet, BarChart3, Settings, Menu, X,
  Heart, Umbrella, PiggyBank, Briefcase, Phone, Mail, Newspaper,
  Moon, Sun, Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/context/ThemeContext';
import { useSidebar } from '@/context/SidebarContext';
import DashboardShell from '@/components/DashboardShell';

/* ─── Animated counter hook ─────────────────────────────── */
function useCounter(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start: number | null = null;
    let raf: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic for a smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
      else setCount(target);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

/* ─── Circular progress ring ────────────────────────────── */
function RingProgress({ pct, size = 60, stroke = 5, color = '#FFB300' }: { pct: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8EAED" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
    </svg>
  );
}

/* ─── Data ───────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { label: 'Pay Premium', icon: CreditCard, gradient: 'linear-gradient(135deg,#FFB300,#ff8800)', route: '/policies' },
  { label: 'Calculator', icon: Calculator, gradient: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', route: '/calculator' },
  { label: 'New Policy', icon: FileText, gradient: 'linear-gradient(135deg,#C8102E,#ff3366)', route: '/plans' },
  { label: 'Claim Status', icon: CheckCircle, gradient: 'linear-gradient(135deg,#22c55e,#16a34a)', route: '/policies' },
  { label: 'LIC News', icon: Newspaper, gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)', route: '/news' },
];

const PLANS = [
  { label: 'Term Plans',    icon: Umbrella,  desc: 'Pure protection, low premium',  tag: 'Popular',     category: 'term'      },
  { label: 'Endowment',     icon: Shield,    desc: 'Savings + life cover',           tag: '',            category: 'endowment' },
  { label: 'Money Back',    icon: PiggyBank, desc: 'Periodic cash returns',          tag: 'Recommended', category: 'moneyback' },
  { label: 'Pension Plans', icon: Briefcase, desc: 'Retirement security',            tag: '',            category: 'pension'   },
];

/* ─── Main Component ─────────────────────────────────────── */
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [greeting, setGreeting] = useState('Good morning');
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifPos, setNotifPos] = useState({ top: 0, right: 0 });
  const bellRef = useRef<HTMLButtonElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isDark, setIsDark } = useTheme();
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();

  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { progress, policies, activities } = useUserData();
  const { showToast, ToastContainer } = useToast();

  // Dynamic calculations based on user data
  const totalSumRaw = policies.reduce((acc, p) => acc + parseInt(p.sum.replace(/\D/g, '') || '0'), 0);
  const totalPremiumRaw = policies.reduce((acc, p) => acc + parseInt(p.premium.replace(/\D/g, '') || '0'), 0);
  
  // Animated counters
  const c1 = useCounter(policies.length);
  const c2 = useCounter(totalSumRaw);
  const c3 = useCounter(totalPremiumRaw);
  const c4 = useCounter(policies.length > 0 ? 12 : 0); // Fake days until we implement real date parsing

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try { await signOut(); router.push('/login'); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, border: '3px solid rgba(255,179,0,0.2)', borderTopColor: '#FFB300', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#5f6368', fontSize: 14 }}>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const initials = (user.name || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <DashboardShell noPadding>
      <ToastContainer />
      <style>{`
        :root {
          --dash-bg: ${isDark ? '#0F1117' : '#F3F4F6'};
          --dash-surface: ${isDark ? '#161B27' : '#FFFFFF'};
          --dash-border: ${isDark ? 'rgba(255,255,255,0.07)' : '#DADCE0'};
          --dash-text: ${isDark ? '#E2E8F0' : '#202124'};
          --dash-text2: ${isDark ? '#94A3B8' : '#5F6368'};
          --dash-navbar-bg: ${isDark ? 'rgba(18,22,36,0.92)' : 'rgba(255,255,255,0.75)'};
          --dash-navbar-border: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)'};
          --dash-navbar-shadow: ${isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(200,16,46,0.08), 0 1px 3px rgba(60,64,67,0.1)'};
          --dash-search-bg: ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(248,249,250,0.8)'};
          --dash-search-border: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(218,220,224,0.7)'};
        }
        @media(min-width:1024px){
          .lg-sidebar{transform:translateX(0)!important;}
          .mobile-topbar{display:none!important;}
          .mobile-overlay{display:none!important;}
        }
        @media(max-width:1023px){
          .desktop-notif{display:none!important;}
        }
        /* ── Hide sidebar scrollbar ── */
        .sidebar-nav::-webkit-scrollbar { display: none; }
        .sidebar-nav { scrollbar-width: none; -ms-overflow-style: none; }
        /* ── KPI grid ── */
        .kpi-grid{
          display:grid;
          grid-template-columns:repeat(2,1fr);
          gap:12px;
          margin-bottom:24px;
        }
        @media(min-width:640px){
          .kpi-grid{grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px;}
        }
        /* ── Two-column main grid ── */
        .main-grid{
          display:grid;
          grid-template-columns:1fr;
          gap:20px;
          margin-bottom:28px;
          align-items:start;
        }
        @media(min-width:900px){
          .main-grid{grid-template-columns:minmax(0,1fr) 300px;}
        }
        /* ── Policy card ── */
        .policy-card{
          background:var(--dash-surface);
          border:1px solid var(--dash-border);
          border-radius:12px;
          padding:16px;
          cursor:pointer;
          transition:all 0.2s ease;
          box-shadow:0 1px 2px rgba(60,64,67,0.08);
        }
        .policy-card:hover{
          box-shadow:0 4px 12px rgba(60,64,67,0.15);
          border-color:#C8102E;
          transform:translateY(-1px);
        }
        .policy-card-inner{
          display:flex;
          align-items:flex-start;
          gap:14px;
        }
        .policy-meta{
          display:flex;
          flex-wrap:wrap;
          gap:10px;
          margin-top:8px;
        }
        .policy-due{
          display:flex;
          flex-direction:column;
          align-items:flex-end;
          flex-shrink:0;
          min-width:80px;
        }
        @media(max-width:480px){
          .policy-due{display:none;}
          .policy-meta-mobile-due{
            display:flex!important;
            align-items:center;
            gap:6px;
            margin-top:6px;
            font-size:12px;
          }
        }
        @media(min-width:481px){
          .policy-meta-mobile-due{display:none!important;}
        }
        /* ── Main content padding ── */
        @media(max-width:640px){
          .main-pad{padding:16px 12px 40px!important;}
          .greeting-pad{padding:20px 18px!important;}
          .greeting-h1{font-size:20px!important;}
        }
        /* ── Glass Navbar ── */
        .glass-navbar {
          position: sticky;
          top: 12px;
          z-index: 150;
          padding: 0 20px;
          margin: 12px 20px 0;
          overflow: visible;
        }
        .glass-navbar-inner {
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px 0 8px;
          background: var(--dash-navbar-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 100px;
          border: 1px solid var(--dash-navbar-border);
          box-shadow: var(--dash-navbar-shadow);
          overflow: visible;
          transition: background 0.3s, border-color 0.3s;
          position: relative;
        }
        .glass-search {
          background: var(--dash-search-bg) !important;
          border: 1px solid var(--dash-search-border) !important;
          color: var(--dash-text) !important;
          backdrop-filter: blur(8px);
          border-radius: 100px !important;
          transition: all 0.2s !important;
        }
        .glass-search::placeholder { color: var(--dash-text2); }
        .glass-search:focus {
          border-color: rgba(200,16,46,0.4) !important;
          box-shadow: 0 0 0 3px rgba(200,16,46,0.08) !important;
          outline: none !important;
        }
        .glass-btn {
          background: var(--dash-search-bg);
          border: 1px solid var(--dash-search-border);
          backdrop-filter: blur(8px);
          transition: all 0.2s;
          color: var(--dash-text2);
        }
        .glass-btn:hover {
          border-color: rgba(200,16,46,0.3);
          box-shadow: 0 2px 8px rgba(200,16,46,0.1);
        }
        @media(max-width:1023px){
          .glass-navbar { margin: 0; top: 0; border-radius: 0; padding: 0 12px; }
          .glass-navbar-inner { border-radius: 0; border-left: none; border-right: none; border-top: none; padding: 0 8px; }
          .navbar-wordmark { display: none; }
          .desktop-notif { display: none; }
        }
        @media(min-width:1024px){
          .navbar-wordmark { display: block; }
        }
        /* ── Notification Panel ── */
        .notif-panel {
          background: #FFFFFF;
          border: 1px solid rgba(218,220,224,0.9);
          box-shadow: 0 24px 64px rgba(60,64,67,0.18), 0 4px 16px rgba(60,64,67,0.08);
          color: #202124;
        }
        .notif-header {
          border-bottom: 1px solid #F1F3F4;
        }
        .notif-title { color: #202124; }
        .notif-illus-box { background: #F1F3F4; }
        .notif-empty-text { color: #9AA0A6; }
        .notif-footer { border-top: 1px solid #F1F3F4; }
        .notif-item:hover { background: #F8F9FA; }
        .notif-item-title { color: #202124; }
        .notif-item-sub { color: #9AA0A6; }
        [data-theme="dark"] .notif-panel {
          background: #1B1D2A !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
          box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 4px 16px rgba(0,0,0,0.3) !important;
          color: #E2E8F0 !important;
        }
        [data-theme="dark"] .notif-header { border-bottom-color: rgba(255,255,255,0.06) !important; }
        [data-theme="dark"] .notif-title { color: #E2E8F0 !important; }
        [data-theme="dark"] .notif-illus-box { background: rgba(255,255,255,0.04) !important; }
        [data-theme="dark"] .notif-empty-text { color: #64748B !important; }
        [data-theme="dark"] .notif-footer { border-top-color: rgba(255,255,255,0.06) !important; }
        [data-theme="dark"] .notif-item:hover { background: rgba(255,255,255,0.04) !important; }
        [data-theme="dark"] .notif-item-title { color: #E2E8F0 !important; }
        [data-theme="dark"] .notif-item-sub { color: #64748B !important; }
      `}</style>

        {/* ══ GLASS NAVBAR ══════════════════════════════════════ */}
        <div className="glass-navbar">
          <div className="glass-navbar-inner">

            {/* Left — LIC Emblem + wordmark */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="mobile-topbar" onClick={() => setSidebarOpen(true)}
                style={{ background: 'none', border: 'none', color: '#5F6368', cursor: 'pointer', padding: 4, display: 'flex' }}>
                <Menu size={20} />
              </button>
              {/* LIC Emblem — no container, theme-aware */}
              <img
                src="/lic-emblem.png"
                alt="LIC"
                style={{
                  height: 44,
                  width: 'auto',
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: isDark ? 'brightness(0) invert(1)' : 'none',
                  transition: 'filter 0.3s',
                }}
              />
              {/* Wordmark — hidden on small screens */}
              <div className="navbar-wordmark">
                <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? '#E2E8F0' : '#202124', lineHeight: 1.1, letterSpacing: '-0.3px' }}>LIC Margadarshi</div>
                <div style={{ fontSize: 10, color: isDark ? '#64748B' : '#9AA0A6', fontWeight: 500, marginTop: 1 }}>Insurance Portal</div>
              </div>
            </div>

            {/* Center — Search */}
            <div style={{ flex: 1, maxWidth: 440, margin: '0 20px', position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9AA0A6', pointerEvents: 'none' }} />
              <input
                className="glass-search"
                placeholder="Search policies, payments…"
                style={{ width: '100%', padding: '8px 16px 8px 36px', fontSize: 13, color: '#202124' }}
              />
            </div>

            {/* Right — Notif + Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              {/* Notification Bell */}
              <div className="desktop-notif" style={{ position: 'relative' }}>
                <button
                  ref={bellRef}
                  className="glass-btn"
                  onClick={() => {
                    if (!notifOpen && bellRef.current) {
                      const r = bellRef.current.getBoundingClientRect();
                      setNotifPos({
                        top: r.bottom + 10,
                        right: window.innerWidth - r.right,
                      });
                    }
                    setNotifOpen(v => !v);
                  }}
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#5F6368', position: 'relative',
                  }}>
                  <Bell size={17} />
                  <span style={{
                    position: 'absolute', top: 7, right: 7, width: 8, height: 8,
                    background: '#C8102E', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.9)',
                  }} />
                </button>
                {notifOpen && (
                  <>
                    {/* Full-screen backdrop */}
                    <div
                      onClick={() => setNotifOpen(false)}
                      style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                    />
                    {/* Floating panel — fixed to viewport, bypasses all overflow */}
                    <div
                      className="notif-panel"
                      style={{
                        position: 'fixed',
                        top: notifPos.top,
                        right: notifPos.right,
                        width: 360,
                        borderRadius: 20,
                        zIndex: 9999,
                        overflow: 'hidden',
                      }}>

                      {/* Header */}
                      <div className="notif-header" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '18px 20px 16px' }}>
                        <span className="notif-title" style={{ fontSize: 16, fontWeight: 800, flex: 1 }}>Notifications</span>
                        {/* Count badge */}
                        <span style={{
                          minWidth: 26, height: 26, borderRadius: 13,
                          background: '#F97316', color: '#fff',
                          fontSize: 13, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 8px',
                        }}>
                          {activities.length}
                        </span>
                      </div>

                      {/* Body */}
                      {activities.length === 0 ? (
                        <div style={{ padding: '40px 20px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                          <div className="notif-illus-box" style={{ width: 120, height: 120, borderRadius: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <ellipse cx="36" cy="58" rx="8" ry="4" fill={isDark ? '#334155' : '#D1D5DB'} />
                              <path d="M14 50 C14 50 16 30 36 28 C56 30 58 50 58 50 H14Z" fill={isDark ? '#475569' : '#D1D5DB'} />
                              <rect x="30" y="50" width="12" height="6" rx="3" fill={isDark ? '#64748B' : '#9CA3AF'} />
                              <circle cx="36" cy="26" r="4" fill={isDark ? '#475569' : '#D1D5DB'} />
                            </svg>
                          </div>
                          <p className="notif-empty-text" style={{ fontSize: 14, fontWeight: 500, margin: 0 }}>No new notifications!</p>
                        </div>
                      ) : (
                        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
                          {activities.slice(0, 6).map((a, i) => (
                            <div key={i} className="notif-item" style={{ display: 'flex', gap: 12, padding: '12px 20px', cursor: 'pointer', transition: 'background 0.15s' }}>
                              <div style={{ width: 9, height: 9, borderRadius: '50%', background: a.type === 'success' ? '#22c55e' : '#3b82f6', flexShrink: 0, marginTop: 4 }} />
                              <div>
                                <div className="notif-item-title" style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{a.text}</div>
                                <div className="notif-item-sub" style={{ fontSize: 11, marginTop: 3 }}>{a.sub}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div style={{
                        padding: '12px 20px',
                        borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#F1F3F4'}`,
                        display: 'flex', justifyContent: 'center',
                      }}>
                        <button style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600,
                          color: '#C8102E', letterSpacing: '0.2px',
                        }}>
                          Mark all as read
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Red divider */}
              <div style={{ width: 1, height: 22, background: 'rgba(200,16,46,0.15)', margin: '0 2px' }} />

              {/* Avatar */}
              <button onClick={() => router.push('/profile')}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#C8102E,#a00d24)',
                  border: '2px solid rgba(200,16,46,0.25)',
                  boxShadow: '0 2px 8px rgba(200,16,46,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: 'white', cursor: 'pointer',
                  letterSpacing: '0.5px',
                }}>{initials}</button>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <main className="main-pad" style={{ flex: 1, overflowY: 'auto', padding: '28px 24px 40px' }}>

          {/* ── Greeting Banner ── */}
          <div style={{
            background: 'linear-gradient(135deg,#C8102E 0%,#a00d24 100%)',
            borderRadius: 16, padding: '28px 32px', marginBottom: 28,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,179,0,0.18),transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', right: 100, bottom: -60, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,0.08),transparent 70%)', pointerEvents: 'none' }} />
            <p style={{ fontSize: 12, color: '#FFB300', fontWeight: 600, marginBottom: 6 }}>{greeting} 👋</p>
            <h1 className="greeting-h1" style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 8, color: 'white' }}>{user.name || 'Welcome back'}!</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', maxWidth: 420 }}>
              {policies.length > 0 
                ? <>You have <span style={{ color: '#FFB300', fontWeight: 700 }}>{policies.length} active policies</span> and your next premium is due in <span style={{ color: 'white', fontWeight: 700 }}>12 days</span>.</>
                : <>Welcome! Add your first policy or explore new plans to get started with your financial journey.</>
              }
            </p>
          </div>

          {/* ── Progress Card (Beginner Guided Flow) ── */}
          {progress && progress.completion_percentage < 100 && (
            <div style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 16, padding: '20px', marginBottom: 28, boxShadow:'0 1px 3px rgba(60,64,67,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--dash-text)' }}>Your Progress</h2>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#C8102E' }}>{progress.completion_percentage}%</span>
              </div>
              <div style={{ width: '100%', height: 8, background: isDark ? 'rgba(255,255,255,0.05)' : '#F1F3F4', borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                <div style={{ width: `${progress.completion_percentage}%`, height: '100%', background: 'linear-gradient(90deg, #FFB300, #C8102E)', borderRadius: 4, transition: 'width 1s ease-out' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {!progress.policies_added && (
                  <button className="lic-btn" style={{ padding: '8px 16px', fontSize: 12, flex: 1 }} onClick={() => router.push('/policies')}>+ Add First Policy</button>
                )}
                {!progress.calculations_done && (
                  <button className="lic-ghost-btn" style={{ padding: '8px 16px', fontSize: 12, flex: 1 }} onClick={() => router.push('/calculator')}>Calculate Premium</button>
                )}
              </div>
            </div>
          )}

          {/* ── KPI Cards ── */}
          <div className="kpi-grid">
            {[
              { label: 'Active Policies', value: c1, suffix: '', icon: Shield, color: '#C8102E', bg: 'rgba(200,16,46,0.08)' },
              { label: 'Total Cover', value: '₹' + (c2 / 100000).toFixed(1) + 'L', raw: true, icon: Umbrella, color: '#FFB300', bg: 'rgba(255,179,0,0.08)' },
              { label: 'Premiums Paid', value: '₹' + (c3 / 100).toFixed(0), raw: true, icon: Wallet, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
              { label: 'Days to Renewal', value: c4, suffix: ' days', icon: Calendar, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
            ].map((kpi, i) => (
              <div key={i} style={{
                background: 'var(--dash-surface)',
                border: '1px solid var(--dash-border)', borderRadius: 12, padding: '20px',
                position: 'relative', overflow: 'hidden',
                transition: 'box-shadow 0.2s, background 0.3s',
                boxShadow: '0 1px 2px rgba(60,64,67,0.08)',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: kpi.bg, pointerEvents: 'none' }} />
                <div style={{
                  width: 36, height: 36, borderRadius: 10, marginBottom: 14,
                  background: kpi.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <kpi.icon size={18} color={kpi.color} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 4, color: 'var(--dash-text)' }}>
                  {kpi.raw ? kpi.value : `${kpi.value}${kpi.suffix || ''}`}
                </div>
                <div style={{ fontSize: 11, color: 'var(--dash-text2)', fontWeight: 500 }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {/* ── Two-Column Grid ── */}
          <div className="main-grid">

            {/* My Policies */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dash-text)' }}>My Policies</h2>
                <button style={{ fontSize: 13, color: '#C8102E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }} onClick={() => router.push('/policies')}>View all →</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {policies.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 12, borderStyle: 'dashed' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,179,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Shield size={24} color="#FFB300" />
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dash-text)', marginBottom: 6 }}>No policies yet</h3>
                    <p style={{ fontSize: 13, color: 'var(--dash-text2)', marginBottom: 16, maxWidth: 220, margin: '0 auto 16px' }}>
                      Add your existing LIC policies here to track premiums and payouts.
                    </p>
                    <button className="lic-btn" style={{ padding: '8px 24px', fontSize: 13 }} onClick={() => router.push('/policies')}>Add Policy</button>
                  </div>
                ) : (
                  policies.map(p => (
                    <div key={p.id} className="policy-card" onClick={() => router.push('/policies')}>
                      <div className="policy-card-inner">
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <RingProgress pct={p.paidPct || 10} size={52} stroke={4} color="#C8102E" />
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#C8102E' }}>
                            {p.paidPct || 10}%
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 14, fontWeight: 800 }}>{p.name}</span>
                            <span style={{ fontSize: 10, background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>Active</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--dash-text2)', marginBottom: 4 }}>{p.type || 'LIC Plan'} · {p.id}</div>
                          <div className="policy-meta">
                            <span style={{ fontSize: 12, color: 'var(--dash-text2)' }}>Sum: <strong style={{ color: 'var(--dash-text)' }}>{p.sum}</strong></span>
                            <span style={{ fontSize: 12, color: 'var(--dash-text2)' }}>Premium: <strong style={{ color: '#C8102E' }}>{p.premium}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Quick Actions */}
              <div style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 12, padding: '18px', boxShadow:'0 1px 3px rgba(60,64,67,0.08)', transition: 'background 0.3s' }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: 'var(--dash-text)' }}>Quick Actions</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {QUICK_ACTIONS.map((a, i) => (
                    <button key={i} style={{
                      padding: '14px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: a.gradient, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      transition: 'transform 0.2s,box-shadow 0.2s',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                    }} onClick={() => router.push(a.route)}>
                      <a.icon size={20} color="white" />
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* News shortcut card */}
              <div onClick={() => router.push('/news')}
                style={{ background: 'var(--dash-surface)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:16, padding:'18px', cursor:'pointer', transition:'all 0.2s ease' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <div style={{ width:32, height:32, borderRadius:10, background:'rgba(59,130,246,0.15)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Newspaper size={16} color="#60a5fa"/>
                  </div>
                  <h2 style={{ fontSize:14, fontWeight:800, margin:0, color:'var(--dash-text)' }}>LIC News</h2>
                </div>
                <p style={{ fontSize:12, color:'var(--dash-text2)', lineHeight:1.5, marginBottom:12 }}>Latest plan launches, revival campaigns &amp; official press releases</p>
                <div style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#60a5fa', fontWeight:700 }}>Read updates <ArrowUpRight size={12}/></div>
              </div>
              {policies.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg,rgba(200,16,46,0.15),rgba(200,16,46,0.05))',
                  border: '1px solid rgba(200,16,46,0.3)', borderRadius: 16, padding: '18px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <AlertCircle size={16} color="#C8102E" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ff6b6b' }}>Premium Due Soon</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--dash-text2)', marginBottom: 14, lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--dash-text)' }}>{policies[0].name}</strong> premium of <strong style={{ color: '#FFB300' }}>{policies[0].premium}</strong> is due in <strong style={{ color: '#C8102E' }}>12 days</strong>
                  </p>
                  <button className="lic-btn" style={{ padding: '10px', fontSize: 12, borderRadius: 10 }} onClick={() => router.push('/policies')}>Pay Now</button>
                </div>
              )}
            </div>
          </div>

          {/* ── Explore Plans ── */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--dash-text)' }}>Explore LIC Plans</h2>
              <button style={{ fontSize: 12, color: '#FFB300', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => router.push('/plans')}>See all →</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
              {PLANS.map((plan, i) => (
                <div key={i}
                  onClick={() => router.push(`/plans?category=${plan.category}`)}
                  style={{
                    background: 'var(--dash-surface)',
                    border: '1px solid var(--dash-border)', borderRadius: 16, padding: '20px',
                    cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative',
                    boxShadow: '0 1px 3px rgba(60,64,67,0.08)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(60,64,67,0.15)';
                    (e.currentTarget as HTMLElement).style.borderColor = '#FFB300';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(60,64,67,0.08)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--dash-border)';
                  }}
                >
                  {plan.tag && (
                    <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 700, background: '#C8102E', color: 'white', padding: '3px 8px', borderRadius: 20 }}>{plan.tag}</span>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,179,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <plan.icon size={20} color="#FFB300" />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, color: 'var(--dash-text)' }}>{plan.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--dash-text2)', lineHeight: 1.5 }}>{plan.desc}</div>
                  <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#FFB300', fontWeight: 600 }}>
                    View plans <ArrowUpRight size={12} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Activity Timeline ── */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>Recent Activity</h2>
            <div style={{ background: 'var(--dash-surface)', border: '1px solid var(--dash-border)', borderRadius: 12, padding: '8px 0', overflow: 'hidden', boxShadow:'0 1px 2px rgba(60,64,67,0.08)' }}>
              {activities.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--dash-text2)', fontSize: 13 }}>
                  No activity recorded yet.
                </div>
              ) : activities.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                  borderBottom: i < activities.length - 1 ? `1px solid var(--dash-border)` : 'none',
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: a.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileText size={15} color={a.type === 'success' ? '#22c55e' : '#3b82f6'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dash-text)' }}>{a.text}</div>
                    <div style={{ fontSize: 11, color: 'var(--dash-text2)', marginTop: 2 }}>{a.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
    </DashboardShell>
  );
}









