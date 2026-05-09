// ─── LIC Premium Calculation Engine ────────────────────────────────────────
// Accurate tabular premium logic for all major LIC plan types (2025-26)

export type PlanType = 'term' | 'endowment' | 'moneyback' | 'whole-life' | 'pension' | 'ulip' | 'children';
export type PaymentMode = 'annual' | 'half-yearly' | 'quarterly' | 'monthly';
export type Goal = 'protection' | 'savings' | 'child' | 'retirement' | 'tax' | 'wealth' | 'marriage';
export type Gender = 'male' | 'female';

export interface CalcInput {
  name: string;
  age: number;
  gender: Gender;
  smoking: boolean;
  annualIncome: number;
  goal: Goal;
  planType: PlanType;
  sumAssured: number;
  policyTerm: number;
  premiumTerm: number;
  paymentMode: PaymentMode;
  riders: { accidentDeath: boolean; criticalIllness: boolean; waiver: boolean };
}

export interface YearlyProjection {
  year: number;
  premiumPaid: number;
  bonusAccrued: number;
  surrenderValue: number;
  deathBenefit: number;
}

export interface CalcResult {
  planName: string;
  planNo: string;
  basePremium: number;
  annualPremium: number;
  riderPremium: number;
  gst: number;
  totalAnnualPremium: number;
  premiumByMode: { annual: number; halfYearly: number; quarterly: number; monthly: number; daily: number };
  totalPremiumPaid: number;
  maturityBenefit: number;
  deathBenefit: number;
  bonusEstimate: number;
  taxSaving: number;
  surplusGain: number;
  roi: number;
  breakEvenYear: number;
  isValid: boolean;
  validationMessages: string[];
  projections: YearlyProjection[];
  aiInsight: string;
  humanSummary: string;
}

export interface PlanRecommendation {
  planType: PlanType;
  planName: string;
  reason: string;
  score: number;
  emoji: string;
}

// ── Tabular base rates per ₹1,000 SA/year (age-interpolated) ───────────────

// Term: [age, rate per 1000 SA/year]
const TERM_RATES: [number, number][] = [
  [18, 4.5], [20, 4.8], [25, 5.8], [30, 7.5], [35, 11.0],
  [40, 16.5], [45, 24.0], [50, 36.0], [55, 52.0], [60, 76.0], [65, 110.0],
];

// Endowment by term: { term: rate_per_1000 } — age adds loading
const ENDOWMENT_RATES: Record<number, number> = {
  10: 98, 12: 88, 15: 79, 16: 76, 20: 63, 21: 61, 25: 53, 30: 47, 35: 43
};

// Money Back — base rate per 1000 SA/year
const MONEY_BACK_20_RATES: [number, number][] = [
  [13, 75], [20, 77], [25, 79], [30, 82], [35, 87], [40, 96], [45, 108], [50, 126]
];
const MONEY_BACK_25_RATES: [number, number][] = [
  [13, 63], [20, 65], [25, 67], [30, 70], [35, 75], [40, 83], [45, 95]
];

// Whole life (Jeevan Umang) — per 1000 SA/year by PPT
const WHOLE_LIFE_RATES: Record<number, [number, number][]> = {
  15: [[0, 70], [10, 73], [20, 77], [30, 85], [40, 98], [50, 118]],
  20: [[0, 57], [10, 59], [20, 62], [30, 69], [40, 82], [50, 101]],
  25: [[0, 48], [10, 50], [20, 53], [30, 59], [40, 72]],
  30: [[0, 42], [10, 44], [20, 47], [30, 53]],
};

// Children (Jeevan Tarun) — per 1000 SA/year
const CHILDREN_RATES: [number, number][] = [
  [0, 72], [3, 73], [6, 75], [9, 78], [12, 83]
];

// ── Utility ─────────────────────────────────────────────────────────────────

function interpolate(age: number, table: [number, number][]): number {
  if (age <= table[0][0]) return table[0][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [a1, r1] = table[i], [a2, r2] = table[i + 1];
    if (age >= a1 && age < a2) return r1 + (r2 - r1) * ((age - a1) / (a2 - a1));
  }
  return table[table.length - 1][1];
}

function modeLoading(mode: PaymentMode): number {
  return { annual: 0, 'half-yearly': 0.01, quarterly: 0.02, monthly: 0.04 }[mode];
}

function modeInstalment(mode: PaymentMode, annual: number): number {
  const loaded = annual * (1 + modeLoading(mode));
  return { annual: loaded, 'half-yearly': loaded / 2, quarterly: loaded / 4, monthly: loaded / 12 }[mode];
}

