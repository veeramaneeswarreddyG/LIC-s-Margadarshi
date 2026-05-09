// ─── Plan Validation Engine ───────────────────────────────────────────────────
// Config-driven validation for all LIC plan inputs.
// Rules come entirely from LICPlanConfig — no hardcoded plan logic.

import { PLAN_BY_ID } from '@/data/lic-plans';
import type { LICPlanConfig, CalcInputV2, PremiumMode, Rider } from '@/types/lic-plans';

// ── Result Types ──────────────────────────────────────────────────────────────

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  field: string;
  severity: ValidationSeverity;
  code: string;
  message: string;
}

export interface ValidationRecommendation {
  field: string;
  message: string;
  suggestedValue?: string | number;
}

export interface ValidationReport {
  planId: string;
  policyNumber: string;
  policyName: string;
  isValid: boolean;                        // no errors
  issues: ValidationIssue[];              // all issues (error + warning + info)
  errors: ValidationIssue[];              // blocking — must fix
  warnings: ValidationIssue[];            // non-blocking — should review
  infos: ValidationIssue[];               // informational notes
  recommendations: ValidationRecommendation[];
  summary: string;                        // human-readable one-liner
}

// ── Partial input type for incremental validation ─────────────────────────────

export type PartialCalcInput = Partial<CalcInputV2>;

// ── Main validator ────────────────────────────────────────────────────────────

export function validatePlan(
  planId: string,
  input: PartialCalcInput
): ValidationReport {
  const plan = PLAN_BY_ID.get(planId);

  if (!plan) {
    return errorReport(planId, `Plan "${planId}" not found in configuration.`);
  }

  const issues: ValidationIssue[] = [
    ...checkAge(plan, input),
    ...checkSumAssured(plan, input),
    ...checkPolicyTerm(plan, input),
    ...checkPremiumTerm(plan, input),
    ...checkPaymentMode(plan, input),
    ...checkRiders(plan, input),
    ...checkPlanTypeNotes(plan, input),
  ];

  const errors   = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos    = issues.filter(i => i.severity === 'info');
  const recs     = buildRecommendations(plan, input, issues);

  return {
    planId: plan.id,
    policyNumber: plan.policyNumber,
    policyName: plan.policyName,
    isValid: errors.length === 0,
    issues, errors, warnings, infos,
    recommendations: recs,
    summary: buildSummary(plan, errors, warnings, recs),
  };
}

// ── Age validation ────────────────────────────────────────────────────────────

function checkAge(plan: LICPlanConfig, input: PartialCalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { age } = input;
  if (age === undefined) return [];

  const { minAge, maxAge } = plan.validation;

  if (age < minAge) {
    issues.push({
      field: 'age', severity: 'error', code: 'AGE_TOO_LOW',
      message: `Minimum entry age for ${plan.policyName} is ${minAge} years. You entered ${age}.`,
    });
  } else if (age > maxAge) {
    issues.push({
      field: 'age', severity: 'error', code: 'AGE_TOO_HIGH',
      message: `Maximum entry age for ${plan.policyName} is ${maxAge} years. You entered ${age}.`,
    });
  } else if (age >= maxAge - 5) {
    issues.push({
      field: 'age', severity: 'warning', code: 'AGE_NEAR_MAX',
      message: `You are within 5 years of the maximum entry age (${maxAge}). Premiums will be significantly higher.`,
    });
  } else if (age <= minAge + 5 && plan.category !== 'children') {
    issues.push({
      field: 'age', severity: 'info', code: 'AGE_YOUNG',
      message: `Starting young (age ${age}) gives you the best premium rates and maximum coverage period.`,
    });
  }

  return issues;
}

// ── Sum Assured validation ────────────────────────────────────────────────────

