// ─── LIC Plan Type System ────────────────────────────────────────────────────
// Centralized, scalable, API-ready type definitions for the LIC plan ecosystem.
// Used across: calculator, comparison, reports, history, AI recommendations.

// ── Enums & Literal Types ────────────────────────────────────────────────────

export type PlanCategory =
  | 'term'
  | 'endowment'
  | 'moneyback'
  | 'whole-life'
  | 'pension'
  | 'ulip'
  | 'children'
  | 'health';

export type PremiumMode = 'annual' | 'half-yearly' | 'quarterly' | 'monthly';

export type PayoutType =
  | 'lump-sum'       // Endowment-style: full payout at maturity
  | 'periodic'       // Money Back: survival payouts at intervals
  | 'annuity'        // Pension: regular income stream
  | 'market-linked'  // ULIP: fund-value dependent
  | 'none';          // Term / Health: no maturity payout

export type RiskType =
  | 'pure-protection' // Term plans
  | 'savings'         // Endowment, Money Back, Whole Life
  | 'investment'      // ULIP
  | 'pension'         // Pension / Annuity
  | 'health';         // Health plans

export type Gender = 'male' | 'female';

// ── Rider Configuration ──────────────────────────────────────────────────────

export interface Rider {
  id: string;
  name: string;
  shortName: string;
  description: string;
  /** Premium rate per ₹1,000 Sum Assured */
  ratePerThousand: number;
  /** Minimum entry age for this rider */
  minAge: number;
  /** Maximum entry age for this rider */
  maxAge: number;
  /** Whether this rider is available for the plan */
  available: boolean;
}

// ── Bonus Configuration ──────────────────────────────────────────────────────

export interface BonusConfig {
  /** Whether bonuses apply to this plan */
  eligible: boolean;
  /** Simple Reversionary Bonus rate per ₹1,000 SA per year */
  reversionaryRate: number;
  /** Final Additional Bonus rate per ₹1,000 SA */
  fabRate: number;
  /** Loyalty addition rate (for ULIPs, etc.) — % of fund value */
  loyaltyRate: number;
  /** Guaranteed additions per ₹1,000 SA per year (non-participating plans) */
  guaranteedAdditionRate: number;
}

// ── Surrender Configuration ──────────────────────────────────────────────────

export interface SurrenderConfig {
  /** Whether surrender is allowed */
  allowed: boolean;
  /** Minimum policy years before surrender is possible */
  minYearsForSurrender: number;
  /** Guaranteed Surrender Value factor — multiplied by total premiums paid */
  gsvFactor: number;
  /** Special Surrender Value factor — multiplied by (premiums + bonus) */
  ssvFactor: number;
}

// ── Maturity Configuration ───────────────────────────────────────────────────

export interface MaturityConfig {
  /** Formula type for maturity benefit computation */
  formula: 'sa+bonus+fab' | 'sa+bonus' | 'none' | 'annuity' | 'fund-value' | 'custom';
  /** Death benefit multiplier on SA (e.g. 1.25 = 125% of SA) */
  deathBenefitMultiplier: number;
  /** Survival payout schedule (for Money Back / periodic plans) */
  survivalPayouts: SurvivalPayout[];
  /** Annual survival benefit % of SA (e.g. 8% for Jeevan Umang) */
  annualSurvivalPercent: number;
  /** ULIP assumed growth rate for projections */
  assumedGrowthRate: number;
  /** Pension annuity rate (% of purchase price) */
  annuityRate: number;
}

export interface SurvivalPayout {
  /** Year at which survival benefit is paid */
  year: number;
  /** Percentage of Sum Assured */
  percent: number;
}

// ── Premium Rate Entry ───────────────────────────────────────────────────────

export interface PremiumRateEntry {
  age: number;
  rate: number; // per ₹1,000 SA per year
}

/** Linearly interpolates a rate from a PremiumRateEntry table by age */
export function interpolateRate(age: number, table: PremiumRateEntry[]): number {
  if (!table || table.length === 0) return 50;
  if (age <= table[0].age) return table[0].rate;
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i], b = table[i + 1];
    if (age >= a.age && age < b.age) return a.rate + (b.rate - a.rate) * ((age - a.age) / (b.age - a.age));
  }
  return table[table.length - 1].rate;
}

// ── Term Option ──────────────────────────────────────────────────────────────

export interface TermOption {
  policyTerm: number;
  premiumTerm: number;
  /** Optional base rate override for this specific term combo */
  baseRateOverride?: number;
}

// ── Plan Validation Rules ────────────────────────────────────────────────────

export interface PlanValidation {
  minAge: number;
  maxAge: number;
  minSumAssured: number;
  maxSumAssured: number;    // 0 = no upper limit
  minTerm: number;
  maxTerm: number;
  /** Specific allowed terms (e.g. [20, 25] for Money Back) — empty = any in range */
  allowedTerms: number[];
  /** Specific allowed premium terms — empty = same as policy term */
  allowedPremiumTerms: number[];
  /** Allowed payment frequencies */
  allowedModes: PremiumMode[];
  /** Whether tobacco/smoking affects premium */
  smokingApplies: boolean;
}