// ── Main Calculation Function ────────────────────────────────────────────────

export function calculate(input: CalcInput): CalcResult {
  const { age, gender, smoking, planType, sumAssured, policyTerm, premiumTerm, paymentMode, riders, annualIncome, goal } = input;
  const sa = sumAssured;
  const saUnit = sa / 1000;

  const messages: string[] = [];
  let valid = true;

  // Riders premium
  const riderBase =
    (riders.accidentDeath ? 1.0 * saUnit : 0) +
    (riders.criticalIllness ? 2.5 * saUnit : 0) +
    (riders.waiver ? 0.8 * saUnit : 0);
  const riderPremium = riderBase;
  const riderGst = riderPremium * 0.18;

  // Female discount
  const femaleDiscount = gender === 'female' ? 0.95 : 1.0;
  // Smoking loading
  const smokingLoad = smoking ? 1.25 : 1.0;

  let basePremium = 0;
  let planName = '';
  let planNo = '';
  let maturityBenefit = 0;
  let deathBenefit = 0;
  let bonusEstimate = 0;

  // ── TERM ────────────────────────────────────────────────────────────────────
  if (planType === 'term') {
    planName = 'Jeevan Amar';
    planNo = '855';
    if (sa < 2500000) { messages.push('Minimum SA for term plans is ₹25 Lakhs'); valid = false; }
    if (age < 18 || age > 65) { messages.push('Entry age must be 18–65 years'); valid = false; }
    if (policyTerm < 10 || policyTerm > 40) { messages.push('Policy term: 10–40 years'); valid = false; }

    const rate = interpolate(age, TERM_RATES);
    basePremium = rate * saUnit * femaleDiscount * smokingLoad;
    deathBenefit = sa;
    maturityBenefit = 0;
    bonusEstimate = 0;
  }

  // ── ENDOWMENT ───────────────────────────────────────────────────────────────
  else if (planType === 'endowment') {
    planName = 'Jeevan Anand';
    planNo = '815';
    if (sa < 100000) { messages.push('Minimum SA is ₹1 Lakh'); valid = false; }
    if (age < 18 || age > 50) { messages.push('Entry age: 18–50 years'); valid = false; }
    if (policyTerm < 15 || policyTerm > 35) { messages.push('Policy term: 15–35 years'); valid = false; }

    const termKey = Object.keys(ENDOWMENT_RATES).map(Number)
      .sort((a, b) => Math.abs(a - policyTerm) - Math.abs(b - policyTerm))[0];
    const rate = ENDOWMENT_RATES[termKey];
    const ageLoad = age > 35 ? 1 + (age - 35) * 0.008 : 1.0;
    basePremium = rate * saUnit * femaleDiscount * smokingLoad * ageLoad;
    // Reversionary bonus: ₹48/1000 SA/year (LIC 2024 rate)
    bonusEstimate = 48 * saUnit * policyTerm;
    // FAB ~₹900/1000 for 20-year endowment
    const fab = 600 * saUnit;
    maturityBenefit = sa + bonusEstimate + fab;
    deathBenefit = sa * 1.25 + bonusEstimate;
  }

  // ── MONEY BACK ──────────────────────────────────────────────────────────────
  else if (planType === 'moneyback') {
    planName = policyTerm <= 20 ? 'New Money Back (20 Yr)' : 'New Money Back (25 Yr)';
    planNo = policyTerm <= 20 ? '820' : '821';
    if (sa < 100000) { messages.push('Minimum SA is ₹1 Lakh'); valid = false; }
    if (policyTerm !== 20 && policyTerm !== 25) { messages.push('Money Back: 20 or 25 years only'); valid = false; }

    const rateTable = policyTerm <= 20 ? MONEY_BACK_20_RATES : MONEY_BACK_25_RATES;
    const rate = interpolate(age, rateTable);
    const ageLoad = age > 35 ? 1 + (age - 35) * 0.007 : 1.0;
    basePremium = rate * saUnit * femaleDiscount * smokingLoad * ageLoad;

    bonusEstimate = 42 * saUnit * policyTerm;
    const survivalPayouts = policyTerm === 20
      ? sa * 0.20 * 3  // 20% at yr 5, 10, 15
      : sa * 0.15 * 2 + sa * 0.20 * 2;  // 15% at yr5,10 + 20% at yr15,20
    maturityBenefit = sa * 0.40 + bonusEstimate + survivalPayouts;
    deathBenefit = sa + bonusEstimate;
  }

  // ── WHOLE LIFE ──────────────────────────────────────────────────────────────
  else if (planType === 'whole-life') {
    planName = 'Jeevan Umang';
    planNo = '945';
    if (sa < 200000) { messages.push('Minimum SA is ₹2 Lakhs'); valid = false; }
    if (age > 55) { messages.push('Maximum entry age: 55 years'); valid = false; }
    if (![15, 20, 25, 30].includes(premiumTerm)) { messages.push('PPT must be 15, 20, 25 or 30 years'); valid = false; }

    const pptKey = [15, 20, 25, 30].reduce((prev, curr) =>
      Math.abs(curr - premiumTerm) < Math.abs(prev - premiumTerm) ? curr : prev);
    const rateTable = WHOLE_LIFE_RATES[pptKey] || WHOLE_LIFE_RATES[20];
    const rate = interpolate(age, rateTable);
    basePremium = rate * saUnit * femaleDiscount * smokingLoad;

    bonusEstimate = 48 * saUnit * premiumTerm;
    // Annual survival benefit = 8% SA after PPT till maturity (age 100)
    const survivalYears = Math.max(0, 100 - age - premiumTerm);
    const annualSurvival = sa * 0.08;
    maturityBenefit = sa + bonusEstimate + annualSurvival * survivalYears * 0.5;
    deathBenefit = sa + bonusEstimate;
  }

  // ── CHILDREN ────────────────────────────────────────────────────────────────
  else if (planType === 'children') {
    planName = 'Jeevan Tarun';
    planNo = '834';
    if (age > 12) { messages.push('Child entry age: 0–12 years'); valid = false; }
    if (sa < 75000) { messages.push('Minimum SA: ₹75,000'); valid = false; }

    const rate = interpolate(age, CHILDREN_RATES);
    basePremium = rate * saUnit * femaleDiscount;
    bonusEstimate = 44 * saUnit * policyTerm;
    maturityBenefit = sa + bonusEstimate;
    deathBenefit = sa + bonusEstimate;
  }

  // ── PENSION ─────────────────────────────────────────────────────────────────
  else if (planType === 'pension') {
    planName = 'Jeevan Shanti';
    planNo = '850';
    if (age < 30) { messages.push('Minimum entry age for pension: 30 years'); valid = false; }
    if (sa < 150000) { messages.push('Minimum purchase price: ₹1.5 Lakhs'); valid = false; }

    // For deferred annuity: annual pension = purchase_price * 7.5%
    basePremium = 0; // Single premium plan
    const annuityRate = 0.075;
    maturityBenefit = sa * annuityRate; // annual pension amount
    deathBenefit = sa; // return of purchase price
    bonusEstimate = 0;
    messages.push('ℹ️ Jeevan Shanti is a single premium plan — SA shown is the purchase price');
  }

  // ── ULIP ────────────────────────────────────────────────────────────────────
  else if (planType === 'ulip') {
    planName = 'SIIP (Samridhi Plus)';
    planNo = '852';
    if (sa < 300000) { messages.push('Minimum annual premium: ₹30,000'); valid = false; }
    if (age > 60) { messages.push('Maximum entry age: 60 years'); valid = false; }
    if (policyTerm < 10) { messages.push('Minimum policy term: 10 years'); valid = false; }

    basePremium = sa; // SA treated as annual premium for ULIP
    // Assume 10% growth rate on accumulated premium
    const growthRate = 0.10;
    maturityBenefit = basePremium * ((Math.pow(1 + growthRate, policyTerm) - 1) / growthRate) * 0.85;
    deathBenefit = Math.max(10 * basePremium, maturityBenefit * 1.05);
    bonusEstimate = 0;
  }

  // Default
  else {
    basePremium = 50 * saUnit;
    planName = 'Standard Plan';
    planNo = '---';
    maturityBenefit = sa;
    deathBenefit = sa;
  }

  // GST on base premium (4.5% first year, 2.25% thereafter — approximated as 2.5% avg)
  const gst = planType !== 'pension' ? basePremium * 0.025 : 0;
  const annualPremium = Math.round(basePremium + gst + riderPremium + riderGst);
  const totalPremiumPaid = annualPremium * premiumTerm;

  // Tax savings under 80C (max ₹1.5L deduction)
  const taxSaving = Math.min(annualPremium, 150000) * 0.30; // at 30% tax bracket

  // Surplus
  const surplusGain = planType === 'term' ? 0 : Math.max(0, maturityBenefit - totalPremiumPaid);

  // ROI %
  const roi = totalPremiumPaid > 0 && maturityBenefit > 0
    ? ((maturityBenefit / totalPremiumPaid - 1) * 100)
    : 0;

  // Break-even year
  let breakEvenYear = premiumTerm;
  for (let y = 1; y <= policyTerm; y++) {
    if (annualPremium * Math.min(y, premiumTerm) >= maturityBenefit * (y / policyTerm)) {
      breakEvenYear = y;
      break;
    }
  }

  // Projections
  const projections: YearlyProjection[] = [];
  const annualBonus = planType !== 'term' && planType !== 'ulip' && planType !== 'pension'
    ? (48 * saUnit) : 0;
  for (let y = 1; y <= policyTerm; y++) {
    const premPaid = annualPremium * Math.min(y, premiumTerm);
    const bonusAccrued = annualBonus * y;
    const svFactor = y >= 3 ? 0.30 + (y / policyTerm) * 0.40 : 0;
    const sv = y >= 3 ? premPaid * svFactor : 0;
    projections.push({
      year: y,
      premiumPaid: Math.round(premPaid),
      bonusAccrued: Math.round(bonusAccrued),
      surrenderValue: Math.round(sv),
      deathBenefit: Math.round(deathBenefit + bonusAccrued),
    });
  }

  // Mode instalments
  const premByMode = {
    annual: Math.round(annualPremium),
    halfYearly: Math.round(modeInstalment('half-yearly', annualPremium)),
    quarterly: Math.round(modeInstalment('quarterly', annualPremium)),
    monthly: Math.round(modeInstalment('monthly', annualPremium)),
    daily: Math.round(annualPremium / 365),
  };

  // AI insight
  const aiInsight = generateInsight(input, annualPremium, maturityBenefit, surplusGain, roi);

  // Human summary
  const humanSummary = generateHumanSummary(input, premByMode.monthly, maturityBenefit, deathBenefit, planType);

  return {
    planName, planNo, basePremium: Math.round(basePremium), annualPremium, riderPremium: Math.round(riderPremium),
    gst: Math.round(gst), totalAnnualPremium: annualPremium, premiumByMode: premByMode,
    totalPremiumPaid: Math.round(totalPremiumPaid), maturityBenefit: Math.round(maturityBenefit),
    deathBenefit: Math.round(deathBenefit), bonusEstimate: Math.round(bonusEstimate),
    taxSaving: Math.round(taxSaving), surplusGain: Math.round(surplusGain), roi: Math.round(roi * 10) / 10,
    breakEvenYear, isValid: valid, validationMessages: messages, projections, aiInsight, humanSummary,
  };
}

