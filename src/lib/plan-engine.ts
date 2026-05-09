// ─── Plan-Aware Premium Calculation Engine v2 ────────────────────────────────
// Drives all calculations from LICPlanConfig — fully config-driven

import { getPlanById, searchPlans } from '@/data/lic-plans';
import { interpolateRate } from '@/types/lic-plans';
import type { LICPlanConfig, CalcInputV2, CalcResultV2, YearlyProjection, PremiumMode } from '@/types/lic-plans';

// ── Mode instalments ──────────────────────────────────────────────────────────
const MODE_LOADING: Record<PremiumMode, number> = {
  annual: 0, 'half-yearly': 0.01, quarterly: 0.02, monthly: 0.04,
};
const MODE_DIVISOR: Record<PremiumMode, number> = {
  annual: 1, 'half-yearly': 2, quarterly: 4, monthly: 12,
};

function modeInstalment(mode: PremiumMode, annual: number): number {
  const loaded = annual * (1 + MODE_LOADING[mode]);
  return Math.round(loaded / MODE_DIVISOR[mode]);
}

// ── Validate input against plan config ───────────────────────────────────────
function validate(plan: LICPlanConfig, input: CalcInputV2): string[] {
  const v = plan.validation;
  const msgs: string[] = [];

  if (input.age < v.minAge) msgs.push(`Minimum entry age for ${plan.policyName} is ${v.minAge} years`);
  if (input.age > v.maxAge) msgs.push(`Maximum entry age for ${plan.policyName} is ${v.maxAge} years`);
  if (input.sumAssured < v.minSumAssured) msgs.push(`Minimum Sum Assured is ₹${(v.minSumAssured/100000).toFixed(0)}L`);
  if (v.maxSumAssured > 0 && input.sumAssured > v.maxSumAssured) msgs.push(`Maximum Sum Assured is ₹${(v.maxSumAssured/100000).toFixed(0)}L`);
  if (input.policyTerm < v.minTerm) msgs.push(`Minimum policy term is ${v.minTerm} years`);
  if (input.policyTerm > v.maxTerm) msgs.push(`Maximum policy term is ${v.maxTerm} years`);
  if (v.allowedTerms.length > 0 && !v.allowedTerms.includes(input.policyTerm))
    msgs.push(`Policy term must be one of: ${v.allowedTerms.join(', ')} years`);
  if (!v.allowedModes.includes(input.paymentMode))
    msgs.push(`${input.paymentMode} payment not supported for ${plan.policyName}`);

  return msgs;
}

// ── Compute rider premium ─────────────────────────────────────────────────────
function riderPremium(plan: LICPlanConfig, input: CalcInputV2): number {
  const saUnit = input.sumAssured / 1000;
  return plan.riders
    .filter(r => r.available && input.selectedRiders.includes(r.id))
    .reduce((sum, r) => sum + r.ratePerThousand * saUnit, 0);
}

