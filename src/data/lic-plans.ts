import type { LICPlanConfig } from '@/types/lic-plans';

const DEFAULT_RIDERS = [
  { id: 'adb', name: 'Accidental Death Benefit', shortName: 'ADB', description: 'Extra cover for accidental death', ratePerThousand: 1.0, minAge: 18, maxAge: 65, available: true },
  { id: 'ci', name: 'Critical Illness', shortName: 'CI', description: 'Lump sum on critical illness diagnosis', ratePerThousand: 2.5, minAge: 18, maxAge: 60, available: true },
  { id: 'wop', name: 'Waiver of Premium', shortName: 'WOP', description: 'Premiums waived on disability', ratePerThousand: 0.8, minAge: 18, maxAge: 60, available: true },
];

const NO_BONUS = { eligible: false, reversionaryRate: 0, fabRate: 0, loyaltyRate: 0, guaranteedAdditionRate: 0 };
const STD_BONUS = { eligible: true, reversionaryRate: 48, fabRate: 600, loyaltyRate: 0, guaranteedAdditionRate: 0 };
const NO_SURRENDER = { allowed: false, minYearsForSurrender: 0, gsvFactor: 0, ssvFactor: 0 };
const STD_SURRENDER = { allowed: true, minYearsForSurrender: 3, gsvFactor: 0.30, ssvFactor: 0.50 };
const NO_PAYOUTS = { formula: 'none' as const, deathBenefitMultiplier: 1, survivalPayouts: [], annualSurvivalPercent: 0, assumedGrowthRate: 0, annuityRate: 0 };