function generateInsight(input: CalcInput, annual: number, maturity: number, surplus: number, roi: number): string {
  const incomeRatio = (annual / input.annualIncome * 100).toFixed(1);
  const roiRound = Math.round(roi * 10) / 10;
  if (input.planType === 'term') {
    return `✅ This premium is ${incomeRatio}% of your annual income — ideal allocation for term insurance is 3–5%. Your family gets ₹${(input.sumAssured / 100000).toFixed(0)}L tax-free if something happens to you.`;
  }
  if (roiRound > 6) return `📈 This plan gives ~${roiRound}% effective annual return on premium — better than most FDs. Your surplus gain is ₹${(surplus / 100000).toFixed(1)}L over ${input.policyTerm} years.`;
  if (roiRound > 4) return `🧮 This plan returns ~${roiRound}% p.a. while also providing ₹${(input.sumAssured / 100000).toFixed(0)}L life cover throughout. Good for conservative investors.`;
  return `💡 Premium is ${incomeRatio}% of income. Consider increasing Sum Assured for better protection-to-income ratio.`;
}

function generateHumanSummary(input: CalcInput, monthly: number, maturity: number, death: number, type: PlanType): string {
  const m = (v: number) => `₹${(v / 100000).toFixed(1)}L`;
  if (type === 'term') return `You pay just ₹${monthly.toLocaleString()}/month. Your family will receive ${m(death)} if something happens to you — that's pure protection at the lowest cost.`;
  if (type === 'pension') return `You invest ${m(input.sumAssured)} as a one-time payment and receive ${m(maturity)}/year as pension for life — completely tax-free income.`;
  if (type === 'ulip') return `You invest ₹${monthly.toLocaleString()}/month in market-linked funds. Your estimated corpus at maturity is ${m(maturity)} based on 10% growth assumption.`;
  return `You pay ₹${monthly.toLocaleString()}/month and get back approximately ${m(maturity)} at the end of ${input.policyTerm} years — that's your money growing safely!`;
}

