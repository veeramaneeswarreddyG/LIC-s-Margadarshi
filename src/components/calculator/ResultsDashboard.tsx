'use client';
import React, { useState, useEffect } from 'react';
import { TrendingUp, Shield, Gift, Percent, CreditCard, Sparkles, ChevronDown, ChevronUp, Calendar, ArrowUpRight, Heart, Clock, IndianRupee, BarChart3 } from 'lucide-react';
import type { CalcResult, CalcInput } from '@/lib/premium-engine';
import { formatINR } from '@/lib/premium-engine';

interface Props {
  result: CalcResult;
  input: CalcInput;
  isDark: boolean;
  surface: string; surface2: string; border: string; text: string; text2: string; hint: string;
}

/* Animated counter hook */
function useAnimNum(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

export default function ResultsDashboard({ result, input, isDark, surface, surface2, border, text, text2, hint }: Props) {
  const [showProjections, setShowProjections] = useState(false);
  const premAnim = useAnimNum(result.premiumByMode[input.paymentMode as keyof typeof result.premiumByMode] || result.annualPremium);
  const matAnim = useAnimNum(result.maturityBenefit);
  const deathAnim = useAnimNum(result.deathBenefit);

  const modeLabel = { annual: '/yr', 'half-yearly': '/6mo', quarterly: '/qtr', monthly: '/mo' }[input.paymentMode] || '/yr';
  const validMsgs = result.validationMessages.filter(m => !m.startsWith('ℹ️'));

  if (!result.isValid && validMsgs.length > 0) {
    return (
      <div style={{ padding: 24, borderRadius: 20, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#EF4444', marginBottom: 12 }}>⚠️ Invalid Configuration</div>
        {validMsgs.map((m, i) => (
          <div key={i} style={{ fontSize: 13, color: text2, marginBottom: 8, paddingLeft: 12, borderLeft: '3px solid #EF4444' }}>{m}</div>
        ))}
      </div>
    );
  }

  const metrics = [
    { label: 'Death Benefit', value: formatINR(deathAnim), icon: Shield, color: '#3B82F6', bg: 'rgba(59,130,246,0.1)', show: true },
    { label: 'Est. Bonus', value: formatINR(result.bonusEstimate), icon: Gift, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', show: result.bonusEstimate > 0 },
    { label: 'Tax Saving/yr', value: formatINR(result.taxSaving), icon: Percent, color: '#8B5CF6', bg: 'rgba(139,92,246,0.1)', show: result.taxSaving > 0 },
    { label: 'Total Paid', value: formatINR(result.totalPremiumPaid), icon: CreditCard, color: isDark ? '#94A3B8' : '#64748B', bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', show: true },
    { label: 'Surplus Gain', value: formatINR(result.surplusGain), icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.1)', show: result.surplusGain > 0 },
    { label: 'Daily Cost', value: `₹${result.premiumByMode.daily}`, icon: IndianRupee, color: '#EC4899', bg: 'rgba(236,72,153,0.1)', show: result.premiumByMode.daily > 0 },
  ].filter(m => m.show);

  // Projection milestones
  const milestones = result.projections.filter(p =>
    p.year === 3 || p.year === 5 || p.year === 10 || p.year === Math.round(input.policyTerm / 2) || p.year === input.policyTerm
  ).filter((v, i, a) => a.findIndex(x => x.year === v.year) === i);

  // Premium breakdown
  const breakdown = [
    { label: 'Base Premium', value: result.basePremium, color: '#C8102E' },
    { label: 'GST', value: result.gst, color: '#F59E0B' },
    { label: 'Rider Premium', value: result.riderPremium, color: '#3B82F6' },
  ].filter(b => b.value > 0);
  const breakdownTotal = breakdown.reduce((s, b) => s + b.value, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes metricPop{from{opacity:0;transform:scale(0.9) translateY(10px)}to{opacity:1;transform:none}}
        .metric-pop{animation:metricPop 0.4s ease backwards}
        .metric-pop:nth-child(2){animation-delay:0.06s}.metric-pop:nth-child(3){animation-delay:0.12s}
        .metric-pop:nth-child(4){animation-delay:0.18s}.metric-pop:nth-child(5){animation-delay:0.24s}
        .metric-pop:nth-child(6){animation-delay:0.30s}
        @keyframes countUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .count-up{animation:countUp 0.5s ease}
      `}</style>

      {/* ── Hero Premium Card ── */}
      <div style={{
        borderRadius: 22, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #C8102E 0%, #8B0D20 50%, #5A0815 100%)',
      }}>
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,179,0,0.2),transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,255,255,0.06),transparent)', pointerEvents: 'none' }} />

        <div style={{ padding: '28px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Your Premium · {result.planName}</span>
          </div>
          <div className="count-up" style={{ fontSize: 42, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1.1 }}>
            {formatINR(premAnim)}
          </div>
          <span style={{ fontSize: 14, color: '#FFB300', fontWeight: 700 }}>{modeLabel}</span>

          {/* Mode breakdown pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Yearly', val: result.premiumByMode.annual },
              { label: 'Monthly', val: result.premiumByMode.monthly },
              { label: 'Daily', val: result.premiumByMode.daily },
            ].map(m => (
              <div key={m.label} style={{ padding: '6px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{m.label} </span>
                <span style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>₹{m.val.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Maturity + Death row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ padding: '16px 24px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Maturity Benefit</div>
            <div className="count-up" style={{ fontSize: 22, fontWeight: 900, color: '#22c55e' }}>{formatINR(matAnim)}</div>
          </div>
          <div style={{ padding: '16px 24px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Death Benefit</div>
            <div className="count-up" style={{ fontSize: 22, fontWeight: 900, color: '#60a5fa' }}>{formatINR(deathAnim)}</div>
          </div>
        </div>
      </div>

      {/* ── ROI Badge ── */}
      {result.roi > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px', borderRadius: 14, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
          <ArrowUpRight size={16} color="#10B981" />
          <span style={{ fontSize: 14, fontWeight: 800, color: '#10B981' }}>Effective Return: ~{result.roi}%</span>
          <span style={{ fontSize: 12, color: text2 }}>over {input.policyTerm} years</span>
        </div>
      )}

      {/* ── Metric Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
        {metrics.map((m, i) => (
          <div key={m.label} className="metric-pop" style={{
            padding: '16px', borderRadius: 16, background: surface, border: `1px solid ${border}`,
            transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <m.icon size={16} color={m.color} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: hint, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{m.label}</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: text }}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* ── Premium Breakdown ── */}
      {breakdown.length > 1 && (
        <div style={{ padding: '20px', borderRadius: 18, background: surface, border: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart3 size={16} color="#C8102E" />
            <span style={{ fontSize: 14, fontWeight: 800, color: text }}>Premium Breakdown</span>
          </div>
          {/* Bar */}
          <div style={{ height: 10, borderRadius: 5, display: 'flex', overflow: 'hidden', marginBottom: 14 }}>
            {breakdown.map(b => (
              <div key={b.label} style={{ flex: b.value / breakdownTotal, background: b.color, transition: 'flex 0.5s ease' }} />
            ))}
          </div>
          {breakdown.map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: b.color }} />
                <span style={{ fontSize: 13, color: text2 }}>{b.label}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: text }}>₹{b.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Growth Timeline ── */}
      {milestones.length > 0 && (
        <div style={{ padding: '20px', borderRadius: 18, background: surface, border: `1px solid ${border}` }}>
          <button onClick={() => setShowProjections(!showProjections)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: text,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="#F59E0B" />
              <span style={{ fontSize: 14, fontWeight: 800 }}>Growth Timeline</span>
            </div>
            {showProjections ? <ChevronUp size={18} color={hint} /> : <ChevronDown size={18} color={hint} />}
          </button>

          {showProjections && (
            <div style={{ marginTop: 16 }}>
              {milestones.map((p, i) => (
                <div key={p.year} style={{
                  display: 'flex', gap: 14, paddingBottom: i < milestones.length - 1 ? 16 : 0,
                  marginBottom: i < milestones.length - 1 ? 16 : 0,
                  borderBottom: i < milestones.length - 1 ? `1px solid ${border}` : 'none',
                }}>
                  {/* Timeline dot */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: '#fff',
                      background: p.year === input.policyTerm ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'linear-gradient(135deg,#C8102E,#a00d24)',
                    }}>
                      Y{p.year}
                    </div>
                  </div>
                  {/* Data */}
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: hint, fontWeight: 600, textTransform: 'uppercase' }}>Paid</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: text }}>{formatINR(p.premiumPaid)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: hint, fontWeight: 600, textTransform: 'uppercase' }}>Bonus</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#F59E0B' }}>{formatINR(p.bonusAccrued)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: hint, fontWeight: 600, textTransform: 'uppercase' }}>Surrender</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: p.surrenderValue > 0 ? '#8B5CF6' : hint }}>{p.surrenderValue > 0 ? formatINR(p.surrenderValue) : '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: hint, fontWeight: 600, textTransform: 'uppercase' }}>Death Cover</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#3B82F6' }}>{formatINR(p.deathBenefit)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── AI Insight ── */}
      <div style={{ padding: '18px 20px', borderRadius: 18, background: isDark ? 'rgba(139,92,246,0.06)' : 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Sparkles size={14} color="#8B5CF6" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Insight</span>
        </div>
        <p style={{ fontSize: 13, color: text2, lineHeight: 1.7 }}>{result.aiInsight}</p>
      </div>

      {/* ── Human Summary ── */}
      <div style={{ padding: '18px 20px', borderRadius: 18, background: isDark ? 'rgba(200,16,46,0.06)' : 'rgba(200,16,46,0.04)', border: '1px solid rgba(200,16,46,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Heart size={14} color="#C8102E" />
          <span style={{ fontSize: 12, fontWeight: 800, color: '#C8102E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Simple Words</span>
        </div>
        <p style={{ fontSize: 14, color: text, lineHeight: 1.7, fontWeight: 500 }}>{result.humanSummary}</p>
      </div>

      {/* ── Info messages ── */}
      {result.validationMessages.filter(m => m.startsWith('ℹ️')).map((m, i) => (
        <div key={i} style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)', fontSize: 12, color: text2 }}>
          {m}
        </div>
      ))}
    </div>
  );
}