// ── Core calculation ──────────────────────────────────────────────────────────
export function calculateV2(input: CalcInputV2): CalcResultV2 {
  const plan = getPlanById(input.planId);
  if (!plan) {
    return errorResult(input, 'Plan not found. Please select a valid LIC plan.');
  }

  const validationMessages = validate(plan, input);
  const isValid = validationMessages.length === 0;

  const saUnit = input.sumAssured / 1000;
  const femaleDisc = input.gender === 'female' ? plan.femaleDiscount : 1.0;
  const smokeMult = (plan.validation.smokingApplies && input.smoking) ? plan.smokingLoading : 1.0;
  const ageMult = input.age > plan.ageLoadingStart
    ? 1 + (input.age - plan.ageLoadingStart) * plan.ageLoadingFactor
    : 1.0;

  let basePremium = 0;
  let maturityBenefit = 0;
  let deathBenefit = 0;
  let bonusEstimate = 0;

  if (plan.category === 'pension') {
    // Single-premium pension: SA = purchase price
    basePremium = 0;
    maturityBenefit = input.sumAssured * plan.maturity.annuityRate; // annual pension
    deathBenefit = input.sumAssured;
    bonusEstimate = 0;
    validationMessages.push('ℹ️ This is a single premium plan. SA shown is the purchase price.');
  } else if (plan.category === 'ulip') {
    basePremium = input.sumAssured; // SA treated as annual premium
    const g = plan.maturity.assumedGrowthRate;
    maturityBenefit = basePremium * ((Math.pow(1 + g, input.policyTerm) - 1) / g) * 0.85;
    deathBenefit = Math.max(plan.maturity.deathBenefitMultiplier * basePremium, maturityBenefit * 1.05);
    bonusEstimate = 0;
  } else {
    // Standard calculation from rate table
    const rate = interpolateRate(input.age, plan.rateTable);
    basePremium = rate * saUnit * femaleDisc * smokeMult * ageMult;

    // Bonus
    if (plan.bonus.eligible) {
      bonusEstimate = plan.bonus.reversionaryRate * saUnit * input.policyTerm;
      const fab = plan.bonus.fabRate * saUnit;

      if (plan.maturity.formula === 'sa+bonus+fab') {
        maturityBenefit = input.sumAssured + bonusEstimate + fab;
      } else if (plan.maturity.formula === 'sa+bonus') {
        maturityBenefit = input.sumAssured + bonusEstimate;
      } else {
        maturityBenefit = plan.payoutType === 'none' ? 0 : input.sumAssured;
      }
    } else {
      maturityBenefit = plan.payoutType === 'none' ? 0 : input.sumAssured;
    }

    // Survival payouts for money-back
    const survivalTotal = plan.maturity.survivalPayouts.reduce(
      (sum, sp) => sum + (input.sumAssured * sp.percent / 100), 0
    );
    if (plan.payoutType === 'periodic') {
      maturityBenefit = maturityBenefit * 0.40 + bonusEstimate + survivalTotal;
    }

    // Death benefit
    deathBenefit = input.sumAssured * plan.maturity.deathBenefitMultiplier + bonusEstimate;
    if (plan.payoutType === 'none') deathBenefit = input.sumAssured;
  }

  // Rider + GST
  const riderPrem = riderPremium(plan, input);
  const riderGst = riderPrem * 0.18;
  const gst = plan.gstApplicable ? basePremium * plan.gstRate : 0;
  const annualPremium = Math.round(basePremium + gst + riderPrem + riderGst);
  const totalPremiumPaid = annualPremium * input.premiumTerm;

  // Tax saving (80C, max 1.5L at 30% bracket)
  const taxSaving = Math.min(annualPremium, 150000) * 0.30;
  const surplusGain = Math.max(0, maturityBenefit - totalPremiumPaid);
  const roi = totalPremiumPaid > 0 && maturityBenefit > 0
    ? ((maturityBenefit / totalPremiumPaid - 1) * 100) : 0;

  // Break-even year
  let breakEvenYear = input.premiumTerm;
  for (let y = 1; y <= input.policyTerm; y++) {
    if (annualPremium * Math.min(y, input.premiumTerm) >= maturityBenefit * (y / input.policyTerm)) {
      breakEvenYear = y; break;
    }
  }

  // Mode breakdown
  const premiumByMode = {
    annual: annualPremium,
    halfYearly: modeInstalment('half-yearly', annualPremium),
    quarterly: modeInstalment('quarterly', annualPremium),
    monthly: modeInstalment('monthly', annualPremium),
    daily: Math.round(annualPremium / 365),
  };

  // Projections
  const projections: YearlyProjection[] = [];
  const annualBonus = plan.bonus.eligible ? plan.bonus.reversionaryRate * saUnit : 0;
  for (let y = 1; y <= input.policyTerm; y++) {
    const premPaid = annualPremium * Math.min(y, input.premiumTerm);
    const bonusAccrued = annualBonus * y;
    const svF = y >= 3 ? 0.30 + (y / input.policyTerm) * 0.40 : 0;
    const sv = y >= 3 ? premPaid * svF : 0;
    projections.push({
      year: y,
      premiumPaid: Math.round(premPaid),
      bonusAccrued: Math.round(bonusAccrued),
      surrenderValue: Math.round(sv),
      deathBenefit: Math.round(deathBenefit + bonusAccrued),
    });
  }

  return {
    planId: plan.id,
    policyNumber: plan.policyNumber,
    policyName: plan.policyName,
    planCategory: plan.category,
    basePremium: Math.round(basePremium),
    riderPremium: Math.round(riderPrem),
    gst: Math.round(gst),
    annualPremium,
    totalAnnualPremium: annualPremium,
    premiumByMode,
    totalPremiumPaid: Math.round(totalPremiumPaid),
    maturityBenefit: Math.round(maturityBenefit),
    deathBenefit: Math.round(deathBenefit),
    bonusEstimate: Math.round(bonusEstimate),
    taxSaving: Math.round(taxSaving),
    surplusGain: Math.round(surplusGain),
    roi: Math.round(roi * 10) / 10,
    breakEvenYear,
    isValid,
    validationMessages,
    projections,
    aiInsight: generateInsight(plan, input, annualPremium, maturityBenefit, surplusGain, roi),
    humanSummary: generateSummary(plan, input, premiumByMode.monthly, maturityBenefit, deathBenefit),
  };
}

