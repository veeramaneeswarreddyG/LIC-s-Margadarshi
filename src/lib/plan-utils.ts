// ─── LIC Plan Lookup & Validation Utilities ──────────────────────────────────
// Reusable, strongly-typed utility layer used across calculator, comparison,
// history, AI, and report systems.

import { LIC_PLANS, PLAN_BY_ID, PLAN_BY_POLICY_NO } from '@/data/lic-plans';
import type { LICPlanConfig, PlanCategory, PremiumMode, Rider, CalcInputV2 } from '@/types/lic-plans';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  errors: string[];
  warnings: string[];
}

export interface SearchOptions {
  /** Maximum results to return (default: all) */
  limit?: number;
  /** Filter by category */
  category?: PlanCategory | 'all';
  /** Only return plans with a specific tag */
  tag?: string;
  /** Only return plans that support a specific payment mode */
  mode?: PremiumMode;
}

export interface SearchResult {
  plan: LICPlanConfig;
  /** 0–1 relevance score */
  score: number;
  /** Which field matched */
  matchedOn: 'policyNumber' | 'policyName' | 'alias' | 'tag' | 'category' | 'tagline';
}

// ── 1. getPlanByPolicyNumber ──────────────────────────────────────────────────

/**
 * Look up a plan by its official LIC policy number (e.g. "815", "854").
 * Returns undefined if not found.
 */
export function getPlanByPolicyNumber(policyNumber: string): LICPlanConfig | undefined {
  const normalized = policyNumber.trim();
  return PLAN_BY_POLICY_NO.get(normalized);
}

// ── 2. getPlanByName ─────────────────────────────────────────────────────────

/**
 * Look up a plan by exact or partial policy name (case-insensitive).
 * Returns the first match. Use searchPlans() for ranked multi-results.
 */
export function getPlanByName(name: string): LICPlanConfig | undefined {
  const q = name.toLowerCase().trim();
  // Exact match first
  const exact = LIC_PLANS.find(p => p.policyName.toLowerCase() === q);
  if (exact) return exact;
  // Partial match
  return LIC_PLANS.find(p =>
    p.policyName.toLowerCase().includes(q) ||
    p.aliases.some(a => a.toLowerCase().includes(q))
  );
}

// ── 3. searchPlans ────────────────────────────────────────────────────────────

/**
 * Full fuzzy search across policyName, policyNumber, aliases, tags, category,
 * and tagline. Returns ranked results with relevance scores.
 *
 * Score breakdown:
 *   1.0 — exact policy number match
 *   0.9 — exact policy name match
 *   0.8 — alias exact match
 *   0.7 — policy name starts with query
 *   0.6 — policy name contains query
 *   0.5 — alias contains query
 *   0.4 — tag match
 *   0.3 — category match
 *   0.2 — tagline contains query
 */