export const LIC_PLANS: LICPlanConfig[] = [
  // ── Jeevan Anand (815) ─────────────────────────────────────────────────────
  {
    id: 'jeevan-anand',
    policyNumber: '815',
    policyName: 'Jeevan Anand',
    aliases: ['Jeevan Anand', '815', 'JA', 'anand', 'endowment savings'],
    category: 'endowment',
    tagline: 'Savings + whole life protection combo',
    description: 'A participating non-linked plan combining savings with lifelong protection. Life cover continues even after maturity.',
    features: ['Life cover continues beyond maturity', 'Bonus declared every year', 'Loan facility available', 'Accidental Death & Disability Benefit Rider', 'Maturity + death benefit both payable'],
    tag: 'Popular', emoji: '💎',
    payoutType: 'lump-sum', riskType: 'savings',
    validation: { minAge: 18, maxAge: 50, minSumAssured: 100000, maxSumAssured: 0, minTerm: 15, maxTerm: 35, allowedTerms: [], allowedPremiumTerms: [], allowedModes: ['annual','half-yearly','quarterly','monthly'], smokingApplies: true },
    rateTable: [
      { age: 18, rate: 52 }, { age: 25, rate: 55 }, { age: 30, rate: 59 }, { age: 35, rate: 65 },
      { age: 40, rate: 73 }, { age: 45, rate: 84 }, { age: 50, rate: 99 },
    ],
    termOptions: [
      { policyTerm: 15, premiumTerm: 15 }, { policyTerm: 20, premiumTerm: 20 },
      { policyTerm: 25, premiumTerm: 25 }, { policyTerm: 30, premiumTerm: 30 },
      { policyTerm: 35, premiumTerm: 35 },
    ],
    ageLoadingStart: 35, ageLoadingFactor: 0.008, femaleDiscount: 0.95, smokingLoading: 1.25, gstRate: 0.025,
    bonus: STD_BONUS,
    surrender: STD_SURRENDER,
    maturity: { formula: 'sa+bonus+fab', deathBenefitMultiplier: 1.25, survivalPayouts: [], annualSurvivalPercent: 0, assumedGrowthRate: 0, annuityRate: 0 },
    riders: DEFAULT_RIDERS,
    gstApplicable: true, taxBenefitSections: '80C & 10(10D)', loanFacility: true,
    startingPremium: '₹2,100/month',
    tags: ['popular', 'endowment', 'savings', 'bonus', 'loan'],
  },

  // ── Tech Term (854) ────────────────────────────────────────────────────────
  {
    id: 'tech-term',
    policyNumber: '854',
    policyName: 'Tech Term',
    aliases: ['Tech Term', '854', 'New Tech Term', 'online term', 'tech'],
    category: 'term',
    tagline: 'Affordable online term plan with high cover',
    description: 'Exclusively online non-linked pure risk plan available through LIC website. Lower premiums due to digital-only model.',
    features: ['Exclusively online – lower premiums', 'Level or Increasing cover option', 'Special rates for non-tobacco users', 'Accidental death benefit option'],
    tag: 'Online', emoji: '🛡️',
    payoutType: 'none', riskType: 'pure-protection',
    validation: { minAge: 18, maxAge: 65, minSumAssured: 5000000, maxSumAssured: 0, minTerm: 10, maxTerm: 40, allowedTerms: [], allowedPremiumTerms: [], allowedModes: ['annual','half-yearly','quarterly','monthly'], smokingApplies: true },
    rateTable: [
      { age: 18, rate: 3.8 }, { age: 25, rate: 4.2 }, { age: 30, rate: 5.5 },
      { age: 35, rate: 8.5 }, { age: 40, rate: 13.0 }, { age: 45, rate: 20.0 },
      { age: 50, rate: 30.0 }, { age: 55, rate: 44.0 }, { age: 60, rate: 64.0 }, { age: 65, rate: 92.0 },
    ],
    termOptions: [],
    ageLoadingStart: 99, ageLoadingFactor: 0, femaleDiscount: 0.95, smokingLoading: 1.30, gstRate: 0.025,
    bonus: NO_BONUS, surrender: NO_SURRENDER,
    maturity: NO_PAYOUTS,
    riders: [DEFAULT_RIDERS[0]],
    gstApplicable: true, taxBenefitSections: '80C & 10(10D)', loanFacility: false,
    startingPremium: '₹490/month',
    tags: ['online', 'term', 'affordable', 'protection'],
  },

  // ── Jeevan Labh (936) ─────────────────────────────────────────────────────
  {
    id: 'jeevan-labh',
    policyNumber: '936',
    policyName: 'Jeevan Labh',
    aliases: ['Jeevan Labh', '936', 'labh', 'limited premium', 'jeevan lab'],
    category: 'endowment',
    tagline: 'Limited premium – maximum returns',
    description: 'A limited premium paying endowment plan — pay for fewer years, get coverage and returns for longer.',
    features: ['Pay premium for shorter period', 'Simple reversionary bonus + FAB', 'Loan available from year 3', 'Surrender value after 3 years'],
    tag: 'Recommended', emoji: '💰',
    payoutType: 'lump-sum', riskType: 'savings',
    validation: { minAge: 8, maxAge: 59, minSumAssured: 200000, maxSumAssured: 0, minTerm: 16, maxTerm: 25, allowedTerms: [16, 21, 25], allowedPremiumTerms: [10, 15, 16], allowedModes: ['annual','half-yearly','quarterly','monthly'], smokingApplies: true },
    rateTable: [
      { age: 8, rate: 48 }, { age: 18, rate: 50 }, { age: 25, rate: 53 }, { age: 30, rate: 57 },
      { age: 35, rate: 63 }, { age: 40, rate: 72 }, { age: 45, rate: 83 }, { age: 55, rate: 105 },
    ],
    termOptions: [
      { policyTerm: 16, premiumTerm: 10 },
      { policyTerm: 21, premiumTerm: 15 },
      { policyTerm: 25, premiumTerm: 16 },
    ],
    ageLoadingStart: 35, ageLoadingFactor: 0.007, femaleDiscount: 0.95, smokingLoading: 1.25, gstRate: 0.025,
    bonus: STD_BONUS,
    surrender: STD_SURRENDER,
    maturity: { formula: 'sa+bonus+fab', deathBenefitMultiplier: 1.0, survivalPayouts: [], annualSurvivalPercent: 0, assumedGrowthRate: 0, annuityRate: 0 },
    riders: DEFAULT_RIDERS,
    gstApplicable: true, taxBenefitSections: '80C & 10(10D)', loanFacility: true,
    startingPremium: '₹4,850/year',
    tags: ['recommended', 'limited-premium', 'endowment', 'savings'],
  },

  // ── New Money Back 20yr (820) ──────────────────────────────────────────────
  {
    id: 'money-back-20',
    policyNumber: '820',
    policyName: 'New Money Back Plan – 20 Years',
    aliases: ['Money Back', '820', 'money back 20', 'new money back', 'moneyback 20'],
    category: 'moneyback',
    tagline: 'Periodic payouts every 5 years + bonus at maturity',
    description: 'Provides 20% of SA at years 5, 10 & 15, then full SA + bonus at maturity. Ideal for periodic income needs.',
    features: ['20% SA paid at year 5, 10, 15', 'Full SA + bonuses at maturity', 'Death benefit = full SA + bonuses', 'Loan facility available'],
    tag: 'Popular', emoji: '💵',
    payoutType: 'periodic', riskType: 'savings',
    validation: { minAge: 13, maxAge: 50, minSumAssured: 100000, maxSumAssured: 0, minTerm: 20, maxTerm: 20, allowedTerms: [20], allowedPremiumTerms: [15], allowedModes: ['annual','half-yearly','quarterly','monthly'], smokingApplies: true },
    rateTable: [
      { age: 13, rate: 75 }, { age: 20, rate: 77 }, { age: 25, rate: 79 },
      { age: 30, rate: 82 }, { age: 35, rate: 87 }, { age: 40, rate: 96 },
      { age: 45, rate: 108 }, { age: 50, rate: 126 },
    ],
    termOptions: [{ policyTerm: 20, premiumTerm: 15 }],
    ageLoadingStart: 35, ageLoadingFactor: 0.007, femaleDiscount: 0.95, smokingLoading: 1.25, gstRate: 0.025,
    bonus: { eligible: true, reversionaryRate: 42, fabRate: 400, loyaltyRate: 0, guaranteedAdditionRate: 0 },
    surrender: STD_SURRENDER,
    maturity: {
      formula: 'sa+bonus+fab',
      deathBenefitMultiplier: 1.0,
      survivalPayouts: [{ year: 5, percent: 20 }, { year: 10, percent: 20 }, { year: 15, percent: 20 }],
      annualSurvivalPercent: 0, assumedGrowthRate: 0, annuityRate: 0,
    },
    riders: DEFAULT_RIDERS,
    gstApplicable: true, taxBenefitSections: '80C & 10(10D)', loanFacility: true,
    startingPremium: '₹5,800/year',
    tags: ['popular', 'moneyback', 'periodic', 'savings'],
  },

  // ── SIIP / ULIP (852) ─────────────────────────────────────────────────────
  {
    id: 'siip',
    policyNumber: '852',
    policyName: 'SIIP (Samridhi Plus)',
    aliases: ['SIIP', '852', 'Samridhi Plus', 'ULIP', 'market linked', 'ulip plan'],
    category: 'ulip',
    tagline: 'Market-linked returns with life protection',
    description: 'Unit-linked plan with 4 fund options. Loyalty additions from year 6. Partial withdrawal allowed from year 6.',
    features: ['4 fund options: Bond, Secured, Balanced, Growth', 'Partial withdrawal from year 6', 'Loyalty additions from year 6', 'Fund switching up to 4 times/year free'],
    tag: 'Market Linked', emoji: '📈',
    payoutType: 'market-linked', riskType: 'investment',
    validation: { minAge: 0, maxAge: 60, minSumAssured: 300000, maxSumAssured: 0, minTerm: 10, maxTerm: 25, allowedTerms: [], allowedPremiumTerms: [5, 10], allowedModes: ['annual','half-yearly','quarterly','monthly'], smokingApplies: false },
    rateTable: [],
    termOptions: [
      { policyTerm: 10, premiumTerm: 5 }, { policyTerm: 15, premiumTerm: 5 },
      { policyTerm: 10, premiumTerm: 10 }, { policyTerm: 25, premiumTerm: 10 },
    ],
    ageLoadingStart: 99, ageLoadingFactor: 0, femaleDiscount: 1.0, smokingLoading: 1.0, gstRate: 0.018,
    bonus: { eligible: false, reversionaryRate: 0, fabRate: 0, loyaltyRate: 0.015, guaranteedAdditionRate: 0 },
    surrender: { allowed: true, minYearsForSurrender: 5, gsvFactor: 0, ssvFactor: 0 },
    maturity: { formula: 'fund-value', deathBenefitMultiplier: 10, survivalPayouts: [], annualSurvivalPercent: 0, assumedGrowthRate: 0.10, annuityRate: 0 },
    riders: [DEFAULT_RIDERS[0], DEFAULT_RIDERS[2]],
    gstApplicable: true, taxBenefitSections: '80C & 10(10D)', loanFacility: false,
    startingPremium: '₹30,000/year',
    tags: ['ulip', 'market-linked', 'investment', 'growth'],
  },
];