// ── AI Plan Recommendation ───────────────────────────────────────────────────

export function getRecommendations(input: Partial<CalcInput>): PlanRecommendation[] {
  const age = input.age || 30;
  const goal = input.goal || 'savings';
  const income = input.annualIncome || 600000;
  const recs: PlanRecommendation[] = [];

  const goalMap: Record<Goal, PlanRecommendation[]> = {
    protection: [
      { planType: 'term', planName: 'Jeevan Amar', reason: 'Maximum life cover at lowest cost', score: 98, emoji: '🛡️' },
      { planType: 'endowment', planName: 'Jeevan Anand', reason: 'Savings + lifelong protection combo', score: 82, emoji: '💎' },
    ],
    savings: [
      { planType: 'endowment', planName: 'Jeevan Labh', reason: 'Limited premium, maximum savings', score: 92, emoji: '💰' },
      { planType: 'moneyback', planName: 'Money Back 20yr', reason: 'Periodic cash back + protection', score: 85, emoji: '💵' },
    ],
    child: [
      { planType: 'children', planName: 'Jeevan Tarun', reason: 'Designed for child education goals', score: 96, emoji: '👶' },
      { planType: 'endowment', planName: 'Jeevan Lakshya', reason: 'Income benefit on parent\'s death', score: 88, emoji: '🎓' },
    ],
    retirement: [
      { planType: 'pension', planName: 'Jeevan Shanti', reason: 'Guaranteed pension for lifetime', score: 95, emoji: '👴' },
      { planType: 'whole-life', planName: 'Jeevan Umang', reason: 'Annual income after premium term', score: 88, emoji: '♾️' },
    ],
    tax: [
      { planType: 'endowment', planName: 'Jeevan Anand', reason: '80C + 10(10D) dual tax benefits', score: 90, emoji: '📉' },
      { planType: 'ulip', planName: 'SIIP', reason: 'Market returns + tax-free maturity', score: 82, emoji: '📈' },
    ],
    wealth: [
      { planType: 'ulip', planName: 'SIIP (Samridhi Plus)', reason: 'Market-linked growth potential', score: 93, emoji: '📈' },
      { planType: 'whole-life', planName: 'Jeevan Umang', reason: 'Lifelong income stream', score: 86, emoji: '♾️' },
    ],
    marriage: [
      { planType: 'moneyback', planName: 'Money Back 25yr', reason: 'Lump sum payout at right time', score: 90, emoji: '💍' },
      { planType: 'endowment', planName: 'Jeevan Lakshya', reason: 'Goal-based savings plan', score: 84, emoji: '🎯' },
    ],
  };

  const baseRecs = goalMap[goal as Goal] || goalMap.savings;

  // Age-based adjustments
  if (age < 25) {
    recs.push({ planType: 'term', planName: 'Tech Term', reason: 'Cheapest premiums at young age — lock in now!', score: 99, emoji: '⚡' });
  }
  if (age > 50) {
    recs.push({ planType: 'pension', planName: 'Jeevan Akshay VII', reason: 'Immediate pension — ideal for near-retirement', score: 94, emoji: '🏦' });
  }

  return [...recs, ...baseRecs].slice(0, 3);
}

// ── Format helpers ───────────────────────────────────────────────────────────

export function formatINR(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export const PLAN_LIMITS: Record<PlanType, { minAge: number; maxAge: number; minSA: number; minTerm: number; maxTerm: number }> = {
  term:       { minAge: 18, maxAge: 65, minSA: 2500000,  minTerm: 10, maxTerm: 40 },
  endowment:  { minAge: 18, maxAge: 50, minSA: 100000,   minTerm: 15, maxTerm: 35 },
  moneyback:  { minAge: 13, maxAge: 50, minSA: 100000,   minTerm: 20, maxTerm: 25 },
  'whole-life':{ minAge: 0, maxAge: 55, minSA: 200000,   minTerm: 15, maxTerm: 30 },
  pension:    { minAge: 30, maxAge: 100, minSA: 150000,  minTerm: 1,  maxTerm: 1  },
  ulip:       { minAge: 0, maxAge: 60,  minSA: 300000,   minTerm: 10, maxTerm: 25 },
  children:   { minAge: 0, maxAge: 12,  minSA: 75000,    minTerm: 13, maxTerm: 25 },
};
