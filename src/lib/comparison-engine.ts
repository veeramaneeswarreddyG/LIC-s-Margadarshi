// ─── Comparison Calculation Engine ───────────────────────────────────────────
// Runs calculateV2 for each plan, then ranks and annotates results.
// Fully config-driven — uses LICPlanConfig + CalcInputV2.

import { calculateV2 } from '@/lib/plan-engine';
import { getPlanById, PLAN_BY_ID } from '@/data/lic-plans';
import { clampToPlanLimits } from '@/lib/plan-utils';
import type { CalcInputV2, CalcResultV2 } from '@/types/lic-plans';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ComparisonMetric =
  | 'annualPremium'
  | 'totalPremiumPaid'
  | 'maturityBenefit'
  | 'deathBenefit'
  | 'surrenderValue'
  | 'bonusEstimate'
  | 'taxSaving'
  | 'roi'
  | 'surplusGain'
  | 'breakEvenYear';

export type RankDirection = 'lower-better' | 'higher-better';

export interface MetricMeta {
  key: ComparisonMetric;
  label: string;
  description: string;
  format: 'currency' | 'percent' | 'years';
  direction: RankDirection;
  emoji: string;
}

export interface Badge {
  label: string;
  color: string;
  emoji: string;
  metric: ComparisonMetric | 'overall';
}

export interface PlanComparisonRow {
  planId: string;
  policyNumber: string;
  policyName: string;
  category: string;
  emoji: string;
  result: CalcResultV2;
  input: CalcInputV2;
  metrics: Record<ComparisonMetric, number>;
  ranks: Record<ComparisonMetric, number>;
  badges: Badge[];
  isValid: boolean;
  validationMessages: string[];
}

export interface ComparisonSummary {
  totalPlans: number;
  bestPremium: string;
  bestMaturity: string;
  bestDeathBenefit: string;
  bestROI: string;
  bestOverall: string;
  recommendedPlanId: string;
  recommendationReason: string;
}

export interface ComparisonReport {
  rows: PlanComparisonRow[];
  summary: ComparisonSummary;
  metrics: MetricMeta[];
  baseInput: Partial<CalcInputV2>;
  generatedAt: number;
}

// ── Metric definitions ────────────────────────────────────────────────────────

export const COMPARISON_METRICS: MetricMeta[] = [
  { key: 'annualPremium',    label: 'Annual Premium',     description: 'Yearly premium including GST & riders', format: 'currency', direction: 'lower-better',  emoji: '💳' },
  { key: 'totalPremiumPaid', label: 'Total Paid',          description: 'Total premiums paid over the term',    format: 'currency', direction: 'lower-better',  emoji: '📤' },
  { key: 'maturityBenefit',  label: 'Maturity Benefit',    description: 'Amount received at policy maturity',   format: 'currency', direction: 'higher-better', emoji: '🏆' },
  { key: 'deathBenefit',     label: 'Death Benefit',       description: 'Amount paid to nominee on death',      format: 'currency', direction: 'higher-better', emoji: '🛡️' },
  { key: 'bonusEstimate',    label: 'Bonus Estimate',      description: 'Accumulated bonus over the term',      format: 'currency', direction: 'higher-better', emoji: '🎁' },
  { key: 'surrenderValue',   label: 'Surrender Value',     description: 'Value if surrendered at 50% term',     format: 'currency', direction: 'higher-better', emoji: '🔄' },
  { key: 'taxSaving',        label: 'Tax Saving (80C)',    description: 'Annual tax saving at 30% bracket',     format: 'currency', direction: 'higher-better', emoji: '📉' },
  { key: 'roi',              label: 'Return (ROI %)',      description: 'Return on total investment',           format: 'percent',  direction: 'higher-better', emoji: '📈' },
  { key: 'surplusGain',      label: 'Surplus Gain',        description: 'Profit: maturity minus total paid',    format: 'currency', direction: 'higher-better', emoji: '💰' },
  { key: 'breakEvenYear',    label: 'Break-Even Year',     description: 'Year when maturity value exceeds total paid', format: 'years', direction: 'lower-better', emoji: '⚖️' },
];

// ── Main comparison function ──────────────────────────────────────────────────

