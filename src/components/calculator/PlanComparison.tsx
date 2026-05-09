'use client';
import React, { useState, useMemo } from 'react';
import { Trophy, Sparkles, Crown, ChevronDown, ChevronUp } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { comparePlans, fmtMetric, COMPARISON_METRICS } from '@/lib/comparison-engine';
import type { ComparisonReport, PlanComparisonRow } from '@/lib/comparison-engine';
import type { CalcInputV2 } from '@/types/lic-plans';
import { CATEGORY_META } from '@/data/lic-plans';

interface Props {
  planIds: string[];
  baseInput: Partial<CalcInputV2>;
}

export default function PlanComparison({ planIds, baseInput }: Props) {
  const { surface, surface2, border, text, text2, hint, isDark } = useThemeColors();
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const report: ComparisonReport | null = useMemo(() => {
    if (planIds.length < 2) return null;
    try { return comparePlans(planIds, baseInput); } catch { return null; }
  }, [planIds, baseInput]);

  if (!report) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: hint, fontSize: 13 }}>
        Select at least 2 plans to compare.
      </div>
    );
  }

  const { rows, summary } = report;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        @keyframes cmpIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .cmp-row{animation:cmpIn 0.3s ease backwards}
        .cmp-row:nth-child(2){animation-delay:.05s}.cmp-row:nth-child(3){animation-delay:.1s}
        .cmp-row:nth-child(4){animation-delay:.15s}.cmp-row:nth-child(5){animation-delay:.2s}
        .cmp-scroll::-webkit-scrollbar{display:none}
      `}</style>

      {/* ── Recommended Banner ── */}
      {(() => {
        const rec = rows.find(r => r.planId === summary.recommendedPlanId);
        if (!rec) return null;
        const meta = CATEGORY_META[rec.category as keyof typeof CATEGORY_META];
        return (
          <div className="cmp-row" style={{ borderRadius: 18, overflow: 'hidden', background: 'linear-gradient(135deg,#C8102E,#8B0D20)', padding: '18px 20px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,179,0,0.2),transparent)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,179,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Trophy size={22} color="#FFB300" />
              </div>
              <div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>Recommended Plan</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#fff' }}>{rec.emoji} {rec.policyName}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{summary.recommendationReason}</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Plan Cards (horizontal scroll) ── */}
      <div className="cmp-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
        {rows.map((row, idx) => {
          const meta = CATEGORY_META[row.category as keyof typeof CATEGORY_META];
          const isRec = row.planId === summary.recommendedPlanId;
          return (
            <div key={row.planId} className="cmp-row" style={{
              minWidth: 190, flex: '0 0 auto', borderRadius: 18, padding: '16px 14px',
              background: surface, border: `1.5px solid ${isRec ? '#FFB300' : border}`,
              boxShadow: isRec ? '0 4px 20px rgba(255,179,0,0.15)' : 'none', position: 'relative',
            }}>
              {isRec && <Crown size={13} color="#FFB300" style={{ position: 'absolute', top: 10, right: 12 }} />}
              {/* Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {row.badges.slice(0, 2).map((b, i) => (
                  <span key={i} style={{ padding: '2px 7px', borderRadius: 10, background: `${b.color}18`, color: b.color, fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap' }}>
                    {b.emoji} {b.label}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 18, marginBottom: 2 }}>{row.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: text, lineHeight: 1.2, marginBottom: 2 }}>{row.policyName}</div>
              <div style={{ fontSize: 10, color: meta?.color ?? hint, fontWeight: 600, marginBottom: 10 }}>No. {row.policyNumber}</div>
              {/* Key stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Premium/yr', value: fmtMetric(row.metrics.annualPremium, 'currency'), color: '#C8102E' },
                  { label: 'Maturity', value: fmtMetric(row.metrics.maturityBenefit, 'currency'), color: '#22c55e' },
                  { label: 'Death Cover', value: fmtMetric(row.metrics.deathBenefit, 'currency'), color: '#3B82F6' },
                  { label: 'ROI', value: fmtMetric(row.metrics.roi, 'percent'), color: '#8B5CF6' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '6px 8px', borderRadius: 10, background: surface2 }}>
                    <div style={{ fontSize: 8, color: hint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 900, color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {!row.isValid && (
                <div style={{ marginTop: 8, fontSize: 10, color: '#EF4444', fontWeight: 600 }}>⚠️ {row.validationMessages[0]?.slice(0, 50)}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Metric-by-metric detail ── */}
      <div style={{ borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden', background: surface }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={14} color="#8B5CF6" />
          <span style={{ fontSize: 13, fontWeight: 800, color: text }}>Detailed Comparison</span>
          <span style={{ fontSize: 11, color: hint, marginLeft: 'auto' }}>Tap any row to expand</span>
        </div>

        {/* Header row */}
        <div style={{ display: 'flex', padding: '8px 16px', background: surface2, borderBottom: `1px solid ${border}` }}>
          <div style={{ flex: 2, fontSize: 10, color: hint, fontWeight: 700, textTransform: 'uppercase' }}>Metric</div>
          {rows.map(r => (
            <div key={r.planId} style={{ flex: 1, fontSize: 10, color: hint, fontWeight: 700, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.emoji} {r.policyName.split(' ')[0]}
            </div>
          ))}
        </div>

        {/* Metric rows */}
        {COMPARISON_METRICS.map(meta => {
          const isOpen = expandedMetric === meta.key;
          const bestPlanId = rows.reduce((best, r) =>
            meta.direction === 'lower-better'
              ? (r.metrics[meta.key] < best.metrics[meta.key] ? r : best)
              : (r.metrics[meta.key] > best.metrics[meta.key] ? r : best)
          ).planId;

          return (
            <div key={meta.key} style={{ borderBottom: `1px solid ${border}` }}>
              <button onClick={() => setExpandedMetric(isOpen ? null : meta.key)} style={{
                width: '100%', display: 'flex', alignItems: 'center', padding: '11px 16px',
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{meta.emoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: text }}>{meta.label}</span>
                </div>
                {rows.map(r => {
                  const val = r.metrics[meta.key];
                  const isBest = r.planId === bestPlanId && r.isValid;
                  return (
                    <div key={r.planId} style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800,
                        color: isBest ? '#22c55e' : r.isValid ? text : hint,
                        background: isBest ? 'rgba(34,197,94,0.1)' : 'none',
                        padding: isBest ? '2px 6px' : '0', borderRadius: 6,
                      }}>
                        {r.isValid ? fmtMetric(val, meta.format) : '—'}
                      </span>
                    </div>
                  );
                })}
                <div style={{ marginLeft: 8, flexShrink: 0 }}>
                  {isOpen ? <ChevronUp size={14} color={hint} /> : <ChevronDown size={14} color={hint} />}
                </div>
              </button>
              {/* Expanded detail */}
              {isOpen && (
                <div style={{ padding: '8px 16px 14px', background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: 11, color: hint, marginBottom: 8 }}>{meta.description}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {rows.map(r => {
                      const val = r.metrics[meta.key];
                      const isBest = r.planId === bestPlanId && r.isValid;
                      const planMeta = CATEGORY_META[r.category as keyof typeof CATEGORY_META];
                      return (
                        <div key={r.planId} style={{ flex: 1, padding: '10px', borderRadius: 12, background: surface2, border: `1.5px solid ${isBest ? '#22c55e40' : border}`, textAlign: 'center' }}>
                          <div style={{ fontSize: 10, color: planMeta?.color ?? hint, fontWeight: 700, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.policyName}</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: isBest ? '#22c55e' : text }}>{r.isValid ? fmtMetric(val, meta.format) : '—'}</div>
                          {isBest && <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 800, marginTop: 2 }}>✓ BEST</div>}
                          {!isBest && r.isValid && (
                            <div style={{ fontSize: 9, color: hint, marginTop: 2 }}>Rank #{r.ranks[meta.key]}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
