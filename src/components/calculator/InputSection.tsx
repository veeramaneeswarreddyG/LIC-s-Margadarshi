'use client';
import React, { useState } from 'react';
import { User, Cigarette, Target, DollarSign, Calendar, Clock, CreditCard, ChevronDown, ChevronUp, Shield, Heart, AlertCircle } from 'lucide-react';
import type { CalcInput, PlanType, Goal, Gender, PaymentMode } from '@/lib/premium-engine';
import { PLAN_LIMITS } from '@/lib/premium-engine';

interface Props {
  input: CalcInput;
  onChange: (v: Partial<CalcInput>) => void;
  isDark: boolean;
  surface: string; surface2: string; border: string; text: string; text2: string; hint: string;
}

const GOALS: { id: Goal; label: string; emoji: string }[] = [
  { id: 'protection', label: 'Family Protection', emoji: '🛡️' },
  { id: 'savings',    label: 'Long-term Savings', emoji: '💰' },
  { id: 'child',      label: 'Child Education',   emoji: '🎓' },
  { id: 'retirement', label: 'Retirement',         emoji: '👴' },
  { id: 'tax',        label: 'Tax Saving',         emoji: '📉' },
  { id: 'wealth',     label: 'Wealth Creation',    emoji: '📈' },
  { id: 'marriage',   label: 'Marriage Planning',  emoji: '💍' },
];

const MODES: { id: PaymentMode; label: string }[] = [
  { id: 'annual', label: 'Yearly' }, { id: 'half-yearly', label: 'Half Yearly' },
  { id: 'quarterly', label: 'Quarterly' }, { id: 'monthly', label: 'Monthly' },
];

/* ── Shared styles ── */
const labelSt = (text2: string): React.CSSProperties => ({ fontSize: 11, fontWeight: 600, color: text2, letterSpacing: '0.5px', marginBottom: 6, display: 'block', textTransform: 'uppercase' as const });
const inputSt = (surface2: string, border: string, text: string): React.CSSProperties => ({
  width: '100%', background: surface2, border: `1.5px solid ${border}`, borderRadius: 12,
  padding: '12px 14px', color: text, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
  boxSizing: 'border-box' as const,
});
const sliderSt: React.CSSProperties = { width: '100%', accentColor: '#C8102E', cursor: 'pointer', height: 6 };