export function comparePlans(
  planIds: string[],
  baseInput: Partial<CalcInputV2>
): ComparisonReport {
  if (planIds.length < 2) throw new Error('Comparison requires at least 2 plans');

  const rows: PlanComparisonRow[] = planIds.map(planId => {
    const plan = getPlanById(planId);
    if (!plan) return buildErrorRow(planId, baseInput);

    const clamped = clampToPlanLimits(planId, baseInput) as CalcInputV2;
    const input: CalcInputV2 = {
      planId,
      name:         baseInput.name ?? '',
      age:          clamped.age ?? 30,
      gender:       clamped.gender ?? 'male',
      smoking:      clamped.smoking ?? false,
      annualIncome: clamped.annualIncome ?? 600000,
      sumAssured:   clamped.sumAssured ?? plan.validation.minSumAssured,
      policyTerm:   clamped.policyTerm ?? plan.validation.minTerm,
      premiumTerm:  clamped.premiumTerm ?? plan.validation.minTerm,
      paymentMode:  clamped.paymentMode ?? plan.validation.allowedModes[0],
      selectedRiders: clamped.selectedRiders ?? [],
    };

    const result = calculateV2(input);
    const midYear = Math.floor(input.policyTerm / 2);
    const svRow = result.projections.find(p => p.year === midYear);

    const metrics: Record<ComparisonMetric, number> = {
      annualPremium:    result.annualPremium,
      totalPremiumPaid: result.totalPremiumPaid,
      maturityBenefit:  result.maturityBenefit,
      deathBenefit:     result.deathBenefit,
      bonusEstimate:    result.bonusEstimate,
      surrenderValue:   svRow?.surrenderValue ?? 0,
      taxSaving:        result.taxSaving,
      roi:              result.roi,
      surplusGain:      result.surplusGain,
      breakEvenYear:    result.breakEvenYear,
    };

    return {
      planId: plan.id, policyNumber: plan.policyNumber, policyName: plan.policyName,
      category: plan.category, emoji: plan.emoji,
      result, input, metrics,
      ranks: {} as Record<ComparisonMetric, number>,
      badges: [], isValid: result.isValid,
      validationMessages: result.validationMessages,
    };
  });

  rankMetrics(rows);
  assignBadges(rows);
  const summary = buildSummary(rows);

  const recRow = rows.find(r => r.planId === summary.recommendedPlanId);
  if (recRow) recRow.badges.push({ label: 'Recommended', color: '#F97316', emoji: '⭐', metric: 'overall' });

  return { rows, summary, metrics: COMPARISON_METRICS, baseInput, generatedAt: Date.now() };
}

// ── Ranking ───────────────────────────────────────────────────────────────────

function rankMetrics(rows: PlanComparisonRow[]) {
  for (const meta of COMPARISON_METRICS) {
    const { key, direction } = meta;
    const valid = rows.filter(r => r.isValid && r.metrics[key] > 0);
    const sorted = [...valid].sort((a, b) =>
      direction === 'lower-better' ? a.metrics[key] - b.metrics[key] : b.metrics[key] - a.metrics[key]
    );
    rows.forEach(row => {
      const rank = sorted.findIndex(r => r.planId === row.planId) + 1;
      row.ranks[key] = row.isValid && rank > 0 ? rank : valid.length + 1;
    });
  }
}

// ── Badges ────────────────────────────────────────────────────────────────────

const BADGE_DEFS: Array<{ id: string; label: string; color: string; emoji: string; metric: ComparisonMetric; minRank: number; extra?: (r: PlanComparisonRow) => boolean }> = [
  { id: 'best-value',     label: 'Best Value',      color: '#22c55e', emoji: '🏆', metric: 'surplusGain',      minRank: 1 },
  { id: 'lowest-premium', label: 'Lowest Premium',  color: '#3B82F6', emoji: '💳', metric: 'annualPremium',    minRank: 1 },
  { id: 'best-maturity',  label: 'Best Maturity',   color: '#F59E0B', emoji: '🎯', metric: 'maturityBenefit',  minRank: 1 },
  { id: 'max-cover',      label: 'Max Protection',  color: '#C8102E', emoji: '🛡️', metric: 'deathBenefit',     minRank: 1 },
  { id: 'best-roi',       label: 'Best ROI',        color: '#8B5CF6', emoji: '📈', metric: 'roi',              minRank: 1 },
  { id: 'tax-saver',      label: 'Best Tax Saving', color: '#EC4899', emoji: '📉', metric: 'taxSaving',        minRank: 1 },
  { id: 'quick-breakeven',label: 'Quick Break-Even',color: '#14b8a6', emoji: '⚡', metric: 'breakEvenYear',    minRank: 1, extra: r => r.result?.breakEvenYear < 10 },
];

