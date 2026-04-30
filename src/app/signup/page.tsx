'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { formatPhoneNumber, validatePhoneNumber, validatePassword } from '@/utils/crypto';

export default function SignupPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOTPInput, setShowOTPInput] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const router = useRouter();
  const { signInWithPhone, verifyOTP, signUp, loading, user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => { if (user) router.push('/dashboard'); }, [user, router]);

  const handlePhoneVerification = async () => {
    if (!validatePhoneNumber(phoneNumber)) { showToast('Enter a valid 10-digit phone number', 'error'); return; }
    setIsLoading(true);
    try {
      const result = await signInWithPhone(formatPhoneNumber(phoneNumber));
      setConfirmationResult(result);
      setShowOTPInput(true);
      showToast('OTP sent! Use 123456 for demo.', 'success');
    } catch (e: any) { showToast(e.message || 'Failed to send OTP', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleOTPVerification = async (otp: string) => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      await verifyOTP({ verificationId: confirmationResult.verificationId, otp });
      setIsPhoneVerified(true);
      setShowOTPInput(false);
      showToast('Phone verified! Fill in your details.', 'success');
    } catch (e: any) { showToast(e.message || 'OTP verification failed', 'error'); }
    finally { setIsLoading(false); }
  };

  const handleSignup = async () => {
    if (!name.trim()) { showToast('Please enter your full name', 'error'); return; }
    if (email && !email.includes('@')) { showToast('Enter a valid email address', 'error'); return; }
    if (password) {
      if (!validatePassword(password)) { showToast('Password must be at least 6 characters', 'error'); return; }
      if (password !== confirmPassword) { showToast('Passwords do not match', 'error'); return; }
    }
    setIsLoading(true);
    try {
      await signUp(formatPhoneNumber(phoneNumber), name.trim(), email || undefined, password || undefined);
      showToast('Account created successfully!', 'success');
      router.push('/dashboard');
    } catch (e: any) { showToast(e.message || 'Signup failed', 'error'); }
    finally { setIsLoading(false); }
  };

  const busy = isLoading || loading;

  const steps = [
    { n: '01', title: 'Verify Phone', desc: 'Secure OTP verification', done: isPhoneVerified },
    { n: '02', title: 'Your Details', desc: 'Name, email & password', done: false },
    { n: '03', title: 'Explore Policies', desc: 'Tailored LIC recommendations', done: false },
  ];

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
            Get Started
          </div>
          <h1 style={{ fontSize: 'clamp(38px, 5vw, 58px)', fontWeight: 700, lineHeight: 1.1, color: 'white', letterSpacing: '-0.5px', marginBottom: 8 }}>
            Join us<br />today!
          </h1>
          <div style={{ width: 36, height: 3, background: '#FFB300', borderRadius: 2, margin: '20px 0' }} />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 320, lineHeight: 1.8, marginBottom: 40 }}>
            Create your account to explore policies, calculate premiums, and get personalised guidance.
          </p>

          {/* Steps overview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 40 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className={`lic-step-circle ${step.done ? 'done' : 'pending'}`}>
                  {step.done ? '✓' : step.n}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#FFB300' : 'rgba(255,255,255,0.8)' }}>{step.title}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button className="lic-ghost-btn" onClick={() => router.push('/login')}>
            Already have an account? →
          </button>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="lic-right">
        <div className="lic-form-card">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Create Account</h2>
          <div className="lic-divider" />

          {/* STEP 1: Phone */}
          {!isPhoneVerified && (
            <>
              <div style={{ marginBottom: 20 }}>
                <label className="lic-label">Phone Number</label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><Phone size={16} /></span>
                  <input
                    type="tel" className="lic-input" placeholder="9876543210"
                    value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !showOTPInput) handlePhoneVerification(); }}
                    disabled={showOTPInput}
                  />
                </div>
              </div>

              {showOTPInput && (
                <div style={{ marginBottom: 24 }}>
                  <label className="lic-label">Enter OTP</label>
                  <p style={{ fontSize: 12, color: 'var(--lic-red)', marginBottom: 14, fontWeight: 500 }}>
                    Demo OTP: <strong>123456</strong>
                  </p>
                  <OTPInput onOTPComplete={handleOTPVerification} />
                  {busy && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                      <div className="animate-spin" style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--lic-red)', borderRadius: '50%' }} />
                    </div>
                  )}
                </div>
              )}

              {!showOTPInput && (
                <button className="lic-btn" onClick={handlePhoneVerification} disabled={busy}>
                  {busy ? <><div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Sending OTP…</> : 'Send OTP'}
                </button>
              )}
            </>
          )}

          {/* STEP 2: Profile Details */}
          {isPhoneVerified && (
            <>
              {/* Verified badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 20,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 8,
              }}>
                <CheckCircle size={15} color="#22c55e" />
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
                  {formatPhoneNumber(phoneNumber)} verified
                </span>
              </div>

              {/* Name */}
              <div style={{ marginBottom: 16 }}>
                <label className="lic-label">Full Name *</label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><User size={16} /></span>
                  <input type="text" className="lic-input" placeholder="Your full name"
                    value={name} onChange={e => setName(e.target.value)} autoFocus />
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 16 }}>
                <label className="lic-label">Email <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(optional)</span></label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><Mail size={16} /></span>
                  <input type="email" className="lic-input" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 16 }}>
                <label className="lic-label">Password <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(optional)</span></label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><Lock size={16} /></span>
                  <input type={showPassword ? 'text' : 'password'} className="lic-input"
                    style={{ paddingRight: 44 }} placeholder="Min 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button className="lic-input-eye" type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              {password && (
                <div style={{ marginBottom: 20 }}>
                  <label className="lic-label">Confirm Password</label>
                  <div className="lic-input-wrap">
                    <span className="lic-input-icon"><Lock size={16} /></span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'} className="lic-input"
                      style={{ paddingRight: 44, borderColor: confirmPassword && confirmPassword !== password ? 'var(--lic-red)' : undefined }}
                      placeholder="Re-enter password"
                      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    />
                    <button className="lic-input-eye" type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p style={{ fontSize: 11, color: 'var(--lic-red)', marginTop: 6 }}>Passwords do not match</p>
                  )}
                </div>
              )}

              <button className="lic-btn" onClick={handleSignup} disabled={busy}>
                {busy ? <><div className="animate-spin" style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%' }} /> Creating Account…</> : 'Create Account'}
              </button>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <button className="lic-link" onClick={() => router.push('/login')}>Sign in</button>
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