export default function InputSection({ input, onChange, isDark, surface, surface2, border, text, text2, hint }: Props) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const limits = PLAN_LIMITS[input.planType];

  const Row = ({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 14, marginBottom: 18 }}>{children}</div>
  );

  const Field = ({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) => (
    <div>
      <label style={labelSt(text2)}>{label}</label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: hint, zIndex: 1 }} />}
        {children}
      </div>
    </div>
  );

  const fmt = (v: number) => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* ── Age & Gender ── */}
      <Row>
        <Field label="Your Age" icon={User}>
          <input type="number" min={0} max={100} value={input.age}
            onChange={e => onChange({ age: Math.max(0, Math.min(100, +e.target.value)) })}
            style={{ ...inputSt(surface2, border, text), paddingLeft: 36 }} />
        </Field>
        <Field label="Gender">
          <div style={{ display: 'flex', gap: 8 }}>
            {(['male', 'female'] as Gender[]).map(g => (
              <button key={g} onClick={() => onChange({ gender: g })} style={{
                flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: input.gender === g ? 'none' : `1.5px solid ${border}`,
                background: input.gender === g ? (g === 'male' ? 'linear-gradient(135deg,#3B82F6,#1D4ED8)' : 'linear-gradient(135deg,#EC4899,#BE185D)') : surface2,
                color: input.gender === g ? '#fff' : text, transition: 'all 0.2s',
              }}>
                {g === 'male' ? '♂ Male' : '♀ Female'}
              </button>
            ))}
          </div>
        </Field>
      </Row>

      {/* ── Smoker toggle ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: surface2, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cigarette size={15} color={input.smoking ? '#EF4444' : hint} />
            <span style={{ fontSize: 13, fontWeight: 600, color: text }}>Tobacco / Smoker</span>
          </div>
          <button onClick={() => onChange({ smoking: !input.smoking })} style={{
            width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
            background: input.smoking ? 'linear-gradient(90deg,#EF4444,#C8102E)' : isDark ? '#334155' : '#e2e8f0',
            transition: 'background 0.3s', flexShrink: 0,
          }}>
            <span style={{ position: 'absolute', top: 3, left: input.smoking ? 22 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
          </button>
        </div>
      </div>

      {/* ── Goal ── */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelSt(text2)}>Your Goal</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {GOALS.map(g => (
            <button key={g.id} onClick={() => onChange({ goal: g.id })} style={{
              padding: '8px 14px', borderRadius: 20, border: input.goal === g.id ? 'none' : `1.5px solid ${border}`,
              background: input.goal === g.id ? 'linear-gradient(135deg,#C8102E,#a00d24)' : surface2,
              color: input.goal === g.id ? '#fff' : text, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
              boxShadow: input.goal === g.id ? '0 3px 10px rgba(200,16,46,0.3)' : 'none',
            }}>
              {g.emoji} {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sum Assured Slider ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={labelSt(text2)}>Sum Assured</label>
          <span style={{ fontSize: 15, fontWeight: 800, color: '#C8102E' }}>{fmt(input.sumAssured)}</span>
        </div>
        <input type="range" min={limits.minSA} max={Math.max(limits.minSA * 40, 20000000)} step={limits.minSA < 200000 ? 25000 : 500000}
          value={input.sumAssured} onChange={e => onChange({ sumAssured: +e.target.value })} style={sliderSt} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: hint, marginTop: 4 }}>
          <span>{fmt(limits.minSA)}</span><span>{fmt(Math.max(limits.minSA * 40, 20000000))}</span>
        </div>
      </div>

      {/* ── Annual Income ── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={labelSt(text2)}>Annual Income</label>
          <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{fmt(input.annualIncome)}</span>
        </div>
        <input type="range" min={200000} max={10000000} step={50000}
          value={input.annualIncome} onChange={e => onChange({ annualIncome: +e.target.value })} style={sliderSt} />
      </div>

      {/* ── Policy Term & Premium Term ── */}
      <Row>
        <Field label="Policy Term (Years)" icon={Calendar}>
          <input type="number" min={limits.minTerm} max={limits.maxTerm} value={input.policyTerm}
            onChange={e => onChange({ policyTerm: Math.max(limits.minTerm, Math.min(limits.maxTerm, +e.target.value)) })}
            style={{ ...inputSt(surface2, border, text), paddingLeft: 36 }} />
        </Field>
        <Field label="Premium Term (Years)" icon={Clock}>
          <input type="number" min={limits.minTerm} max={limits.maxTerm} value={input.premiumTerm}
            onChange={e => onChange({ premiumTerm: Math.max(limits.minTerm, Math.min(limits.maxTerm, +e.target.value)) })}
            style={{ ...inputSt(surface2, border, text), paddingLeft: 36 }} />
        </Field>
      </Row>

      {/* ── Payment Mode ── */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelSt(text2)}>Payment Frequency</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {MODES.map(m => (
            <button key={m.id} onClick={() => onChange({ paymentMode: m.id })} style={{
              padding: '10px 4px', borderRadius: 10, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: input.paymentMode === m.id ? 'none' : `1.5px solid ${border}`,
              background: input.paymentMode === m.id ? 'linear-gradient(135deg,#FFB300,#F59E0B)' : surface2,
              color: input.paymentMode === m.id ? '#fff' : text, transition: 'all 0.2s',
              boxShadow: input.paymentMode === m.id ? '0 3px 10px rgba(255,179,0,0.3)' : 'none',
            }}>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Advanced Options ── */}
      <button onClick={() => setShowAdvanced(!showAdvanced)} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
        padding: '12px 16px', borderRadius: 12, border: `1px solid ${border}`, background: surface2,
        color: text2, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: showAdvanced ? 14 : 0,
      }}>
        <span>⚙️ Advanced Options</span>
        {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showAdvanced && (
        <div style={{ padding: '16px', borderRadius: 14, background: surface2, border: `1px solid ${border}`, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: text2, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>OPTIONAL RIDERS</div>
          {[
            { key: 'accidentDeath' as const, label: 'Accidental Death Benefit', icon: Shield, color: '#3B82F6' },
            { key: 'criticalIllness' as const, label: 'Critical Illness Cover', icon: Heart, color: '#EC4899' },
            { key: 'waiver' as const, label: 'Premium Waiver', icon: AlertCircle, color: '#F59E0B' },
          ].map(r => (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <r.icon size={14} color={r.color} />
                <span style={{ fontSize: 13, color: text }}>{r.label}</span>
              </div>
              <button onClick={() => onChange({ riders: { ...input.riders, [r.key]: !input.riders[r.key] } })} style={{
                width: 42, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative',
                background: input.riders[r.key] ? `linear-gradient(90deg,${r.color},${r.color}90)` : isDark ? '#334155' : '#e2e8f0',
                transition: 'background 0.3s',
              }}>
                <span style={{ position: 'absolute', top: 2, left: input.riders[r.key] ? 20 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