function assignBadges(rows: PlanComparisonRow[]) {
  const assigned = new Set<string>();
  for (const def of BADGE_DEFS) {
    for (const row of rows) {
      if (!assigned.has(def.id) && row.ranks[def.metric] <= def.minRank && (!def.extra || def.extra(row))) {
        row.badges.push({ label: def.label, color: def.color, emoji: def.emoji, metric: def.metric });
        assigned.add(def.id);
      }
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

function buildSummary(rows: PlanComparisonRow[]): ComparisonSummary {
  const valid = rows.filter(r => r.isValid);
  const best = (metric: ComparisonMetric) => {
    const dir = COMPARISON_METRICS.find(m => m.key === metric)!.direction;
    if (!valid.length) return rows[0]?.planId ?? '';
    return [...valid].sort((a, b) =>
      dir === 'lower-better' ? a.metrics[metric] - b.metrics[metric] : b.metrics[metric] - a.metrics[metric]
    )[0].planId;
  };

  const KEY_METRICS: ComparisonMetric[] = ['annualPremium', 'maturityBenefit', 'deathBenefit', 'roi', 'surplusGain', 'taxSaving'];
  const scores = valid.map(row => ({ planId: row.planId, score: KEY_METRICS.reduce((s, m) => s + (row.ranks[m] ?? 99), 0) }));
  scores.sort((a, b) => a.score - b.score);
  const recommendedPlanId = scores[0]?.planId ?? rows[0]?.planId ?? '';
  const recRow = rows.find(r => r.planId === recommendedPlanId);

  return {
    totalPlans: rows.length,
    bestPremium:      best('annualPremium'),
    bestMaturity:     best('maturityBenefit'),
    bestDeathBenefit: best('deathBenefit'),
    bestROI:          best('roi'),
    bestOverall:      recommendedPlanId,
    recommendedPlanId,
    recommendationReason: recRow ? buildReason(recRow) : 'Best overall',
  };
}

function buildReason(row: PlanComparisonRow): string {
  const parts: string[] = [];
  if (row.ranks.annualPremium === 1)   parts.push('lowest premium');
  if (row.ranks.maturityBenefit === 1) parts.push('best maturity');
  if (row.ranks.roi === 1)             parts.push(`highest ROI (${row.metrics.roi.toFixed(1)}%)`);
  if (row.ranks.deathBenefit === 1)    parts.push('maximum life cover');
  if (row.ranks.surplusGain === 1)     parts.push('best surplus gain');
  if (!parts.length) parts.push('strong balance across all metrics');
  return `${row.policyName} wins on: ${parts.join(', ')}.`;
}

// ── Delta helpers ─────────────────────────────────────────────────────────────

export function metricDeltaVsBest(row: PlanComparisonRow, metric: ComparisonMetric, all: PlanComparisonRow[]): number {
  const meta = COMPARISON_METRICS.find(m => m.key === metric)!;
  const bestRow = [...all].sort((a, b) =>
    meta.direction === 'lower-better' ? a.metrics[metric] - b.metrics[metric] : b.metrics[metric] - a.metrics[metric]
  )[0];
  const bestVal = bestRow?.metrics[metric] ?? 0;
  if (!bestVal) return 0;
  return ((row.metrics[metric] - bestVal) / bestVal) * 100;
}

export function metricLabel(row: PlanComparisonRow, metric: ComparisonMetric, all: PlanComparisonRow[]): { text: string; better: boolean } {
  const meta = COMPARISON_METRICS.find(m => m.key === metric)!;
  if (row.ranks[metric] === 1) return { text: meta.direction === 'lower-better' ? 'Lowest' : 'Highest', better: true };
  const delta = metricDeltaVsBest(row, metric, all);
  const worse = meta.direction === 'lower-better' ? delta > 0 : delta < 0;
  const bestVal = all.find(r => r.ranks[metric] === 1)?.metrics[metric] ?? 0;
  const diff = Math.abs(row.metrics[metric] - bestVal);
  let text = meta.format === 'currency' ? `${worse ? '+' : '-'}${fmtINR(diff)}` : meta.format === 'percent' ? `${delta.toFixed(1)}%` : `${worse ? '+' : '-'}${Math.abs(Math.round(delta))}yr`;
  return { text, better: !worse };
}

// ── Error row ─────────────────────────────────────────────────────────────────

function buildErrorRow(planId: string, baseInput: Partial<CalcInputV2>): PlanComparisonRow {
  const plan = PLAN_BY_ID.get(planId);
  const zero = Object.fromEntries(COMPARISON_METRICS.map(m => [m.key, 0])) as Record<ComparisonMetric, number>;
  return {
    planId, policyNumber: '—', policyName: plan?.policyName ?? planId,
    category: plan?.category ?? 'term', emoji: plan?.emoji ?? '❓',
    result: null as any, input: { planId, ...baseInput } as CalcInputV2,
    metrics: zero, ranks: { ...zero }, badges: [], isValid: false,
    validationMessages: [`Plan "${planId}" not found`],
  };
}

// ── Format helpers ────────────────────────────────────────────────────────────

export function fmtINR(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString('en-IN')}`;
}

export function fmtMetric(value: number, format: MetricMeta['format']): string {
  if (format === 'currency') return fmtINR(value);
  if (format === 'percent')  return `${value.toFixed(1)}%`;
  return `Yr ${value}`;
}
