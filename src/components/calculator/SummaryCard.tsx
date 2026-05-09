'use client';
import React from 'react';
import { TrendingUp, Shield, Gift, Percent, Heart, CreditCard, Sparkles } from 'lucide-react';
import type { CalcResult } from '@/lib/premium-engine';
import { formatINR } from '@/lib/premium-engine';

interface Props { result: CalcResult; mode: string; isDark: boolean; surface: string; border: string; text: string; text2: string; hint: string }

export default function SummaryCard({ result, mode, isDark, surface, border, text, text2, hint }: Props) {
  if (!result.isValid && result.validationMessages.length > 0) {
    return (
      <div style={{ padding: 20, borderRadius: 18, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444', marginBottom: 10 }}>⚠️ Validation Issues</div>
        {result.validationMessages.map((m, i) => (
          <div key={i} style={{ fontSize: 13, color: text2, marginBottom: 6, paddingLeft: 8, borderLeft: '2px solid #EF4444' }}>{m}</div>
        ))}
      </div>
    );
  }

  const premiumForMode = result.premiumByMode[mode as keyof typeof result.premiumByMode] || result.annualPremium;
  const modeLabel = { annual: '/yr', 'half-yearly': '/6mo', quarterly: '/qtr', monthly: '/mo', daily: '/day' }[mode] || '/yr';

  const stats = [
    { label: 'Maturity Benefit', value: formatINR(result.maturityBenefit), icon: TrendingUp, color: '#10B981', show: result.maturityBenefit > 0 },
    { label: 'Death Benefit', value: formatINR(result.deathBenefit), icon: Shield, color: '#3B82F6', show: true },
    { label: 'Est. Bonus', value: formatINR(result.bonusEstimate), icon: Gift, color: '#F59E0B', show: result.bonusEstimate > 0 },
    { label: 'Tax Saving', value: formatINR(result.taxSaving), icon: Percent, color: '#8B5CF6', show: result.taxSaving > 0 },
    { label: 'Total Paid', value: formatINR(result.totalPremiumPaid), icon: CreditCard, color: text2, show: true },
    { label: 'Surplus Gain', value: formatINR(result.surplusGain), icon: Sparkles, color: '#EC4899', show: result.surplusGain > 0 },
  ].filter(s => s.show);

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', border: `1px solid ${border}`, background: surface, transition: 'all 0.3s' }}>
      {/* Premium hero */}
      <div style={{
        background: 'linear-gradient(135deg,#C8102E 0%,#a00d24 60%,#7a0a1b 100%)',
        padding: '24px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,179,0,0.15),transparent)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>
          Your Premium
        </div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>
          {formatINR(premiumForMode)}
        </div>
        <div style={{ fontSize: 12, color: '#FFB300', fontWeight: 700, marginTop: 4 }}>
          {modeLabel} • {result.planName}
        </div>
        {result.premiumByMode.daily > 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>
            Just ₹{result.premiumByMode.daily}/day ☕
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div style={{ padding: '16px 16px 8px', display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {stats.map(s => (
          <div key={s.label} style={{ padding: '12px', borderRadius: 14, background: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FA', border: `1px solid ${border}`, transition: 'background 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <s.icon size={13} color={s.color} />
              <span style={{ fontSize: 10, fontWeight: 600, color: hint, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: text }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ROI badge */}
      {result.roi > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', borderRadius: 12, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <TrendingUp size={14} color="#10B981" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Effective Return: ~{result.roi}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