export function searchPlans(query: string, options: SearchOptions = {}): SearchResult[] {
  const q = query.toLowerCase().trim();
  const { limit, category, tag, mode } = options;

  let pool = LIC_PLANS;

  // Pre-filter by category
  if (category && category !== 'all') {
    pool = pool.filter(p => p.category === category);
  }
  // Pre-filter by tag
  if (tag) {
    pool = pool.filter(p => p.tag?.toLowerCase() === tag.toLowerCase());
  }
  // Pre-filter by mode
  if (mode) {
    pool = pool.filter(p => p.validation.allowedModes.includes(mode));
  }

  if (!q) {
    // No query — return all with neutral score
    const all = pool.map(p => ({ plan: p, score: 0.5, matchedOn: 'policyName' as const }));
    return limit ? all.slice(0, limit) : all;
  }

  const results: SearchResult[] = [];

  for (const plan of pool) {
    let score = 0;
    let matchedOn: SearchResult['matchedOn'] = 'policyName';

    const name = plan.policyName.toLowerCase();
    const no = plan.policyNumber;

    if (no === q) {
      score = 1.0; matchedOn = 'policyNumber';
    } else if (name === q) {
      score = 0.9; matchedOn = 'policyName';
    } else if (plan.aliases.some(a => a.toLowerCase() === q)) {
      score = 0.8; matchedOn = 'alias';
    } else if (name.startsWith(q)) {
      score = 0.7; matchedOn = 'policyName';
    } else if (no.startsWith(q)) {
      score = 0.75; matchedOn = 'policyNumber';
    } else if (name.includes(q)) {
      score = 0.6; matchedOn = 'policyName';
    } else if (plan.aliases.some(a => a.toLowerCase().includes(q))) {
      score = 0.5; matchedOn = 'alias';
    } else if (plan.tags.some(t => t.includes(q))) {
      score = 0.4; matchedOn = 'tag';
    } else if (plan.category.includes(q)) {
      score = 0.3; matchedOn = 'category';
    } else if (plan.tagline.toLowerCase().includes(q)) {
      score = 0.2; matchedOn = 'tagline';
    }

    if (score > 0) results.push({ plan, score, matchedOn });
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return limit ? results.slice(0, limit) : results;
}

// ── 4. getPlansByCategory ─────────────────────────────────────────────────────

/**
 * Returns all plans in a given category.
 * Pass 'all' to get every plan.
 */
export function getPlansByCategory(category: PlanCategory | 'all'): LICPlanConfig[] {
  if (category === 'all') return [...LIC_PLANS];
  return LIC_PLANS.filter(p => p.category === category);
}

// ── 5. validatePlanEligibility ────────────────────────────────────────────────

/**
 * Validates a CalcInputV2 against a plan's eligibility rules.
 * Returns errors (blocking) and warnings (informational).
 */
export function validatePlanEligibility(
  plan: LICPlanConfig,
  input: Partial<CalcInputV2>
): EligibilityResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const v = plan.validation;

  // Age
  if (input.age !== undefined) {
    if (input.age < v.minAge) errors.push(`Minimum entry age for ${plan.policyName} is ${v.minAge} years`);
    if (input.age > v.maxAge) errors.push(`Maximum entry age for ${plan.policyName} is ${v.maxAge} years`);
    if (input.age >= v.maxAge - 5) warnings.push(`You are near the maximum entry age limit (${v.maxAge} years) for this plan`);
  }

  // Sum Assured
  if (input.sumAssured !== undefined) {
    if (input.sumAssured < v.minSumAssured)
      errors.push(`Minimum Sum Assured is ₹${(v.minSumAssured / 100000).toFixed(0)} Lakh for ${plan.policyName}`);
    if (v.maxSumAssured > 0 && input.sumAssured > v.maxSumAssured)
      errors.push(`Maximum Sum Assured is ₹${(v.maxSumAssured / 100000).toFixed(0)} Lakh for ${plan.policyName}`);
  }

  // Policy term
  if (input.policyTerm !== undefined) {
    if (v.allowedTerms.length > 0 && !v.allowedTerms.includes(input.policyTerm))
      errors.push(`Policy term must be one of: ${v.allowedTerms.join(', ')} years for ${plan.policyName}`);
    else if (input.policyTerm < v.minTerm || input.policyTerm > v.maxTerm)
      errors.push(`Policy term must be between ${v.minTerm} – ${v.maxTerm} years`);
  }

  // Premium term
  if (input.premiumTerm !== undefined) {
    if (v.allowedPremiumTerms.length > 0 && !v.allowedPremiumTerms.includes(input.premiumTerm))
      errors.push(`Premium paying term must be one of: ${v.allowedPremiumTerms.join(', ')} years`);
  }

  // Payment mode
  if (input.paymentMode !== undefined) {
    if (!v.allowedModes.includes(input.paymentMode))
      errors.push(`${input.paymentMode} payment frequency is not supported for ${plan.policyName}`);
  }

  // Pension / single premium warnings
  if (plan.category === 'pension') {
    warnings.push('This is a single premium plan. The Sum Assured represents the purchase price.');
  }

  // ULIP warning
  if (plan.category === 'ulip') {
    warnings.push('Market returns are not guaranteed. Projections assume 10% p.a. growth.');
  }

  // No maturity benefit warning
  if (plan.maturity.formula === 'none') {
    warnings.push('This is a pure protection plan with no maturity benefit.');
  }

  return { eligible: errors.length === 0, errors, warnings };
}