// ── Core LIC Plan Interface ──────────────────────────────────────────────────

export interface LICPlanConfig {
  // ── Identity ───────────────────────────────────────────────
  /** Unique plan ID (kebab-case, e.g. "jeevan-anand") */
  id: string;
  /** Official LIC policy number (e.g. "815", "149") */
  policyNumber: string;
  /** Official policy name (e.g. "Jeevan Anand") */
  policyName: string;
  /** Search aliases for fuzzy matching */
  aliases: string[];
  /** Plan category */
  category: PlanCategory;
  /** Short tagline */
  tagline: string;
  /** Full description */
  description: string;
  /** Key features list */
  features: string[];
  /** Display tag (e.g. "Popular", "New", "Online") */
  tag?: string;
  /** Category emoji */
  emoji: string;

  // ── Classification ─────────────────────────────────────────
  payoutType: PayoutType;
  riskType: RiskType;

  // ── Validation ─────────────────────────────────────────────
  validation: PlanValidation;

  // ── Premium Calculation ────────────────────────────────────
  /** Premium rate table (age → rate per ₹1,000 SA/year) */
  rateTable: PremiumRateEntry[];
  /** Available term/premium-term combinations */
  termOptions: TermOption[];
  /** Age above which age-loading applies */
  ageLoadingStart: number;
  /** Loading factor per year above ageLoadingStart */
  ageLoadingFactor: number;
  /** Female discount multiplier (e.g. 0.95 = 5% discount) */
  femaleDiscount: number;
  /** Smoking/tobacco loading multiplier (e.g. 1.25 = 25% extra) */
  smokingLoading: number;
  /** GST rate (averaged, e.g. 0.025 for 2.5%) */
  gstRate: number;

  // ── Benefits ───────────────────────────────────────────────
  bonus: BonusConfig;
  surrender: SurrenderConfig;
  maturity: MaturityConfig;
  riders: Rider[];

  // ── Tax ────────────────────────────────────────────────────
  /** Whether GST is applicable */
  gstApplicable: boolean;
  /** Tax benefit sections (e.g. "80C & 10(10D)") */
  taxBenefitSections: string;

  // ── Facilities ─────────────────────────────────────────────
  loanFacility: boolean;

  // ── Display ────────────────────────────────────────────────
  /** Starting premium display string */
  startingPremium: string;
  /** Tags for search/filter (e.g. ["popular", "online", "new"]) */
  tags: string[];
}

// ── Calculator Input (plan-aware) ────────────────────────────────────────────

export interface CalcInputV2 {
  /** Selected plan config ID */
  planId: string;
  /** User's name */
  name: string;
  /** User's age */
  age: number;
  /** User's gender */
  gender: Gender;
  /** Tobacco/smoking status */
  smoking: boolean;
  /** Annual income */
  annualIncome: number;
  /** Sum Assured */
  sumAssured: number;
  /** Selected policy term */
  policyTerm: number;
  /** Selected premium paying term */
  premiumTerm: number;
  /** Payment frequency */
  paymentMode: PremiumMode;
  /** Selected rider IDs */
  selectedRiders: string[];
}

// ── Calculator Result ────────────────────────────────────────────────────────

export interface CalcResultV2 {
  /** Plan identity */
  planId: string;
  policyNumber: string;
  policyName: string;
  planCategory: PlanCategory;

  /** Premium breakdown */
  basePremium: number;
  riderPremium: number;
  gst: number;
  annualPremium: number;
  totalAnnualPremium: number;
  premiumByMode: {
    annual: number;
    halfYearly: number;
    quarterly: number;
    monthly: number;
    daily: number;
  };
  totalPremiumPaid: number;

  /** Benefits */
  maturityBenefit: number;
  deathBenefit: number;
  bonusEstimate: number;
  taxSaving: number;
  surplusGain: number;
  roi: number;
  breakEvenYear: number;

  /** Validity */
  isValid: boolean;
  validationMessages: string[];

  /** Projections */
  projections: YearlyProjection[];

  /** AI-generated content */
  aiInsight: string;
  humanSummary: string;
}

export interface YearlyProjection {
  year: number;
  premiumPaid: number;
  bonusAccrued: number;
  surrenderValue: number;
  deathBenefit: number;
}

// ── History Item (plan-aware) ────────────────────────────────────────────────

export interface CalcHistoryItemV2 {
  id: string;
  timestamp: number;
  input: CalcInputV2;
  planId: string;
  policyNumber: string;
  policyName: string;
  planCategory: PlanCategory;
  premium: number;
  maturity: number;
  deathBenefit: number;
  roi: number;
  favorite: boolean;
  aiInsight: string;
}