function checkSumAssured(plan: LICPlanConfig, input: PartialCalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { sumAssured, annualIncome } = input;
  if (sumAssured === undefined) return [];

  const { minSumAssured, maxSumAssured } = plan.validation;

  if (sumAssured < minSumAssured) {
    issues.push({
      field: 'sumAssured', severity: 'error', code: 'SA_TOO_LOW',
      message: `Minimum Sum Assured for ${plan.policyName} is ₹${fmtINR(minSumAssured)}. Increase your coverage.`,
    });
  }

  if (maxSumAssured > 0 && sumAssured > maxSumAssured) {
    issues.push({
      field: 'sumAssured', severity: 'error', code: 'SA_TOO_HIGH',
      message: `Maximum Sum Assured for ${plan.policyName} is ₹${fmtINR(maxSumAssured)}.`,
    });
  }

  // Income-based adequacy check
  if (annualIncome && sumAssured < annualIncome * 10 && plan.category === 'term') {
    issues.push({
      field: 'sumAssured', severity: 'warning', code: 'SA_INADEQUATE',
      message: `Financial experts recommend at least 10× annual income (₹${fmtINR(annualIncome * 10)}) as life cover. Current SA may be insufficient.`,
    });
  }

  if (annualIncome && sumAssured > annualIncome * 25) {
    issues.push({
      field: 'sumAssured', severity: 'info', code: 'SA_HIGH',
      message: `Sum Assured is more than 25× your income. Insurers may require additional medical underwriting.`,
    });
  }

  return issues;
}

// ── Policy term validation ────────────────────────────────────────────────────

function checkPolicyTerm(plan: LICPlanConfig, input: PartialCalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { policyTerm, age } = input;
  if (policyTerm === undefined) return [];

  const { minTerm, maxTerm, allowedTerms } = plan.validation;

  if (allowedTerms.length > 0 && !allowedTerms.includes(policyTerm)) {
    issues.push({
      field: 'policyTerm', severity: 'error', code: 'TERM_NOT_ALLOWED',
      message: `${plan.policyName} only supports policy terms of: ${allowedTerms.join(', ')} years. You selected ${policyTerm}.`,
    });
  } else if (policyTerm < minTerm) {
    issues.push({
      field: 'policyTerm', severity: 'error', code: 'TERM_TOO_SHORT',
      message: `Minimum policy term for ${plan.policyName} is ${minTerm} years.`,
    });
  } else if (policyTerm > maxTerm) {
    issues.push({
      field: 'policyTerm', severity: 'error', code: 'TERM_TOO_LONG',
      message: `Maximum policy term for ${plan.policyName} is ${maxTerm} years.`,
    });
  }

  // Maturity age check
  if (age !== undefined) {
    const maturityAge = age + policyTerm;
    if (maturityAge > 85) {
      issues.push({
        field: 'policyTerm', severity: 'warning', code: 'MATURITY_AGE_HIGH',
        message: `Maturity at age ${maturityAge} may exceed typical plan coverage limits. Verify with your LIC advisor.`,
      });
    }
  }

  return issues;
}

// ── Premium term validation ───────────────────────────────────────────────────

function checkPremiumTerm(plan: LICPlanConfig, input: PartialCalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { premiumTerm, policyTerm } = input;
  if (premiumTerm === undefined) return [];

  const { allowedPremiumTerms, minTerm, maxTerm } = plan.validation;

  if (allowedPremiumTerms.length > 0 && !allowedPremiumTerms.includes(premiumTerm)) {
    issues.push({
      field: 'premiumTerm', severity: 'error', code: 'PPT_NOT_ALLOWED',
      message: `${plan.policyName} only supports premium paying terms of: ${allowedPremiumTerms.join(', ')} years.`,
    });
  }

  if (policyTerm !== undefined && premiumTerm > policyTerm) {
    issues.push({
      field: 'premiumTerm', severity: 'error', code: 'PPT_EXCEEDS_TERM',
      message: `Premium paying term (${premiumTerm} yrs) cannot exceed policy term (${policyTerm} yrs).`,
    });
  }

  if (policyTerm !== undefined && premiumTerm === policyTerm && plan.termOptions.length > 0) {
    issues.push({
      field: 'premiumTerm', severity: 'info', code: 'LIMITED_PPT_AVAILABLE',
      message: `${plan.policyName} offers limited premium payment options — pay for fewer years and keep coverage longer.`,
    });
  }

  return issues;
}

// ── Payment mode validation ───────────────────────────────────────────────────

function checkPaymentMode(plan: LICPlanConfig, input: PartialCalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { paymentMode } = input;
  if (!paymentMode) return [];

  const { allowedModes } = plan.validation;

  if (!allowedModes.includes(paymentMode as PremiumMode)) {
    issues.push({
      field: 'paymentMode', severity: 'error', code: 'MODE_NOT_SUPPORTED',
      message: `${paymentMode} payment is not supported for ${plan.policyName}. Use: ${allowedModes.join(', ')}.`,
    });
  }

  if (paymentMode === 'monthly') {
    issues.push({
      field: 'paymentMode', severity: 'info', code: 'MONTHLY_LOADING',
      message: `Monthly mode includes a ~4% frequency loading. Annual payment saves ~₹${
        input.sumAssured ? Math.round(input.sumAssured * 0.001) : 'some'} per year.`,
    });
  }

  if (paymentMode === 'annual') {
    issues.push({
      field: 'paymentMode', severity: 'info', code: 'ANNUAL_BEST_RATE',
      message: `Annual payment is the most cost-effective mode — no frequency loading applied.`,
    });
  }

  return issues;
}