function errorResult(input: CalcInputV2, msg: string): CalcResultV2 {
  return {
    planId: input.planId, policyNumber: '', policyName: 'Unknown Plan', planCategory: 'term',
    basePremium: 0, riderPremium: 0, gst: 0, annualPremium: 0, totalAnnualPremium: 0,
    premiumByMode: { annual: 0, halfYearly: 0, quarterly: 0, monthly: 0, daily: 0 },
    totalPremiumPaid: 0, maturityBenefit: 0, deathBenefit: 0, bonusEstimate: 0,
    taxSaving: 0, surplusGain: 0, roi: 0, breakEvenYear: 0,
    isValid: false, validationMessages: [msg], projections: [],
    aiInsight: '', humanSummary: '',
  };
}

function generateInsight(plan: LICPlanConfig, input: CalcInputV2, annual: number, maturity: number, surplus: number, roi: number): string {
  const incomeRatio = (annual / input.annualIncome * 100).toFixed(1);
  if (plan.category === 'term') return `✅ ${plan.policyName} (No. ${plan.policyNumber}) costs just ${incomeRatio}% of your income. Your family gets ₹${(input.sumAssured/100000).toFixed(0)}L tax-free — pure protection at lowest cost.`;
  if (plan.category === 'pension') return `🏦 Invest ₹${(input.sumAssured/100000).toFixed(1)}L in ${plan.policyName} and receive ₹${(maturity/100000).toFixed(1)}L/year as guaranteed pension for life.`;
  if (plan.category === 'ulip') return `📈 ${plan.policyName} gives market-linked growth. Estimated corpus: ₹${(maturity/100000).toFixed(1)}L at 10% p.a. — higher risk, higher potential reward.`;
  if (roi > 6) return `📊 ${plan.policyName} returns ~${roi.toFixed(1)}% p.a. — better than most FDs. Surplus gain: ₹${(surplus/100000).toFixed(1)}L over ${input.policyTerm} years.`;
  return `💡 ${plan.policyName} (No. ${plan.policyNumber}) allocates ${incomeRatio}% of your income. Consider increasing SA for better protection ratio.`;
}

function generateSummary(plan: LICPlanConfig, input: CalcInputV2, monthly: number, maturity: number, death: number): string {
  const m = (v: number) => `₹${(v/100000).toFixed(1)}L`;
  if (plan.category === 'term') return `You pay ₹${monthly.toLocaleString()}/month under ${plan.policyName}. Your nominee receives ${m(death)} if something happens to you. No maturity — pure protection.`;
  if (plan.category === 'pension') return `Invest ${m(input.sumAssured)} once in ${plan.policyName}. You receive ${m(maturity)}/year as pension for life — completely guaranteed.`;
  if (plan.category === 'ulip') return `You invest ₹${monthly.toLocaleString()}/month in ${plan.policyName} (market-linked). Estimated fund value at maturity: ${m(maturity)} at 10% growth.`;
  return `You pay ₹${monthly.toLocaleString()}/month in ${plan.policyName} and get back approximately ${m(maturity)} after ${input.policyTerm} years — your money growing safely!`;
}

// ── Clamp input to plan limits ────────────────────────────────────────────────
export function clampInputToPlan(input: CalcInputV2): CalcInputV2 {
  const plan = getPlanById(input.planId);
  if (!plan) return input;
  const v = plan.validation;
  const out = { ...input };
  out.age = Math.max(v.minAge, Math.min(v.maxAge, out.age));
  out.sumAssured = Math.max(v.minSumAssured, v.maxSumAssured > 0 ? Math.min(v.maxSumAssured, out.sumAssured) : out.sumAssured);
  if (v.allowedTerms.length > 0 && !v.allowedTerms.includes(out.policyTerm)) out.policyTerm = v.allowedTerms[0];
  out.policyTerm = Math.max(v.minTerm, Math.min(v.maxTerm, out.policyTerm));
  if (v.allowedPremiumTerms.length > 0 && !v.allowedPremiumTerms.includes(out.premiumTerm)) out.premiumTerm = v.allowedPremiumTerms[0];
  out.premiumTerm = Math.max(v.minTerm, Math.min(v.maxTerm, out.premiumTerm));
  if (!v.allowedModes.includes(out.paymentMode)) out.paymentMode = v.allowedModes[0];
  return out;
}

// ── Format INR ────────────────────────────────────────────────────────────────
export function formatINR(v: number): string {
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)} Cr`;
  if (v >= 100000) return `₹${(v/100000).toFixed(2)} L`;
  if (v >= 1000) return `₹${(v/1000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}
