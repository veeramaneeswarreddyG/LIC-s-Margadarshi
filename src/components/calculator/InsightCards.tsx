'use client';
import React from 'react';
import { Sparkles, Star, MessageCircle } from 'lucide-react';
import type { PlanRecommendation, CalcResult } from '@/lib/premium-engine';

interface RecProps { recommendations: PlanRecommendation[]; onSelect: (planType: string) => void; isDark: boolean; surface: string; border: string; text: string; text2: string }

export function RecommendationCard({ recommendations, onSelect, isDark, surface, border, text, text2 }: RecProps) {
  if (!recommendations.length) return null;
  return (
    <div style={{ borderRadius: 18, padding: '20px', background: surface, border: `1px solid ${border}`, transition: 'all 0.3s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#FFB300,#F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: text }}>AI Recommends</div>
          <div style={{ fontSize: 11, color: text2 }}>Based on your profile & goals</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {recommendations.map((r, i) => (
          <button key={i} onClick={() => onSelect(r.planType)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14,
              border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
              cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.2s',
            }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{r.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{r.planName}</div>
              <div style={{ fontSize: 11, color: text2, marginTop: 2 }}>{r.reason}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
              <Star size={11} color="#FFB300" fill="#FFB300" />
              <span style={{ fontSize: 12, fontWeight: 800, color: '#FFB300' }}>{r.score}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface HumanProps { result: CalcResult; isDark: boolean; surface: string; border: string; text: string; text2: string }

export function HumanExplanation({ result, isDark, surface, border, text, text2 }: HumanProps) {
  return (
    <div style={{ borderRadius: 18, padding: '20px', background: surface, border: `1px solid ${border}`, transition: 'all 0.3s' }}>
      {/* Human summary */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageCircle size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: text, marginBottom: 6 }}>In Simple Words</div>
          <p style={{ fontSize: 13, color: text2, lineHeight: 1.7 }}>{result.humanSummary}</p>
        </div>
      </div>
      {/* AI Insight */}
      <div style={{ padding: '14px 16px', borderRadius: 14, background: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Sparkles size={12} color="#8B5CF6" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Insight</span>
        </div>
        <p style={{ fontSize: 12, color: text2, lineHeight: 1.65 }}>{result.aiInsight}</p>
      </div>
    </div>
  );
}
