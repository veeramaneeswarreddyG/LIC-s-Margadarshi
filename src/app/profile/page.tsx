'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Phone, Mail, Camera, Lock, Settings,
  Bell, Eye, EyeOff, ArrowLeft,
  Shield, CheckCircle, Edit3, Save, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { useToast } from '@/hooks/useToast';
import { useThemeColors } from '@/hooks/useThemeColors';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/PageHeader';
import { ResultModal } from '@/components/ResultModal';

/* Inline field error helper */
function FieldErr({ msg }: { msg: string }) {
  if (!msg) return null;
  return <p className="field-error-msg">{msg}</p>;
}

const SECTION_TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function ProfilePage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [pwData, setPwData] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notifToggles, setNotifToggles] = useState({ push: true, email: false, sms: true, marketing: false });

  // Inline field errors
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [pwErrs, setPwErrs] = useState({ current: '', next: '', confirm: '' });

  // Result modal
  const [result, setResult] = useState<{
    type: 'success' | 'error'; title: string; message: string; action: string;
  } | null>(null);

  const router = useRouter();
  const { user, updateUser, loading } = useAuth();
  const { policies, completeProfile } = useUserData();
  const { showToast, ToastContainer } = useToast();
  const T = useThemeColors();
  const { bg, surface, surface2, border, text, text2, hint, headerBg, shadow, isDark } = T;
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (user) setFormData({ name: user.name || '', email: user.email || '' });
  }, [user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => { setProfileImage(reader.result as string); showToast('Photo updated!', 'success'); };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    let ok = true;
    if (!formData.name.trim()) { setNameErr('Full name is required'); ok = false; } else setNameErr('');
    if (formData.email && !formData.email.includes('@')) { setEmailErr('Enter a valid email (e.g. you@example.com)'); ok = false; } else setEmailErr('');
    if (!ok) return;
    try {
      await updateUser({ name: formData.name, email: formData.email || undefined, photoURL: profileImage || undefined });
      await completeProfile();
      setIsEditing(false);
      setResult({ type: 'success', title: 'Profile Saved!', message: 'Your profile information has been updated successfully.', action: 'Done' });
    } catch (e: any) {
      setResult({ type: 'error', title: 'Save Failed', message: e.message || 'Could not update your profile. Please try again.', action: 'Try Again' });
    }
  };

  const handlePwSave = async () => {
    let ok = true;
    const errs = { current: '', next: '', confirm: '' };
    if (!pwData.current) { errs.current = 'Current password is required'; ok = false; }
    if (!pwData.next) { errs.next = 'New password is required'; ok = false; }
    else if (pwData.next.length < 6) { errs.next = 'Password must be at least 6 characters'; ok = false; }
    if (pwData.next && pwData.next !== pwData.confirm) { errs.confirm = 'Passwords do not match'; ok = false; }
    setPwErrs(errs);
    if (!ok) return;
    setResult({ type: 'success', title: 'Password Updated!', message: 'Your password has been changed successfully. Stay secure!', action: 'Done' });
    setPwData({ current: '', next: '', confirm: '' });
    setPwErrs({ current: '', next: '', confirm: '' });
  };

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: bg || '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 44, height: 44, border: `3px solid ${border || '#F1F3F4'}`, borderTopColor: '#C8102E', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const initials = (user.name || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  /* ─ shared input style ─ */
  const inputStyle: React.CSSProperties = {
    width: '100%', background: surface2, border: `1.5px solid ${border}`, borderRadius: 8,
    padding: '12px 16px 12px 44px', color: text, fontSize: 14, outline: 'none',
    transition: 'all 0.2s',
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: text2, letterSpacing: '0.3px', marginBottom: 7, display: 'block' };

  return (
    <DashboardShell>
    <div suppressHydrationWarning style={{ minHeight: '100vh', background: bg, color: text, fontFamily: 'Inter, sans-serif', transition: 'background 0.3s, color 0.3s' }}>
      <ToastContainer />
      {result && (
        <ResultModal
          type={result.type}
          title={result.title}
          message={result.message}
          actionLabel={result.action}
          onAction={() => setResult(null)}
        />
      )}
      <style>{`.animate-spin{animation:spin 1s linear infinite}@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <PageHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()}
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${border}`, background: surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
            <ArrowLeft size={15} />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 800, color: text }}>My Profile</h1>
        </div>

        {activeSection === 'profile' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: `1px solid ${border}`, background: surface2, color: text2, fontSize: 12, cursor: 'pointer' }}>
                  <X size={13} /> Cancel
                </button>
                <button onClick={handleProfileSave}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: 'none', background: 'linear-gradient(135deg,#C8102E,#a00d24)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(200,16,46,0.35)' }}>
                  <Save size={13} /> Save
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, border: `1px solid ${border}`, background: surface2, color: '#C8102E', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Edit3 size={13} /> Edit Profile
              </button>
            )}
          </div>
        )}
      </PageHeader>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* ── Profile Hero ── */}
        <div style={{
          background: 'linear-gradient(135deg,#C8102E 0%,#a00d24 100%)', borderRadius: 16, padding: '32px',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          {/* glow blobs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,179,0,0.1),transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, left: 100, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,rgba(200,16,46,0.1),transparent)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 24, position: 'relative' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: 'linear-gradient(135deg,#FFB300,#C8102E)',
                border: '3px solid rgba(255,179,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, fontWeight: 900, overflow: 'hidden',
              }}>
                {profileImage
                  ? <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initials}
              </div>
              {isEditing && (
                <button onClick={() => fileRef.current?.click()}
                  style={{
                    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
                    borderRadius: '50%', background: '#FFB300', border: '2px solid #FFFFFF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                  <Camera size={13} color="#FFFFFF" />
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>

            <div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>{user.name || 'User'}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Phone size={13} color={hint} />
                <span style={{ fontSize: 13, color: text2 }}>{user.phoneNumber}</span>
                <span style={{ background: 'rgba(34,197,94,0.18)', color: '#16a34a', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20 }}>Verified</span>
              </div>
              {user.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={13} color="rgba(255,255,255,0.7)" />
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{user.email}</span>
                </div>
              )}
            </div>

            {/* Policy count badge */}
            <div style={{ marginLeft: 'auto', textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 14, padding: '14px 22px', flexShrink: 0 }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#FFB300' }}>{policies.length}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Active<br />Policies</div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div style={{ display: 'flex', background: surface2, borderRadius: 10, padding: 4, marginBottom: 24, gap: 4, border: `1px solid ${border}`, transition: 'background 0.3s' }}>
          {SECTION_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveSection(tab.id)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                background: activeSection === tab.id ? '#C8102E' : 'transparent',
                color: activeSection === tab.id ? 'white' : text2,
              }}>
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── PROFILE SECTION ── */}
        {activeSection === 'profile' && (
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: '24px', boxShadow: shadow, transition: 'background 0.3s' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, color: hint, letterSpacing: '0.8px', textTransform: 'uppercase' }}>PERSONAL INFORMATION</h3>

            {/* Name */}
            <div style={{ marginBottom: nameErr ? 4 : 20 }}>
              <label style={labelStyle}>FULL NAME</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: hint }} />
                <input type="text" value={formData.name}
                  onChange={e => { setFormData({ ...formData, name: e.target.value }); setNameErr(''); }}
                  disabled={!isEditing}
                  className={isEditing && nameErr ? 'field-error' : ''}
                  style={{ ...inputStyle, opacity: !isEditing ? 0.6 : 1 }}
                  placeholder="Your full name"
                />
              </div>
              {isEditing && <FieldErr msg={nameErr} />}
            </div>

            {/* Phone (locked) */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>PHONE NUMBER</label>
              <div style={{ position: 'relative' }}>
                <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: hint }} />
                <input type="tel" value={user.phoneNumber} disabled style={{ ...inputStyle, opacity: 0.5, paddingRight: 90 }} />
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>Verified</span>
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: emailErr ? 4 : 8 }}>
              <label style={labelStyle}>EMAIL ADDRESS</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: hint }} />
                <input type="email" value={formData.email}
                  onChange={e => { setFormData({ ...formData, email: e.target.value }); setEmailErr(''); }}
                  disabled={!isEditing}
                  className={isEditing && emailErr ? 'field-error' : ''}
                  style={{ ...inputStyle, opacity: !isEditing ? 0.6 : 1 }}
                  placeholder="your@email.com"
                />
              </div>
              {isEditing && <FieldErr msg={emailErr} />}
            </div>
          </div>
        )}

        {/* ── SECURITY SECTION ── */}
        {activeSection === 'security' && (
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: '24px', boxShadow: shadow, transition: 'background 0.3s' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 20, color: hint, letterSpacing: '0.8px', textTransform: 'uppercase' }}>CHANGE PASSWORD</h3>

            {[
              { key: 'current', label: 'CURRENT PASSWORD', placeholder: 'Enter current password' },
              { key: 'next',    label: 'NEW PASSWORD',      placeholder: 'Min 6 characters' },
              { key: 'confirm', label: 'CONFIRM NEW PASSWORD', placeholder: 'Re-enter new password' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: pwErrs[f.key as keyof typeof pwErrs] ? 4 : 18 }}>
                <label style={labelStyle}>{f.label}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: hint }} />
                  <input
                    id={`profile-pw-${f.key}`}
                    type={showPw[f.key as keyof typeof showPw] ? 'text' : 'password'}
                    value={pwData[f.key as keyof typeof pwData]}
                    onChange={e => { setPwData({ ...pwData, [f.key]: e.target.value }); setPwErrs({ ...pwErrs, [f.key]: '' }); }}
                    placeholder={f.placeholder}
                    className={pwErrs[f.key as keyof typeof pwErrs] ? 'field-error' : ''}
                    style={{ ...inputStyle, paddingRight: 44 }}
                  />
                  <button type="button"
                    onClick={() => setShowPw({ ...showPw, [f.key]: !showPw[f.key as keyof typeof showPw] })}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: hint, cursor: 'pointer' }}>
                    {showPw[f.key as keyof typeof showPw] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <FieldErr msg={pwErrs[f.key as keyof typeof pwErrs]} />
              </div>
            ))}

            <button onClick={handlePwSave}
              style={{ width: '100%', marginTop: 8, padding: '14px', borderRadius: 50, border: 'none', background: '#C8102E', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px rgba(200,16,46,0.3)' }}>
              Update Password
            </button>

            {/* Security status */}
            <div style={{ marginTop: 24, padding: '16px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <CheckCircle size={15} color="#22c55e" />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>Account Secured</span>
              </div>
              <p style={{ fontSize: 12, color: text2, lineHeight: 1.6 }}>Phone number verified · 2-step authentication enabled</p>
            </div>
          </div>
        )}

        {/* ── SETTINGS SECTION ── */}
        {activeSection === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Notifications */}
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: '20px', boxShadow: shadow, transition: 'background 0.3s' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 18, color: hint, letterSpacing: '0.8px', textTransform: 'uppercase' }}>NOTIFICATIONS</h3>
              {(Object.keys(notifToggles) as (keyof typeof notifToggles)[]).map((key, i) => {
                const labels: Record<string, { label: string; sub: string }> = {
                  push: { label: 'Push Notifications', sub: 'Policy updates & alerts' },
                  email: { label: 'Email Notifications', sub: 'Weekly summaries & offers' },
                  sms: { label: 'SMS Notifications', sub: 'Premium reminders' },
                  marketing: { label: 'Marketing Emails', sub: 'New LIC plans & offers' },
                };
                const on = notifToggles[key];
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < 3 ? 16 : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: surface2, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bell size={15} color={hint} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{labels[key].label}</div>
                        <div style={{ fontSize: 11, color: text2, marginTop: 1 }}>{labels[key].sub}</div>
                      </div>
                    </div>
                    <button onClick={() => setNotifToggles({ ...notifToggles, [key]: !on })}
                      style={{
                        width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                        background: on ? 'linear-gradient(90deg,#FFB300,#C8102E)' : '#e8eaed',
                        position: 'relative', transition: 'all 0.3s ease', flexShrink: 0,
                        boxShadow: on ? '0 2px 10px rgba(200,16,46,0.35)' : 'none',
                      }}>
                      <span style={{
                        position: 'absolute', top: 3, left: on ? 22 : 3,
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'white', transition: 'left 0.3s ease',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                      }} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Danger zone */}
            <div style={{ background: 'rgba(200,16,46,0.05)', border: '1px solid rgba(200,16,46,0.2)', borderRadius: 18, padding: '24px' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: '#ff6b6b' }}>DANGER ZONE</h3>
              <p style={{ fontSize: 12, color: text2, marginBottom: 16, lineHeight: 1.6 }}>Once you delete your account, there is no going back. Please be certain.</p>
              <button style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(200,16,46,0.4)', background: surface2, color: '#ff6b6b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </DashboardShell>
  );
}