// ── Lookup maps ───────────────────────────────────────────────────────────────

export const PLAN_BY_ID = new Map(LIC_PLANS.map(p => [p.id, p]));
export const PLAN_BY_POLICY_NO = new Map(LIC_PLANS.map(p => [p.policyNumber, p]));

export function getPlanById(id: string): LICPlanConfig | undefined {
  return PLAN_BY_ID.get(id);
}

export function getPlanByPolicyNo(no: string): LICPlanConfig | undefined {
  return PLAN_BY_POLICY_NO.get(no);
}

export function getPlansByCategory(cat: string): LICPlanConfig[] {
  return cat === 'all' ? LIC_PLANS : LIC_PLANS.filter(p => p.category === cat);
}

/** Fuzzy search across name, policyNumber, aliases, tags */
export function searchPlans(query: string): LICPlanConfig[] {
  const q = query.toLowerCase().trim();
  if (!q) return LIC_PLANS;
  return LIC_PLANS.filter(p =>
    p.policyName.toLowerCase().includes(q) ||
    p.policyNumber.includes(q) ||
    p.aliases.some(a => a.toLowerCase().includes(q)) ||
    p.tags.some(t => t.includes(q)) ||
    p.category.includes(q) ||
    p.tagline.toLowerCase().includes(q)
  );
}

export const POPULAR_PLAN_IDS = ['jeevan-anand', 'tech-term', 'jeevan-labh', 'money-back-20'];

export const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  term:        { label: 'Term',       emoji: '🛡️', color: '#C8102E' },
  endowment:   { label: 'Endowment',  emoji: '💎', color: '#FFB300' },
  moneyback:   { label: 'Money Back', emoji: '💵', color: '#22c55e' },
  'whole-life':{ label: 'Whole Life', emoji: '♾️', color: '#8b5cf6' },
  pension:     { label: 'Pension',    emoji: '👴', color: '#f97316' },
  ulip:        { label: 'ULIP',       emoji: '📈', color: '#3b82f6' },
  children:    { label: 'Children',   emoji: '👶', color: '#ec4899' },
  health:      { label: 'Health',     emoji: '🏥', color: '#06b6d4' },
};
