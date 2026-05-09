// ─── Export Data Builder ──────────────────────────────────────────────────────
// UI-independent utilities that transform CalcResultV2 / ComparisonReport
// into structured, format-agnostic payloads ready for PDF, image, or share.

import type { CalcInputV2, CalcResultV2, YearlyProjection } from '@/types/lic-plans';
import type { ComparisonReport, PlanComparisonRow } from '@/lib/comparison-engine';
import { fmtMetric, COMPARISON_METRICS } from '@/lib/comparison-engine';
import { getPlanById } from '@/data/lic-plans';

// ── Format helpers ────────────────────────────────────────────────────────────

function fmtINR(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

function fmtDate(ts: number = Date.now()): string {
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtMode(mode: string): string {
  const map: Record<string, string> = { annual: 'Yearly', 'half-yearly': 'Half-Yearly', quarterly: 'Quarterly', monthly: 'Monthly' };
  return map[mode] ?? mode;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExportBenefitRow {
  label: string;
  value: string;
  highlight: boolean;
  color?: string;
}

export interface ExportPremiumBreakdown {
  base: string;
  gst: string;
  riders: string;
  total: string;
  monthly: string;
  daily: string;
}

export interface ExportProjectionRow {
  year: number;
  premiumPaid: string;
  bonusAccrued: string;
  surrenderValue: string;
  deathBenefit: string;
}

export interface ExportAIInsight {
  summary: string;
  humanSummary: string;
  keyPoints: string[];
  warnings: string[];
}

export interface ExportPolicyInfo {
  policyName: string;
  policyNumber: string;
  category: string;
  emoji: string;
  tagline: string;
  taxBenefit: string;
  loanFacility: boolean;
}

export interface ExportPlanCard {
  generatedAt: string;
  generatedBy: string;
  // Input summary
  holderName: string;
  age: number;
  gender: string;
  smoking: boolean;
  annualIncome: string;
  policyTerm: number;
  premiumTerm: number;
  paymentMode: string;
  sumAssured: string;
  selectedRiders: string[];
  // Policy identity
  policy: ExportPolicyInfo;
  // Premium
  premium: ExportPremiumBreakdown;
  // Benefits
  benefits: ExportBenefitRow[];
  // Projections (filtered — every 5 years + last)
  projections: ExportProjectionRow[];
  // AI
  insight: ExportAIInsight;
  // Raw numbers for chart generation
  raw: {
    annualPremium: number;
    totalPremiumPaid: number;
    maturityBenefit: number;
    deathBenefit: number;
    bonusEstimate: number;
    taxSaving: number;
    roi: number;
    surplusGain: number;
    breakEvenYear: number;
    projections: YearlyProjection[];
  };
}

export interface ExportComparisonCard {
  generatedAt: string;
  baseInput: Partial<CalcInputV2>;
  plans: ExportComparisonPlanRow[];
  recommendedPlanId: string;
  recommendationReason: string;
  metricTable: ExportMetricTableRow[];
}

export interface ExportComparisonPlanRow {
  planId: string;
  policyName: string;
  policyNumber: string;
  emoji: string;
  category: string;
  badges: string[];
  annualPremium: string;
  maturityBenefit: string;
  deathBenefit: string;
  roi: string;
  taxSaving: string;
  surplusGain: string;
  isRecommended: boolean;
  isValid: boolean;
}

export interface ExportMetricTableRow {
  emoji: string;
  label: string;
  format: 'currency' | 'percent' | 'years';
  values: Array<{ planId: string; formatted: string; rank: number; isBest: boolean }>;
}

export interface ExportShareCard {
  title: string;
  subtitle: string;
  policyName: string;
  policyNumber: string;
  monthlyPremium: string;
  maturityBenefit: string;
  deathBenefit: string;
  roi: string;
  tagline: string;
  hashtags: string[];
  shareText: string;
}

// ── 1. buildPlanExport ────────────────────────────────────────────────────────

/**
 * Builds a full structured export payload from a CalcResultV2.
 * Use this for PDF, image report, or share card generation.
 */
export function buildPlanExport(
  input: CalcInputV2,
  result: CalcResultV2
): ExportPlanCard {
  const plan = getPlanById(input.planId);

  // Key benefits table
  const benefits: ExportBenefitRow[] = [
    { label: 'Maturity Benefit',   value: fmtINR(result.maturityBenefit),  highlight: result.maturityBenefit > 0, color: '#22c55e' },
    { label: 'Death Benefit',      value: fmtINR(result.deathBenefit),     highlight: true, color: '#3B82F6' },
    { label: 'Bonus Estimate',     value: fmtINR(result.bonusEstimate),    highlight: result.bonusEstimate > 0, color: '#F59E0B' },
    { label: 'Annual Tax Saving',  value: fmtINR(result.taxSaving),        highlight: result.taxSaving > 0, color: '#8B5CF6' },
    { label: 'Surplus Gain',       value: fmtINR(result.surplusGain),      highlight: result.surplusGain > 0, color: '#14b8a6' },
    { label: 'Return on Investment', value: `${result.roi.toFixed(1)}%`,   highlight: result.roi > 5, color: '#EC4899' },
    { label: 'Total Premium Paid', value: fmtINR(result.totalPremiumPaid), highlight: false },
    { label: 'Break-Even Year',    value: `Year ${result.breakEvenYear}`,  highlight: false },
  ];

  // Projections — every 5 years + last year
  const milestoneYears = new Set([
    ...result.projections.filter(p => p.year % 5 === 0).map(p => p.year),
    result.projections[result.projections.length - 1]?.year,
  ].filter(Boolean));
  const projections: ExportProjectionRow[] = result.projections
    .filter(p => milestoneYears.has(p.year))
    .map(p => ({
      year: p.year,
      premiumPaid:    fmtINR(p.premiumPaid),
      bonusAccrued:   fmtINR(p.bonusAccrued),
      surrenderValue: fmtINR(p.surrenderValue),
      deathBenefit:   fmtINR(p.deathBenefit),
    }));

  // Key points derived from result
  const keyPoints: string[] = [];
  if (result.maturityBenefit > 0) keyPoints.push(`Get back ${fmtINR(result.maturityBenefit)} at maturity after ${input.policyTerm} years`);
  if (result.bonusEstimate > 0)   keyPoints.push(`Earn ~${fmtINR(result.bonusEstimate)} in reversionary bonuses`);
  if (result.taxSaving > 0)       keyPoints.push(`Save up to ${fmtINR(result.taxSaving)}/year in income tax (Sec 80C)`);
  if (result.roi > 0)             keyPoints.push(`Expected return: ~${result.roi.toFixed(1)}% p.a. on total investment`);
  keyPoints.push(`Your family is covered for ${fmtINR(result.deathBenefit)} from day one`);

  return {
    generatedAt: fmtDate(),
    generatedBy: 'LIC Margadarshi',
    holderName:    input.name || 'Policyholder',
    age:           input.age,
    gender:        input.gender === 'male' ? 'Male' : 'Female',
    smoking:       input.smoking,
    annualIncome:  fmtINR(input.annualIncome),
    policyTerm:    input.policyTerm,
    premiumTerm:   input.premiumTerm,
    paymentMode:   fmtMode(input.paymentMode),
    sumAssured:    fmtINR(input.sumAssured),
    selectedRiders: input.selectedRiders,

    policy: {
      policyName:   result.policyName,
      policyNumber: result.policyNumber,
      category:     result.planCategory,
      emoji:        plan?.emoji ?? '📋',
      tagline:      plan?.tagline ?? '',
      taxBenefit:   plan?.taxBenefitSections ?? '80C & 10(10D)',
      loanFacility: plan?.loanFacility ?? false,
    },

    premium: {
      base:    fmtINR(result.basePremium),
      gst:     fmtINR(result.gst),
      riders:  fmtINR(result.riderPremium),
      total:   fmtINR(result.annualPremium),
      monthly: fmtINR(result.premiumByMode.monthly),
      daily:   fmtINR(result.premiumByMode.daily),
    },

    benefits,
    projections,

    insight: {
      summary:      result.aiInsight,
      humanSummary: result.humanSummary,
      keyPoints,
      warnings: result.validationMessages.filter(m => !m.startsWith('✅') && !m.startsWith('ℹ️')),
    },

    raw: {
      annualPremium:    result.annualPremium,
      totalPremiumPaid: result.totalPremiumPaid,
      maturityBenefit:  result.maturityBenefit,
      deathBenefit:     result.deathBenefit,
      bonusEstimate:    result.bonusEstimate,
      taxSaving:        result.taxSaving,
      roi:              result.roi,
      surplusGain:      result.surplusGain,
      breakEvenYear:    result.breakEvenYear,
      projections:      result.projections,
    },
  };
}

// ── 2. buildComparisonExport ──────────────────────────────────────────────────

/**
 * Builds a structured comparison export from a ComparisonReport.
 */
export function buildComparisonExport(report: ComparisonReport): ExportComparisonCard {
  const plans: ExportComparisonPlanRow[] = report.rows.map(row => ({
    planId:          row.planId,
    policyName:      row.policyName,
    policyNumber:    row.policyNumber,
    emoji:           row.emoji,
    category:        row.category,
    badges:          row.badges.map(b => `${b.emoji} ${b.label}`),
    annualPremium:   fmtINR(row.metrics.annualPremium),
    maturityBenefit: fmtINR(row.metrics.maturityBenefit),
    deathBenefit:    fmtINR(row.metrics.deathBenefit),
    roi:             `${row.metrics.roi.toFixed(1)}%`,
    taxSaving:       fmtINR(row.metrics.taxSaving),
    surplusGain:     fmtINR(row.metrics.surplusGain),
    isRecommended:   row.planId === report.summary.recommendedPlanId,
    isValid:         row.isValid,
  }));

  const metricTable: ExportMetricTableRow[] = COMPARISON_METRICS.map(meta => ({
    emoji:  meta.emoji,
    label:  meta.label,
    format: meta.format,
    values: report.rows.map(row => ({
      planId:    row.planId,
      formatted: row.isValid ? fmtMetric(row.metrics[meta.key], meta.format) : '—',
      rank:      row.ranks[meta.key],
      isBest:    row.ranks[meta.key] === 1 && row.isValid,
    })),
  }));

  return {
    generatedAt:           fmtDate(report.generatedAt),
    baseInput:             report.baseInput,
    plans,
    recommendedPlanId:     report.summary.recommendedPlanId,
    recommendationReason:  report.summary.recommendationReason,
    metricTable,
  };
}

// ── 3. buildShareCard ─────────────────────────────────────────────────────────

/**
 * Builds a minimal, social-media-ready share payload.
 */
export function buildShareCard(
  input: CalcInputV2,
  result: CalcResultV2
): ExportShareCard {
  const plan = getPlanById(input.planId);
  const monthly = fmtINR(result.premiumByMode.monthly);
  const maturity = fmtINR(result.maturityBenefit);
  const death = fmtINR(result.deathBenefit);

  const shareText =
    result.planCategory === 'term'
      ? `I just calculated my LIC ${result.policyName} (Plan No. ${result.policyNumber}) premium!\n\n` +
        `💳 Just ${monthly}/month → 🛡️ ${death} life cover for my family.\n\n` +
        `Calculated using LIC Margadarshi 🇮🇳`
      : `I just calculated my LIC ${result.policyName} (Plan No. ${result.policyNumber}) premium!\n\n` +
        `💳 Pay ${monthly}/month → 🏆 Get back ${maturity} at maturity!\n` +
        `📈 ROI: ~${result.roi.toFixed(1)}% p.a. | Tax saving: ${fmtINR(result.taxSaving)}/yr\n\n` +
        `Calculated using LIC Margadarshi 🇮🇳`;

  return {
    title:           `LIC ${result.policyName} — Premium Quote`,
    subtitle:        `Plan No. ${result.policyNumber} · Age ${input.age} · ${fmtINR(input.sumAssured)} SA`,
    policyName:      result.policyName,
    policyNumber:    result.policyNumber,
    monthlyPremium:  monthly,
    maturityBenefit: maturity,
    deathBenefit:    death,
    roi:             `${result.roi.toFixed(1)}%`,
    tagline:         plan?.tagline ?? '',
    hashtags:        ['#LIC', '#LICIndia', '#LifeInsurance', '#LICMargadarshi', '#FinancialPlanning'],
    shareText,
  };
}

// ── 4. exportToCSV ────────────────────────────────────────────────────────────

/**
 * Converts a plan export's projection table to a CSV string.
 */
export function exportProjectionsToCSV(card: ExportPlanCard): string {
  const headers = ['Year', 'Premium Paid', 'Bonus Accrued', 'Surrender Value', 'Death Benefit'];
  const rows = card.projections.map(p => [
    p.year, p.premiumPaid, p.bonusAccrued, p.surrenderValue, p.deathBenefit,
  ]);
  const lines = [headers, ...rows].map(r => r.join(','));
  return lines.join('\n');
}

/**
 * Converts a comparison export's metric table to a CSV string.
 */
export function exportComparisonToCSV(card: ExportComparisonCard): string {
  const planHeaders = card.plans.map(p => `${p.policyName} (${p.policyNumber})`);
  const header = ['Metric', ...planHeaders].join(',');
  const rows = card.metricTable.map(m => [
    m.label,
    ...m.values.map(v => v.formatted),
  ].join(','));
  return [header, ...rows].join('\n');
}

// ── 5. Metadata builders ──────────────────────────────────────────────────────

/**
 * Builds a short metadata object for history persistence.
 */
export function buildHistoryMeta(input: CalcInputV2, result: CalcResultV2): Record<string, string | number> {
  return {
    planId:          input.planId,
    policyName:      result.policyName,
    policyNumber:    result.policyNumber,
    category:        result.planCategory,
    age:             input.age,
    sumAssured:      input.sumAssured,
    policyTerm:      input.policyTerm,
    annualPremium:   result.annualPremium,
    maturityBenefit: result.maturityBenefit,
    deathBenefit:    result.deathBenefit,
    roi:             result.roi,
    calculatedAt:    Date.now(),
  };
}
