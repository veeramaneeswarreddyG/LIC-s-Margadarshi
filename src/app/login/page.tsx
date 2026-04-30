'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatPhoneNumber, validatePhoneNumber, validatePassword } from '@/utils/crypto';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const router = useRouter();
  const { signInWithPhone, verifyOTP, signInWithPassword, loading, user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => { if (user) router.push('/dashboard'); }, [user, router]);

  const handlePhoneLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) { showToast('Enter a valid phone number', 'error'); return; }
    setIsLoading(true);
    try {
      const result = await signInWithPhone(formatPhoneNumber(phoneNumber));
      setConfirmationResult(result);
      setShowOTPInput(true);
      showToast('OTP sent! Use 123456 for demo.', 'success');
    } catch (e: any) { showToast(e.message || 'Failed to send OTP', 'error'); }
    finally { setIsLoading(false); }
  };

  const handlePasswordLogin = async () => {
    if (!validatePhoneNumber(phoneNumber)) { showToast('Enter a valid phone number', 'error'); return; }
    if (!validatePassword(password)) { showToast('Password must be at least 6 characters', 'error'); return; }
    setIsLoading(true);
    try {
      await signInWithPassword(formatPhoneNumber(phoneNumber), password);
      showToast('Login successful!', 'success');
      router.push('/dashboard');
    } catch (e: any) { showToast(e.message || 'Login failed', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleOTPVerification = async (otp: string) => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      const verifiedUser = await verifyOTP({ verificationId: confirmationResult.verificationId, otp });
      if (verifiedUser.name) {
        showToast('Welcome back!', 'success'); router.push('/dashboard');
      } else {
        showToast('Please complete your profile.', 'info'); router.push('/signup');
      }
    } catch (e: any) { showToast(e.message || 'OTP verification failed', 'error'); }
    finally { setIsLoading(false); }
  };

  const busy = isLoading || loading;

  return (
    <div className="lic-page">
      <ToastContainer />

      {/* ── LEFT PANEL ── */}
      <div className="lic-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
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

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '1.5px', color: '#FFB300', marginBottom: 14, textTransform: 'uppercase' }}>
            Welcome Back
          </div>
          <h1 style={{ fontSize: 'clamp(38px, 5vw, 60px)', fontWeight: 700, lineHeight: 1.1, color: 'white', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Sign in to your<br />account
          </h1>
          <div style={{ width: 36, height: 3, background: '#FFB300', borderRadius: 2, margin: '20px 0' }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 320, lineHeight: 1.8, marginBottom: 40 }}>
            Access your LIC policies, track premiums, and get personalised guidance.
          </p>

          <button className="lic-ghost-btn" onClick={() => router.push('/signup')}>
            New here? Create account →
          </button>

          <div style={{ marginTop: 60, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.7 }}>
              Securing India's families since 1956<br />
              IRDAI Regulated · Govt. of India Undertaking
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="lic-right">
        <div className="lic-form-card">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Sign in</h2>
          <div className="lic-divider" />

          {/* Method Toggle */}
          {!showOTPInput && (
            <div className="lic-tab-group" style={{ marginBottom: 24 }}>
              <button className={`lic-tab ${loginMethod === 'password' ? 'active' : ''}`} onClick={() => setLoginMethod('password')}>Password</button>
              <button className={`lic-tab ${loginMethod === 'otp' ? 'active' : ''}`} onClick={() => setLoginMethod('otp')}>OTP</button>
            </div>
          )}

          {/* Phone */}
          <div style={{ marginBottom: 18 }}>
            <label className="lic-label">Phone Number</label>
            <div className="lic-input-wrap">
              <span className="lic-input-icon"><Phone size={16} /></span>
              <input
                type="tel" className="lic-input" placeholder="9876543210"
                value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !showOTPInput) { loginMethod === 'otp' ? handlePhoneLogin() : handlePasswordLogin(); } }}
                disabled={showOTPInput}
              />
            </div>
          </div>

          {/* Password */}
          {loginMethod === 'password' && !showOTPInput && (
            <div style={{ marginBottom: 24 }}>
              <label className="lic-label">Password</label>
              <div className="lic-input-wrap">
                <span className="lic-input-icon"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'} className="lic-input"
                  style={{ paddingRight: 44 }} placeholder="Your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handlePasswordLogin(); }}
                />
                <button className="lic-input-eye" type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {/* OTP Input */}
          {showOTPInput && (
            <div style={{ marginBottom: 24 }}>
              <label className="lic-label">Enter OTP</label>
              <p style={{ fontSize: 12, color: 'var(--lic-red)', marginBottom: 14, fontWeight: 500 }}>
                Demo OTP: <strong>123456</strong>
              </p>
              <OTPInput onOTPComplete={handleOTPVerification} />
            </div>
          )}

          {/* Submit */}
          {!showOTPInput && (
            <button className="lic-btn" onClick={loginMethod === 'otp' ? handlePhoneLogin : handlePasswordLogin} disabled={busy}>
              {busy
                ? <><div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Please wait…</>
                : loginMethod === 'otp' ? 'Send OTP' : 'Sign In'
              }
            </button>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <button className="lic-link" onClick={() => router.push('/signup')}>Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── OTP Input ── */
function OTPInput({ onOTPComplete }: { onOTPComplete: (otp: string) => void }) {
  const [otp, setOTP] = useState(['', '', '', '', '', '']);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val) || val.length > 1) return;
    const n = [...otp]; n[i] = val; setOTP(n);
    if (val && i < 5) refs.current[i + 1]?.focus();
    if (n.every(d => d)) onOTPComplete(n.join(''));
  };
  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const n = ['', '', '', '', '', '']; p.split('').forEach((c, i) => { n[i] = c; });
    setOTP(n); refs.current[Math.min(p.length, 5)]?.focus();
    if (p.length === 6) onOTPComplete(p);
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
      {otp.map((d, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }}
          className="lic-otp-box" type="text" inputMode="numeric"
          value={d} maxLength={1}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
}
