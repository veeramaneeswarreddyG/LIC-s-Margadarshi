'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, User, Mail, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ResultModal } from '@/components/ResultModal';
import { formatPhoneNumber, validatePhoneNumber, validatePassword } from '@/utils/crypto';

/* ── Inline field error ── */
function FieldErr({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="field-error-msg">{msg}</p>;
}

export default function SignupPage() {
  const [phoneNumber, setPhoneNumber]           = useState('');
  const [name, setName]                         = useState('');
  const [email, setEmail]                       = useState('');
  const [password, setPassword]                 = useState('');
  const [confirmPassword, setConfirmPassword]   = useState('');
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPw, setShowConfirmPw]       = useState(false);
  const [isLoading, setIsLoading]               = useState(false);
  const [showOTPInput, setShowOTPInput]         = useState(false);
  const [isPhoneVerified, setIsPhoneVerified]   = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [resendTimer, setResendTimer]           = useState(0);

  // Inline field errors
  const [phoneErr, setPhoneErr]           = useState('');
  const [nameErr, setNameErr]             = useState('');
  const [emailErr, setEmailErr]           = useState('');
  const [pwErr, setPwErr]                 = useState('');
  const [confirmPwErr, setConfirmPwErr]   = useState('');

  // Result modal
  const [result, setResult] = useState<{
    type: 'success' | 'error'; title: string; message: string; action: string;
  } | null>(null);

  const router = useRouter();
  const { signInWithPhone, verifyOTP, signUp, loading, user } = useAuth();
  const { showToast, ToastContainer } = useToast();

  useEffect(() => { if (user) router.push('/dashboard'); }, [user, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) interval = setInterval(() => setResendTimer(p => p - 1), 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  /* ── Validators ── */
  const validatePhone = () => {
    if (!phoneNumber.trim()) { setPhoneErr('Phone number is required'); return false; }
    if (!validatePhoneNumber(phoneNumber)) { setPhoneErr('Enter a valid 10-digit mobile number'); return false; }
    setPhoneErr(''); return true;
  };
  const validateName = () => {
    if (!name.trim()) { setNameErr('Full name is required'); return false; }
    if (name.trim().length < 2) { setNameErr('Name must be at least 2 characters'); return false; }
    setNameErr(''); return true;
  };
  const validateEmail = () => {
    if (email && !email.includes('@')) { setEmailErr('Enter a valid email address (e.g. you@example.com)'); return false; }
    setEmailErr(''); return true;
  };
  const validatePw = () => {
    if (password && !validatePassword(password)) { setPwErr('Password must be at least 6 characters'); return false; }
    setPwErr(''); return true;
  };
  const validateConfirmPw = () => {
    if (password && confirmPassword !== password) { setConfirmPwErr('Passwords do not match'); return false; }
    setConfirmPwErr(''); return true;
  };

  /* ── OTP Send ── */
  const handlePhoneVerification = async () => {
    if (!validatePhone()) return;
    setIsLoading(true);
    try {
      const res = await signInWithPhone(formatPhoneNumber(phoneNumber));
      setConfirmationResult(res);
      setShowOTPInput(true);
      setResendTimer(120);
      showToast('OTP sent! Check the alert for your code.', 'success');
    } catch (e: any) {
      showToast(e.message || 'Could not send OTP. Please try again.', 'error');
    } finally { setIsLoading(false); }
  };

  /* ── OTP Verify ── */
  const handleOTPVerification = async (otp: string) => {
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      await verifyOTP({ verificationId: confirmationResult.verificationId, otp });
      setIsPhoneVerified(true);
      setShowOTPInput(false);
      showToast('Phone verified! Now fill in your details.', 'success');
    } catch (e: any) {
      setResult({
        type: 'error',
        title: 'OTP Incorrect',
        message: e.message || 'The OTP you entered is invalid or has expired.',
        action: 'Try Again',
      });
    } finally { setIsLoading(false); }
  };

  /* ── Signup ── */
  const handleSignup = async () => {
    const ok = [validateName(), validateEmail(), validatePw(), validateConfirmPw()].every(Boolean);
    if (!ok) return;
    setIsLoading(true);
    try {
      await signUp(formatPhoneNumber(phoneNumber), name.trim(), email || undefined, password || undefined);
      setResult({
        type: 'success',
        title: 'Account Created!',
        message: 'Welcome to LIC Margadarshi! Your account is ready. Let\'s explore your policies.',
        action: 'Go to Dashboard',
      });
    } catch (e: any) {
      setResult({
        type: 'error',
        title: 'Signup Failed',
        message: e.message || 'Something went wrong while creating your account. Please try again.',
        action: 'Try Again',
      });
    } finally { setIsLoading(false); }
  };

  const handleResultAction = () => {
    if (result?.type === 'success') router.push('/dashboard');
    else setResult(null);
  };

  const busy = isLoading || loading;

  const steps = [
    { n: '01', title: 'Verify Phone',     desc: 'Secure OTP verification',        done: isPhoneVerified },
    { n: '02', title: 'Your Details',     desc: 'Name, email & password',          done: false },
    { n: '03', title: 'Explore Policies', desc: 'Tailored LIC recommendations',    done: false },
  ];

  return (
    <div className="lic-page">
      <ToastContainer />

      {result && (
        <ResultModal
          type={result.type}
          title={result.title}
          message={result.message}
          actionLabel={result.action}
          onAction={handleResultAction}
        />
      )}

      {/* ── LEFT PANEL ── */}
      <div className="lic-left">
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                position: 'absolute', inset: -4, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,179,0,0.35) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />
              <img src="/lic-emblem.png" alt="LIC Emblem" style={{
                width: 72, height: 72, objectFit: 'contain', flexShrink: 0,
                mixBlendMode: 'multiply', display: 'block',
                filter: 'drop-shadow(0 2px 8px rgba(255,255,255,0.25))',
              }} />
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
                  <div style={{ fontSize: 13, fontWeight: 600, color: step.done ? '#FFB300' : 'rgba(255,255,255,0.8)' }}>
                    {step.title}
                  </div>
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

          {/* ─── STEP 1: Phone Verification ─── */}
          {!isPhoneVerified && (
            <>
              {/* Phone field */}
              <div style={{ marginBottom: phoneErr ? 6 : 20 }}>
                <label className="lic-label">Phone Number</label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><Phone size={16} /></span>
                  <input
                    id="signup-phone"
                    type="tel"
                    className={`lic-input${phoneErr ? ' field-error' : ''}`}
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={e => { setPhoneNumber(e.target.value); setPhoneErr(''); }}
                    onBlur={validatePhone}
                    onKeyDown={e => { if (e.key === 'Enter' && !showOTPInput) handlePhoneVerification(); }}
                    disabled={showOTPInput}
                  />
                </div>
                <FieldErr msg={phoneErr} />
              </div>

              {/* OTP Input */}
              {showOTPInput && (
                <div style={{ marginBottom: 24 }}>
                  <label className="lic-label">Enter 6-digit OTP</label>
                  <OTPInput onOTPComplete={handleOTPVerification} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                      Didn&apos;t receive code?
                    </p>
                    <button
                      className="lic-link"
                      style={{
                        color: resendTimer > 0 ? 'var(--text-hint)' : 'var(--lic-red)',
                        cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                      }}
                      onClick={handlePhoneVerification}
                      disabled={resendTimer > 0 || busy}
                    >
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                    </button>
                  </div>

                  {busy && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}>
                      <div className="animate-spin" style={{
                        width: 20, height: 20,
                        border: '2px solid var(--border)',
                        borderTopColor: 'var(--lic-red)', borderRadius: '50%',
                      }} />
                    </div>
                  )}
                </div>
              )}

              {/* Send OTP button */}
              {!showOTPInput && (
                <button className="lic-btn" onClick={handlePhoneVerification} disabled={busy}>
                  {busy ? (
                    <>
                      <div className="animate-spin" style={{
                        width: 16, height: 16,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white', borderRadius: '50%',
                      }} />
                      Sending OTP…
                    </>
                  ) : 'Send OTP'}
                </button>
              )}
            </>
          )}

          {/* ─── STEP 2: Profile Details ─── */}
          {isPhoneVerified && (
            <>
              {/* Verified badge */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', marginBottom: 20,
                background: 'rgba(34,197,94,0.08)',
                border: '1px solid rgba(34,197,94,0.25)', borderRadius: 8,
              }}>
                <CheckCircle size={15} color="#22c55e" />
                <span style={{ fontSize: 13, color: '#16a34a', fontWeight: 500 }}>
                  {formatPhoneNumber(phoneNumber)} verified
                </span>
              </div>

              {/* Name */}
              <div style={{ marginBottom: nameErr ? 6 : 16 }}>
                <label className="lic-label">Full Name *</label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><User size={16} /></span>
                  <input
                    id="signup-name"
                    type="text"
                    className={`lic-input${nameErr ? ' field-error' : ''}`}
                    placeholder="Your full name"
                    value={name}
                    onChange={e => { setName(e.target.value); setNameErr(''); }}
                    onBlur={validateName}
                    autoFocus
                  />
                </div>
                <FieldErr msg={nameErr} />
              </div>

              {/* Email */}
              <div style={{ marginBottom: emailErr ? 6 : 16 }}>
                <label className="lic-label">
                  Email <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><Mail size={16} /></span>
                  <input
                    id="signup-email"
                    type="email"
                    className={`lic-input${emailErr ? ' field-error' : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
                    onBlur={validateEmail}
                  />
                </div>
                <FieldErr msg={emailErr} />
              </div>

              {/* Password */}
              <div style={{ marginBottom: pwErr ? 6 : 16 }}>
                <label className="lic-label">
                  Password <span style={{ color: 'var(--text-hint)', fontWeight: 400 }}>(optional)</span>
                </label>
                <div className="lic-input-wrap">
                  <span className="lic-input-icon"><Lock size={16} /></span>
                  <input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`lic-input${pwErr ? ' field-error' : ''}`}
                    style={{ paddingRight: 44 }}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwErr(''); }}
                    onBlur={validatePw}
                  />
                  <button className="lic-input-eye" type="button" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldErr msg={pwErr} />
              </div>

              {/* Confirm Password — shows only when password is typed */}
              {password && (
                <div style={{ marginBottom: confirmPwErr ? 6 : 20 }}>
                  <label className="lic-label">Confirm Password</label>
                  <div className="lic-input-wrap">
                    <span className="lic-input-icon"><Lock size={16} /></span>
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPw ? 'text' : 'password'}
                      className={`lic-input${confirmPwErr ? ' field-error' : ''}`}
                      style={{ paddingRight: 44 }}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setConfirmPwErr(''); }}
                      onBlur={validateConfirmPw}
                    />
                    <button className="lic-input-eye" type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                      {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <FieldErr msg={confirmPwErr} />
                </div>
              )}

              <button className="lic-btn" onClick={handleSignup} disabled={busy}>
                {busy ? (
                  <>
                    <div className="animate-spin" style={{
                      width: 16, height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                    }} />
                    Creating Account…
                  </>
                ) : 'Create Account'}
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

/* ── OTP Box Component ── */
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
    const n = ['', '', '', '', '', ''];
    p.split('').forEach((c, i) => { n[i] = c; });
    setOTP(n);
    refs.current[Math.min(p.length, 5)]?.focus();
    if (p.length === 6) onOTPComplete(p);
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
      {otp.map((d, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          id={`signup-otp-box-${i}`}
          className="lic-otp-box"
          type="text"
          inputMode="numeric"
          value={d}
          maxLength={1}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)}
        />
      ))}
    </div>
  );
}