// ── Rider validation ──────────────────────────────────────────────────────────

function checkRiders(plan: LICPlanConfig, input: PartialCalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { selectedRiders, age } = input;
  if (!selectedRiders || selectedRiders.length === 0) return [];

  const availableRiderIds = plan.riders.filter(r => r.available).map(r => r.id);

  for (const riderId of selectedRiders) {
    const rider = plan.riders.find(r => r.id === riderId);

    if (!rider || !rider.available) {
      issues.push({
        field: 'riders', severity: 'error', code: 'RIDER_NOT_AVAILABLE',
        message: `Rider "${riderId}" is not available for ${plan.policyName}.`,
      });
      continue;
    }

    if (age !== undefined) {
      if (age < rider.minAge) {
        issues.push({
          field: 'riders', severity: 'error', code: 'RIDER_AGE_LOW',
          message: `${rider.name} requires minimum age ${rider.minAge}. You are ${age}.`,
        });
      } else if (age > rider.maxAge) {
        issues.push({
          field: 'riders', severity: 'error', code: 'RIDER_AGE_HIGH',
          message: `${rider.name} is not available above age ${rider.maxAge}.`,
        });
      }
    }
  }

  // Suggest ADB rider if not selected and available
  if (!selectedRiders.includes('adb') && availableRiderIds.includes('adb')) {
    issues.push({
      field: 'riders', severity: 'info', code: 'ADB_RECOMMENDED',
      message: `Accidental Death Benefit rider is highly recommended for working-age policyholders.`,
    });
  }

  return issues;
}

// ── Plan type notes ───────────────────────────────────────────────────────────

function checkPlanTypeNotes(plan: LICPlanConfig, input: PartialCalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (plan.category === 'term') {
    issues.push({
      field: 'plan', severity: 'info', code: 'TERM_NO_MATURITY',
      message: `${plan.policyName} is a pure protection plan — no maturity benefit. Your money buys maximum life cover.`,
    });
  }

  if (plan.category === 'pension') {
    issues.push({
      field: 'plan', severity: 'info', code: 'PENSION_SINGLE_PREMIUM',
      message: `This is a single premium annuity plan. The Sum Assured represents your one-time investment (purchase price).`,
    });
  }

  if (plan.category === 'ulip') {
    issues.push({
      field: 'plan', severity: 'warning', code: 'ULIP_MARKET_RISK',
      message: `ULIP returns are market-linked and not guaranteed. Projections assume 10% p.a. growth.`,
    });
    if ((input.policyTerm ?? 0) < 10) {
      issues.push({
        field: 'policyTerm', severity: 'warning', code: 'ULIP_SHORT_TERM',
        message: `ULIPs perform best over 10+ years due to market compounding. Consider a longer term.`,
      });
    }
  }

  if (plan.bonus.eligible) {
    issues.push({
      field: 'plan', severity: 'info', code: 'BONUS_ELIGIBLE',
      message: `${plan.policyName} earns yearly bonuses — the longer the term, the higher your bonus accumulation.`,
    });
  }

  if (!plan.surrender.allowed) {
    issues.push({
      field: 'plan', severity: 'info', code: 'NO_SURRENDER',
      message: `This plan does not offer a surrender value. Keep it active till maturity for full benefits.`,
    });
  }

  return issues;
}

// ── Recommendations builder ───────────────────────────────────────────────────

