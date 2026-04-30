'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="lic-page">
      <style>{`
        .home-trust-num { font-size: 22px; font-weight: 700; color: #FFB300; }
        .home-trust-lbl { font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 2px; }
        .home-feature { display: flex; align-items: center; gap: 12px; padding: 14px 18px;
          background: rgba(255,255,255,0.08); border-radius: 12px; border: 1px solid rgba(255,255,255,0.12);
          margin-bottom: 10px; transition: background 0.2s; }
        .home-feature:hover { background: rgba(255,255,255,0.13); }
        .home-feature-icon { font-size: 22px; flex-shrink: 0; }
        .home-feature-text { font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 500; }
        @media(max-width: 768px) {
          .home-heading { font-size: 40px !important; }
          .home-trust { flex-wrap: wrap; gap: 20px !important; }
        }
      `}</style>

      {/* ── LEFT PANEL – LIC Red Brand ── */}
      <div className="lic-left">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, position: 'relative', zIndex: 1 }}>
          {/* Emblem with golden glow ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: -4,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,179,0,0.35) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <img
              src="/lic-emblem.png"
              alt="LIC Emblem"
              style={{
                width: 72, height: 72,
                objectFit: 'contain',
                flexShrink: 0,
                mixBlendMode: 'multiply',
                display: 'block',
                filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.25))',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'white', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
              LIC Margadarshi
            </div>
            <div style={{ fontSize: 10, color: '#FFB300', fontWeight: 600, letterSpacing: '1.5px', marginTop: 4, textTransform: 'uppercase' }}>
              Policy Advisor
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', color: '#FFB300', marginBottom: 16, textTransform: 'uppercase' }}>
            Your Policy Companion
          </div>
          <h1 className="home-heading" style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, color: 'white', marginBottom: 20, letterSpacing: '-0.5px' }} suppressHydrationWarning>
            Welcome to LIC Margadarshi
          </h1>

          {/* Gold accent line */}
          <div style={{ width: 40, height: 3, background: '#FFB300', borderRadius: 2, marginBottom: 22 }} />

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', maxWidth: 360, lineHeight: 1.75, marginBottom: 36 }}>
            Your trusted guide for LIC policies. Explore plans, manage your portfolio,
            and secure your family's future — all in one place.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 48 }}>
            <button className="lic-btn" style={{ width: 'auto', padding: '12px 32px' }}
              onClick={() => router.push('/login')}>
              Sign In
            </button>
            <button className="lic-ghost-btn" onClick={() => router.push('/signup')}>
              Create Account →
            </button>
          </div>

          {/* Trust badges */}
          <div className="home-trust" style={{ display: 'flex', gap: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            {[
              { num: '35Cr+', label: 'Policyholders' },
              { num: '65+', label: 'Years of Trust' },
              { num: '₹38L Cr', label: 'Life Fund' },
            ].map(b => (
              <div key={b.num}>
                <div className="home-trust-num">{b.num}</div>
                <div className="home-trust-lbl">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div style={{ position: 'relative', zIndex: 1, marginTop: 40, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3px' }}>
          Government of India · IRDAI Regulated
        </div>
      </div>

      {/* ── RIGHT PANEL – Clean White ── */}
      <div className="lic-right">
        <div className="lic-form-card">
          <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            Get Started
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>
            Sign in or create your account to continue
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="lic-btn" onClick={() => router.push('/login')}>
              Sign In to Account
            </button>
            <button className="lic-btn-outline" onClick={() => router.push('/signup')}>
              Create New Account
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '28px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-hint)' }}>What we offer</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Features */}
          {[
            { icon: '🛡️', text: 'Term Insurance Plans' },
            { icon: '💰', text: 'Endowment & Money-Back' },
            { icon: '👴', text: 'Pension & Retirement Plans' },
            { icon: '📰', text: 'Live LIC News & Updates' },
          ].map(item => (
            <div key={item.text} className="home-feature">
              <span className="home-feature-icon">{item.icon}</span>
              <span className="home-feature-text">{item.text}</span>
            </div>
          ))}

          <p style={{ fontSize: 11, color: 'var(--text-hint)', marginTop: 24, textAlign: 'center' }}>
            IRDAI Regulated · Govt. of India Undertaking
          </p>
        </div>
      </div>
    </div>
  );
}
