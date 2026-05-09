'use client';
import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/PageHeader';
import PlanComparison from '@/components/calculator/PlanComparison';
import ComparisonPlanPicker from '@/components/calculator/ComparisonPlanPicker';
import type { CalcInputV2 } from '@/types/lic-plans';

const DEFAULT_PLAN_IDS = ['jeevan-anand', 'tech-term'];

const DEFAULT_BASE: Partial<CalcInputV2> = {
  age: 30, gender: 'male', smoking: false, annualIncome: 600000,
  sumAssured: 1000000, policyTerm: 20, premiumTerm: 20, paymentMode: 'annual',
  selectedRiders: [],
};

function ComparePageInner() {
  const router = useRouter();
  const { bg, surface, surface2, border, text, text2, hint, isDark } = useThemeColors();
  const [planIds, setPlanIds] = useState<string[]>(DEFAULT_PLAN_IDS);

  return (
    <DashboardShell>
      <div suppressHydrationWarning style={{ minHeight: '100vh', background: bg, color: text, fontFamily: 'Inter,sans-serif' }}>
        <PageHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${border}`, background: surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: text }}>
              <ArrowLeft size={15} />
            </button>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, lineHeight: 1, color: text }}>Compare Plans</h1>
              <p style={{ fontSize: 11, color: hint, marginTop: 2 }}>Side-by-side policy analysis</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)', color: '#fff', fontSize: 12, fontWeight: 700 }}>
            <Sparkles size={14} /> AI Powered
          </div>
        </PageHeader>

        <div style={{ maxWidth: 760, margin: '0 auto', padding: '20px 16px 100px' }}>
          {/* Plan picker */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 20, padding: '20px', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: text2, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Select Plans to Compare</div>
            <ComparisonPlanPicker
              value={planIds} onChange={setPlanIds}
              isDark={isDark} surface={surface} surface2={surface2}
              border={border} text={text} text2={text2} hint={hint}
            />
          </div>

          {/* Comparison */}
          {planIds.length >= 2 && (
            <PlanComparison planIds={planIds} baseInput={DEFAULT_BASE} />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

export default function ComparePage() {
  return <Suspense><ComparePageInner /></Suspense>;
}