function buildRecommendations(
  plan: LICPlanConfig,
  input: PartialCalcInput,
  issues: ValidationIssue[]
): ValidationRecommendation[] {
  const recs: ValidationRecommendation[] = [];
  const { age, sumAssured, annualIncome, policyTerm } = input;

  // SA recommendation
  if (annualIncome && sumAssured !== undefined && sumAssured < annualIncome * 10 && plan.category === 'term') {
    recs.push({
      field: 'sumAssured',
      message: `Increase Sum Assured to at least 10× your annual income`,
      suggestedValue: annualIncome * 10,
    });
  }

  // Term recommendation for endowment
  if (plan.category === 'endowment' && policyTerm !== undefined && policyTerm < 20) {
    recs.push({
      field: 'policyTerm',
      message: `A 20+ year term maximizes bonus accumulation for endowment plans`,
      suggestedValue: 20,
    });
  }

  // Annual payment recommendation
  if (input.paymentMode && input.paymentMode !== 'annual' && plan.validation.allowedModes.includes('annual')) {
    recs.push({
      field: 'paymentMode',
      message: `Switch to annual payment to avoid the frequency loading charge`,
      suggestedValue: 'annual',
    });
  }

  // Limited PPT recommendation
  if (plan.termOptions.length > 0 && policyTerm !== undefined) {
    const limitedOpt = plan.termOptions.find(o => o.premiumTerm < o.policyTerm);
    if (limitedOpt && input.premiumTerm === policyTerm) {
      recs.push({
        field: 'premiumTerm',
        message: `${plan.policyName} offers limited premium payment — pay for ${limitedOpt.premiumTerm} years, covered for ${limitedOpt.policyTerm} years`,
        suggestedValue: limitedOpt.premiumTerm,
      });
    }
  }

  return recs;
}

// ── Summary builder ───────────────────────────────────────────────────────────

function buildSummary(
  plan: LICPlanConfig,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
  recs: ValidationRecommendation[]
): string {
  if (errors.length > 0) {
    return `❌ ${errors.length} issue${errors.length > 1 ? 's' : ''} must be fixed before calculating ${plan.policyName}.`;
  }
  if (warnings.length > 0) {
    return `⚠️ ${plan.policyName} inputs look mostly valid — review ${warnings.length} warning${warnings.length > 1 ? 's' : ''}.`;
  }
  if (recs.length > 0) {
    return `✅ ${plan.policyName} inputs are valid. ${recs.length} optimization${recs.length > 1 ? 's' : ''} suggested.`;
  }
  return `✅ All inputs are valid for ${plan.policyName} (No. ${plan.policyNumber}).`;
}

// ── Error report factory ──────────────────────────────────────────────────────

function errorReport(planId: string, message: string): ValidationReport {
  const issue: ValidationIssue = { field: 'plan', severity: 'error', code: 'PLAN_NOT_FOUND', message };
  return {
    planId, policyNumber: '', policyName: 'Unknown',
    isValid: false,
    issues: [issue], errors: [issue], warnings: [], infos: [],
    recommendations: [],
    summary: `❌ ${message}`,
  };
}

// ── Helper: format INR ────────────────────────────────────────────────────────

function fmtINR(v: number): string {
  if (v >= 10000000) return `${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(0)} L`;
  return v.toLocaleString('en-IN');
}

// ── Field-level quick validators (for inline form feedback) ───────────────────

export function validateAge(planId: string, age: number): string | null {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return null;
  if (age < plan.validation.minAge) return `Min age: ${plan.validation.minAge}`;
  if (age > plan.validation.maxAge) return `Max age: ${plan.validation.maxAge}`;
  return null;
}

export function validateSumAssured(planId: string, sa: number): string | null {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return null;
  if (sa < plan.validation.minSumAssured) return `Min SA: ₹${fmtINR(plan.validation.minSumAssured)}`;
  if (plan.validation.maxSumAssured > 0 && sa > plan.validation.maxSumAssured) return `Max SA: ₹${fmtINR(plan.validation.maxSumAssured)}`;
  return null;
}

export function validatePaymentMode(planId: string, mode: string): string | null {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return null;
  if (!plan.validation.allowedModes.includes(mode as PremiumMode)) {
    return `${mode} not supported. Use: ${plan.validation.allowedModes.join(', ')}`;
  }
  return null;
}

export function validatePolicyTerm(planId: string, term: number): string | null {
  const plan = PLAN_BY_ID.get(planId);
  if (!plan) return null;
  const { allowedTerms, minTerm, maxTerm } = plan.validation;
  if (allowedTerms.length > 0 && !allowedTerms.includes(term)) {
    return `Allowed terms: ${allowedTerms.join(', ')} yrs`;
  }
  if (term < minTerm) return `Min term: ${minTerm} yrs`;
  if (term > maxTerm) return `Max term: ${maxTerm} yrs`;
  return null;
}