// ── 6. getSupportedModes ──────────────────────────────────────────────────────

/**
 * Returns the payment modes supported by a plan.
 * Optionally returns human-readable labels.
 */
export function getSupportedModes(
  planId: string,
  withLabels?: false
): PremiumMode[];
export function getSupportedModes(
  planId: string,
  withLabels: true
): { id: PremiumMode; label: string }[];
export function getSupportedModes(
  planId: string,
  withLabels = false
): PremiumMode[] | { id: PremiumMode; label: string }[] {
  const plan = PLAN_BY_ID.get(planId);
  const modes: PremiumMode[] = plan?.validation.allowedModes ?? ['annual', 'half-yearly', 'quarterly', 'monthly'];

  if (!withLabels) return modes;

  const LABELS: Record<PremiumMode, string> = {
    annual: 'Yearly',
    'half-yearly': 'Half-Yearly',
    quarterly: 'Quarterly',
    monthly: 'Monthly',
  };
  return modes.map(m => ({ id: m, label: LABELS[m] }));
}

// ── 7. getSupportedRiders ─────────────────────────────────────────────────────

/**
 * Returns riders available for a plan.
 * Optionally filter by age eligibility.
 */
export function getSupportedRiders(planId: string, age?: number): Rider[] {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return [];

  let riders = plan.riders.filter(r => r.available);
  if (age !== undefined) {
    riders = riders.filter(r => age >= r.minAge && age <= r.maxAge);
  }
  return riders;
}

// ── Bonus utilities ───────────────────────────────────────────────────────────

/** Returns true if a plan accrues bonuses */
export function planHasBonus(planId: string): boolean {
  return PLAN_BY_ID.get(planId)?.bonus.eligible ?? false;
}

/** Returns true if a plan allows loan facility */
export function planHasLoan(planId: string): boolean {
  return PLAN_BY_ID.get(planId)?.loanFacility ?? false;
}

/** Returns true if a plan has surrender value */
export function planHasSurrender(planId: string): boolean {
  return PLAN_BY_ID.get(planId)?.surrender.allowed ?? false;
}

// ── Clamp helper ──────────────────────────────────────────────────────────────

/**
 * Auto-corrects a CalcInputV2 to fit within plan's valid ranges.
 * Useful when switching plans to avoid invalid state.
 */
export function clampToPlanLimits(
  planId: string,
  input: Partial<CalcInputV2>
): Partial<CalcInputV2> {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return input;
  const v = plan.validation;
  const out = { ...input };

  if (out.age !== undefined) {
    out.age = Math.max(v.minAge, Math.min(v.maxAge, out.age));
  }
  if (out.sumAssured !== undefined) {
    out.sumAssured = Math.max(v.minSumAssured,
      v.maxSumAssured > 0 ? Math.min(v.maxSumAssured, out.sumAssured) : out.sumAssured);
  }
  if (out.policyTerm !== undefined) {
    if (v.allowedTerms.length > 0 && !v.allowedTerms.includes(out.policyTerm)) {
      out.policyTerm = v.allowedTerms[0];
    } else {
      out.policyTerm = Math.max(v.minTerm, Math.min(v.maxTerm, out.policyTerm));
    }
  }
  if (out.premiumTerm !== undefined) {
    if (v.allowedPremiumTerms.length > 0 && !v.allowedPremiumTerms.includes(out.premiumTerm)) {
      out.premiumTerm = v.allowedPremiumTerms[0];
    } else {
      out.premiumTerm = Math.max(v.minTerm, Math.min(v.maxTerm, out.premiumTerm));
    }
  }
  if (out.paymentMode !== undefined && !v.allowedModes.includes(out.paymentMode)) {
    out.paymentMode = v.allowedModes[0];
  }

  return out;
}
