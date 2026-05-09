'use client';
import React, { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calculator, ArrowLeft, ArrowRight, Check, User, Cigarette, DollarSign, Target, Shield, Heart, AlertCircle, Calendar, Clock, CreditCard, ChevronDown, ChevronUp, Sparkles, History } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/PageHeader';
import PlanSelector from '@/components/calculator/PlanSelector';
import ResultsDashboard from '@/components/calculator/ResultsDashboard';
import { RecommendationCard } from '@/components/calculator/InsightCards';
import { calculate, getRecommendations, PLAN_LIMITS, formatINR } from '@/lib/premium-engine';
import type { CalcInput, PlanType, Goal, Gender, PaymentMode } from '@/lib/premium-engine';
import { calculateV2, clampInputToPlan } from '@/lib/plan-engine';
import { getPlanById } from '@/data/lic-plans';
import { getSupportedRiders } from '@/lib/plan-utils';
import { validatePlan } from '@/lib/plan-validation';
import { saveCalculation } from '@/lib/calc-history';
import ReportGenerator from '@/components/calculator/ReportGenerator';

const STEPS = [
  { id: 1, title: 'Basic Details', subtitle: 'Tell us about yourself', emoji: '👤' },
  { id: 2, title: 'Financial Info', subtitle: 'Your income & goals', emoji: '💰' },
  { id: 3, title: 'Plan Preferences', subtitle: 'Choose your coverage', emoji: '🛡️' },
  { id: 4, title: 'Add-ons', subtitle: 'Optional riders', emoji: '⚙️' },
  { id: 5, title: 'Results', subtitle: 'Your premium estimate', emoji: '📊' },
];

const GOALS: { id: Goal; label: string; emoji: string }[] = [
  { id: 'protection', label: 'Family Protection', emoji: '🛡️' },
  { id: 'savings', label: 'Long-term Savings', emoji: '💰' },
  { id: 'child', label: 'Child Education', emoji: '🎓' },
  { id: 'retirement', label: 'Retirement', emoji: '👴' },
  { id: 'tax', label: 'Tax Saving', emoji: '📉' },
  { id: 'wealth', label: 'Wealth Creation', emoji: '📈' },
  { id: 'marriage', label: 'Marriage Planning', emoji: '💍' },
];

const MODES: { id: PaymentMode; label: string }[] = [
  { id: 'annual', label: 'Yearly' }, { id: 'half-yearly', label: 'Half Yearly' },
  { id: 'quarterly', label: 'Quarterly' }, { id: 'monthly', label: 'Monthly' },
];

const defaultInput: CalcInput = {
  name: '', age: 30, gender: 'male', smoking: false, annualIncome: 600000,
  goal: 'savings', planType: 'endowment', sumAssured: 1000000, policyTerm: 20,
  premiumTerm: 20, paymentMode: 'monthly',
  riders: { accidentDeath: false, criticalIllness: false, waiver: false },
};

// Selected plan ID for plan-aware calculation
const DEFAULT_PLAN_ID = 'jeevan-anand';

function CalculatorPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const T = useThemeColors();
  const { bg, surface, surface2, border, text, text2, hint, isDark } = T;
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<CalcInput>(defaultInput);
  const [selectedPlanId, setSelectedPlanId] = useState(DEFAULT_PLAN_ID);
  const [planWarnings, setPlanWarnings] = useState<string[]>([]);
  const [dir, setDir] = useState<'next'|'prev'>('next');
  const [saved, setSaved] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const didRestore = useRef(false);

  // Restore from history recalculate
  useEffect(() => {
    if (didRestore.current) return;
    const restore = searchParams.get('restore');
    if (restore) {
      try {
        const parsed = JSON.parse(restore) as CalcInput;
        setInput(parsed);
        setStep(5);
        didRestore.current = true;
      } catch {}
    }
  }, [searchParams]);

  const set = (p: Partial<CalcInput>) => {
    setInput(prev => {
      const n = { ...prev, ...p };
      if (p.planType) {
        const l = PLAN_LIMITS[p.planType as PlanType];
        if (n.age < l.minAge) n.age = l.minAge;
        if (n.age > l.maxAge) n.age = l.maxAge;
        if (n.sumAssured < l.minSA) n.sumAssured = l.minSA;
        if (n.policyTerm < l.minTerm) n.policyTerm = l.minTerm;
        if (n.policyTerm > l.maxTerm) n.policyTerm = l.maxTerm;
        if (n.premiumTerm < l.minTerm) n.premiumTerm = l.minTerm;
        if (n.premiumTerm > l.maxTerm) n.premiumTerm = l.maxTerm;
      }
      return n;
    });
  };

  const result = useMemo(() => calculate(input), [input]);
  const recs = useMemo(() => getRecommendations(input), [input.age, input.goal, input.annualIncome]);

  const goNext = () => {
    if (step < 5) { setDir('next'); setStep(s => s + 1); }
    // Auto-save when reaching results
    if (step === 4 && result.isValid && !saved) {
      saveCalculation(input, result);
      setSaved(true);
    }
  };
  const goBack = () => { if (step > 1) { setDir('prev'); setStep(s => s - 1); } };

  const limits = PLAN_LIMITS[input.planType];
  const fmt = (v: number) => v >= 10000000 ? `₹${(v/10000000).toFixed(1)}Cr` : v >= 100000 ? `₹${(v/100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  // Plan-aware derived values
  const selectedPlan = getPlanById(selectedPlanId);
  const planLimits = selectedPlan ? selectedPlan.validation : limits;
  const planMinSA = selectedPlan ? selectedPlan.validation.minSumAssured : limits.minSA;
  const planTermOptions = selectedPlan?.termOptions ?? [];
  // Dynamic riders from plan config
  const planRiders = getSupportedRiders(selectedPlanId, input.age);
  // Full validation report from plan-validation engine
  const validationReport = validatePlan(selectedPlanId, {
    age: input.age,
    sumAssured: input.sumAssured,
    policyTerm: input.policyTerm,
    premiumTerm: input.premiumTerm,
    paymentMode: input.paymentMode as any,
    annualIncome: input.annualIncome,
  });
  const eligibility = {
    eligible: validationReport.isValid,
    errors: validationReport.errors.map(e => e.message),
    warnings: validationReport.warnings.map(w => w.message),
  };

  // shared styles
  const labelS: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: text2, letterSpacing: '0.5px', marginBottom: 6, display: 'block', textTransform: 'uppercase' };
  const inputS: React.CSSProperties = { width: '100%', background: surface2, border: `1.5px solid ${border}`, borderRadius: 12, padding: '12px 14px', color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
  const sliderS: React.CSSProperties = { width: '100%', accentColor: '#C8102E', cursor: 'pointer', height: 6 };

  const chipBtn = (active: boolean, gradient: string): React.CSSProperties => ({
    padding: '10px 16px', borderRadius: 14, border: active ? 'none' : `1.5px solid ${border}`,
    background: active ? gradient : surface2, color: active ? '#fff' : text,
    fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: active ? '0 3px 12px rgba(200,16,46,0.25)' : 'none',
  });

  const toggleBtn = (on: boolean, color: string): React.CSSProperties => ({
    width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', position: 'relative',
    background: on ? `linear-gradient(90deg,${color},${color}90)` : isDark ? '#334155' : '#e2e8f0',
    transition: 'background 0.3s', flexShrink: 0,
  });

  const toggleDot = (on: boolean): React.CSSProperties => ({
    position: 'absolute', top: 3, left: on ? 22 : 3, width: 20, height: 20,
    borderRadius: '50%', background: '#fff', transition: 'left 0.3s',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  });

  return (
    <DashboardShell>
      <div suppressHydrationWarning style={{ minHeight: '100vh', background: bg, color: text, fontFamily: 'Inter,sans-serif', transition: 'background 0.3s' }}>
        <style>{`
          @keyframes slideInRight{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:none}}
          @keyframes slideInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:none}}
          .step-next{animation:slideInRight 0.35s ease}
          .step-prev{animation:slideInLeft 0.35s ease}
          input[type=range]{-webkit-appearance:none;appearance:none;height:6px;border-radius:3px;background:${isDark?'#334155':'#E2E8F0'};outline:none;}
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#C8102E,#a00d24);cursor:pointer;box-shadow:0 2px 8px rgba(200,16,46,0.35);}
          input[type=range]::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#C8102E,#a00d24);cursor:pointer;border:none;}
          @media(max-width:700px){.calc-wizard-card{margin:0 8px!important;}}
        `}</style>

        <PageHeader>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={() => router.back()} style={{ width:34,height:34,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text }}>
              <ArrowLeft size={15}/>
            </button>
            <div>
              <h1 style={{ fontSize:17,fontWeight:800,lineHeight:1,color:text }}>Premium Calculator</h1>
              <p style={{ fontSize:11,color:hint,marginTop:2 }}>Step {step} of 5 · {STEPS[step-1].title}</p>
            </div>
          </div>
          <div style={{ display:'flex',alignItems:'center',gap:8 }}>
            <button onClick={() => router.push('/calculator/history')} style={{ width:34,height:34,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text2 }} title="History">
              <History size={15}/>
            </button>
            <div style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:20,background:'linear-gradient(135deg,#C8102E,#a00d24)',color:'#fff',fontSize:12,fontWeight:700 }}>
              <Calculator size={14}/> Live
            </div>
          </div>
        </PageHeader>

        <div style={{ maxWidth:640,margin:'0 auto',padding:'20px 16px 100px' }}>

          {/* ── Progress Bar ── */}
          <div style={{ display:'flex',alignItems:'center',gap:0,marginBottom:28,padding:'0 4px' }}>
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <React.Fragment key={s.id}>
                  <button onClick={() => { setDir(s.id > step ? 'next' : 'prev'); setStep(s.id); }}
                    style={{
                      width:36,height:36,borderRadius:'50%',border:'none',cursor:'pointer',flexShrink:0,
                      display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,
                      background: done ? 'linear-gradient(135deg,#22c55e,#16a34a)' : active ? 'linear-gradient(135deg,#C8102E,#a00d24)' : surface2,
                      color: done || active ? '#fff' : text2,
                      boxShadow: active ? '0 3px 12px rgba(200,16,46,0.35)' : 'none',
                      transition:'all 0.3s',
                    }}>
                    {done ? <Check size={16}/> : s.emoji}
                  </button>
                  {i < STEPS.length-1 && (
                    <div style={{ flex:1,height:3,borderRadius:2,background:step > s.id ? '#22c55e' : isDark ? '#334155' : '#E2E8F0',transition:'background 0.3s',margin:'0 4px' }}/>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* ── Step Content ── */}
          <div key={step} className={dir === 'next' ? 'step-next' : 'step-prev'}
            style={{ background:surface, border:`1px solid ${border}`, borderRadius:22, padding:'28px 24px', transition:'background 0.3s', marginBottom:20 }}>

            <div style={{ marginBottom:22 }}>
              <h2 style={{ fontSize:20,fontWeight:800,color:text,marginBottom:4 }}>{STEPS[step-1].emoji} {STEPS[step-1].title}</h2>
              <p style={{ fontSize:13,color:text2 }}>{STEPS[step-1].subtitle}</p>
            </div>

            {/* ��� STEP 1: Basic Details ��� */}
            {step === 1 && (
              <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                <div>
                  <label style={labelS}>Your Age</label>
                  <div style={{ display:'flex',alignItems:'center',gap:14 }}>
                    <input type="range" min={0} max={80} value={input.age} onChange={e => set({ age:+e.target.value })} style={{ ...sliderS, flex:1 }}/>
                    <div style={{ width:52,height:44,borderRadius:12,background:surface2,border:`1.5px solid ${border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:800,color:'#C8102E' }}>
                      {input.age}
                    </div>
                  </div>
                </div>
                <div>
                  <label style={labelS}>Gender</label>
                  <div style={{ display:'flex',gap:10 }}>
                    {(['male','female'] as Gender[]).map(g => (
                      <button key={g} onClick={() => set({gender:g})} style={{
                        ...chipBtn(input.gender===g, g==='male' ? 'linear-gradient(135deg,#3B82F6,#1D4ED8)' : 'linear-gradient(135deg,#EC4899,#BE185D)'),
                        flex:1, textAlign:'center',
                      }}>
                        {g==='male' ? '♂ Male' : '♀ Female'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderRadius:14,background:surface2,border:`1px solid ${border}` }}>
                  <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                    <Cigarette size={16} color={input.smoking ? '#EF4444' : hint}/>
                    <span style={{ fontSize:14,fontWeight:600,color:text }}>Tobacco / Smoker</span>
                  </div>
                  <button onClick={() => set({smoking:!input.smoking})} style={toggleBtn(input.smoking,'#EF4444')}>
                    <span style={toggleDot(input.smoking)}/>
                  </button>
                </div>
              </div>
            )}

            {/* ��� STEP 2: Financial Details ��� */}
            {step === 2 && (
              <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <label style={labelS}>Annual Income</label>
                    <span style={{ fontSize:15,fontWeight:800,color:'#C8102E' }}>{fmt(input.annualIncome)}</span>
                  </div>
                  <input type="range" min={200000} max={10000000} step={50000} value={input.annualIncome} onChange={e => set({annualIncome:+e.target.value})} style={sliderS}/>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:hint,marginTop:4 }}>
                    <span>₹2L</span><span>₹1Cr</span>
                  </div>
                </div>
                <div>
                  <label style={labelS}>Your Goal</label>
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                    {GOALS.map(g => (
                      <button key={g.id} onClick={() => set({goal:g.id})} style={{
                        padding:'9px 14px',borderRadius:20,border:input.goal===g.id?'none':`1.5px solid ${border}`,
                        background:input.goal===g.id?'linear-gradient(135deg,#C8102E,#a00d24)':surface2,
                        color:input.goal===g.id?'#fff':text,fontSize:12,fontWeight:600,cursor:'pointer',
                        transition:'all 0.2s',whiteSpace:'nowrap',
                        boxShadow:input.goal===g.id?'0 3px 10px rgba(200,16,46,0.3)':'none',
                      }}>
                        {g.emoji} {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ��� STEP 3: Plan Selection & Preferences ��� */}
            {step === 3 && (
              <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                {/* Plan Selector — full featured */}
                <div>
                  <label style={labelS}>Search & Select Policy</label>
                  <PlanSelector
                    value={selectedPlanId}
                    onChange={(id, plan) => {
                      setSelectedPlanId(id);
                      const v = plan.validation;
                      set({
                        planType: plan.category as PlanType,
                        sumAssured: Math.max(v.minSumAssured, input.sumAssured),
                        policyTerm: v.allowedTerms.length > 0 ? v.allowedTerms[0] : Math.max(v.minTerm, Math.min(v.maxTerm, input.policyTerm)),
                        premiumTerm: plan.termOptions[0]?.premiumTerm ?? v.minTerm,
                        paymentMode: v.allowedModes.includes(input.paymentMode as any) ? input.paymentMode : v.allowedModes[0] as PaymentMode,
                      });
                    }}
                    isDark={isDark} surface={surface} surface2={surface2}
                    border={border} text={text} text2={text2} hint={hint}
                  />
                </div>

                {/* Eligibility errors/warnings */}
                {eligibility.errors.length > 0 && (
                  <div style={{ padding:'12px 14px', borderRadius:12, background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)' }}>
                    {eligibility.errors.map((e, i) => (
                      <div key={i} style={{ fontSize:12, color:'#EF4444', display:'flex', gap:6, alignItems:'flex-start', marginBottom: i < eligibility.errors.length-1 ? 4 : 0 }}>
                        <span>⚠️</span><span>{e}</span>
                      </div>
                    ))}
                  </div>
                )}
                {eligibility.warnings.length > 0 && (
                  <div style={{ padding:'10px 14px', borderRadius:12, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)' }}>
                    {eligibility.warnings.map((w, i) => (
                      <div key={i} style={{ fontSize:11, color:'#F59E0B', display:'flex', gap:6, alignItems:'flex-start', marginBottom: i < eligibility.warnings.length-1 ? 4 : 0 }}>
                        <span>ℹ️</span><span>{w}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sum Assured */}
                <div>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <label style={labelS}>Sum Assured</label>
                    <span style={{ fontSize:15,fontWeight:800,color:'#C8102E' }}>{fmt(input.sumAssured)}</span>
                  </div>
                  <input type="range"
                    min={planMinSA}
                    max={Math.max(planMinSA*20, 20000000)}
                    step={planMinSA < 200000 ? 25000 : 500000}
                    value={input.sumAssured}
                    onChange={e => set({sumAssured:+e.target.value})}
                    style={sliderS}/>
                  <div style={{ display:'flex',justifyContent:'space-between',fontSize:10,color:hint,marginTop:4 }}>
                    <span>{fmt(planMinSA)}</span><span>{fmt(Math.max(planMinSA*20,20000000))}</span>
                  </div>
                </div>

                {/* Term options — show combos if plan has them, else free input */}
                {planTermOptions.length > 0 ? (
                  <div>
                    <label style={labelS}>Policy Term</label>
                    <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                      {planTermOptions.map(opt => (
                        <button key={opt.policyTerm} onClick={() => set({policyTerm:opt.policyTerm,premiumTerm:opt.premiumTerm})} style={{
                          padding:'9px 14px',borderRadius:10,fontSize:12,fontWeight:700,cursor:'pointer',
                          border:input.policyTerm===opt.policyTerm?'none':`1.5px solid ${border}`,
                          background:input.policyTerm===opt.policyTerm?'linear-gradient(135deg,#C8102E,#a00d24)':surface2,
                          color:input.policyTerm===opt.policyTerm?'#fff':text,transition:'all 0.2s',
                        }}>
                          {opt.policyTerm}yr<span style={{ fontSize:10, opacity:0.8, marginLeft:4 }}>({opt.premiumTerm}yr PPT)</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
                    <div>
                      <label style={labelS}>Policy Term (Yrs)</label>
                      <input type="number" min={planLimits.minTerm} max={planLimits.maxTerm} value={input.policyTerm} onChange={e => set({policyTerm:Math.max(planLimits.minTerm,Math.min(planLimits.maxTerm,+e.target.value))})} style={inputS}/>
                    </div>
                    <div>
                      <label style={labelS}>Premium Term (Yrs)</label>
                      <input type="number" min={planLimits.minTerm} max={planLimits.maxTerm} value={input.premiumTerm} onChange={e => set({premiumTerm:Math.max(planLimits.minTerm,Math.min(planLimits.maxTerm,+e.target.value))})} style={inputS}/>
                    </div>
                  </div>
                )}

                {/* Payment Frequency — only show modes allowed by plan */}
                <div>
                  <label style={labelS}>Payment Frequency</label>
                  <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
                    {MODES.filter(m => !selectedPlan || selectedPlan.validation.allowedModes.includes(m.id)).map(m => (
                      <button key={m.id} onClick={() => set({paymentMode:m.id})} style={{
                        padding:'10px 4px',borderRadius:10,fontSize:11,fontWeight:700,cursor:'pointer',
                        border:input.paymentMode===m.id?'none':`1.5px solid ${border}`,
                        background:input.paymentMode===m.id?'linear-gradient(135deg,#FFB300,#F59E0B)':surface2,
                        color:input.paymentMode===m.id?'#fff':text,transition:'all 0.2s',
                      }}>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendations from validation engine */}
                {validationReport.recommendations.length > 0 && (
                  <div style={{ padding:'12px 14px', borderRadius:12, background: isDark?'rgba(34,197,94,0.06)':'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.2)' }}>
                    <div style={{ fontSize:10, fontWeight:700, color:'#22c55e', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>💡 Suggestions</div>
                    {validationReport.recommendations.map((r, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom: i < validationReport.recommendations.length-1 ? 6 : 0 }}>
                        <span style={{ fontSize:11, color:'#22c55e', flexShrink:0, marginTop:1 }}>→</span>
                        <span style={{ fontSize:11, color:text2, lineHeight:1.5 }}>
                          {r.message}
                          {r.suggestedValue !== undefined && (
                            <strong style={{ color:'#22c55e', marginLeft:4 }}>
                              {typeof r.suggestedValue === 'number' ? fmt(r.suggestedValue) : r.suggestedValue}
                            </strong>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ��� STEP 4: Riders ��� */}
            {step === 4 && (
              <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
                {/* Plan identity reminder */}
                {selectedPlan && (
                  <div style={{ padding:'10px 14px', borderRadius:12, background: isDark?'rgba(139,92,246,0.06)':'rgba(139,92,246,0.04)', border:'1px solid rgba(139,92,246,0.15)', display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>{selectedPlan.emoji}</span>
                    <div>
                      <div style={{ fontSize:12, fontWeight:700, color:'#8B5CF6' }}>{selectedPlan.policyName}</div>
                      <div style={{ fontSize:10, color:text2 }}>Plan No. {selectedPlan.policyNumber} · Select add-on riders below</div>
                    </div>
                  </div>
                )}

                {/* Dynamic riders from plan config */}
                {planRiders.length > 0 ? planRiders.map(r => {
                  const isOn = input.riders[r.id as keyof typeof input.riders] ?? false;
                  const RIDER_COLORS: Record<string, string> = { adb:'#3B82F6', ci:'#EC4899', wop:'#F59E0B' };
                  const color = RIDER_COLORS[r.id] ?? '#8B5CF6';
                  return (
                    <div key={r.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderRadius:16,background:surface2,border:`1px solid ${isOn ? color+'40' : border}`,transition:'all 0.2s' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0 }}>
                        <div style={{ width:38,height:38,borderRadius:12,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18 }}>
                          {r.id==='adb'?'🛡️':r.id==='ci'?'��️':r.id==='wop'?'⚠️':'➕'}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontSize:13,fontWeight:700,color:text }}>{r.name}</div>
                          <div style={{ fontSize:11,color:text2,marginTop:2,lineHeight:1.4 }}>{r.description}</div>
                          <div style={{ fontSize:10,color:color,marginTop:3,fontWeight:600 }}>+₹{(r.ratePerThousand * input.sumAssured / 1000).toLocaleString('en-IN')}/yr</div>
                        </div>
                      </div>
                      <button
                        onClick={() => set({riders:{...input.riders,[r.id]:!isOn}})}
                        style={{ width:46,height:26,borderRadius:13,border:'none',cursor:'pointer',position:'relative',background:isOn?`linear-gradient(90deg,${color},${color}90)`:isDark?'#334155':'#e2e8f0',transition:'background 0.3s',flexShrink:0,marginLeft:12 }}>
                        <span style={{ position:'absolute',top:3,left:isOn?22:3,width:20,height:20,borderRadius:'50%',background:'#fff',transition:'left 0.3s',boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }}/>
                      </button>
                    </div>
                  );
                }) : (
                  <div style={{ padding:'20px',textAlign:'center',color:hint,fontSize:13,background:surface2,borderRadius:14,border:`1px solid ${border}` }}>
                    No riders available for this plan
                  </div>
                )}

                <div style={{ padding:'14px 18px',borderRadius:14,background:isDark?'rgba(139,92,246,0.06)':'rgba(139,92,246,0.04)',border:'1px solid rgba(139,92,246,0.15)' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:4 }}>
                    <Sparkles size={12} color="#8B5CF6"/>
                    <span style={{ fontSize:11,fontWeight:700,color:'#8B5CF6' }}>TIP</span>
                  </div>
                  <p style={{ fontSize:12,color:text2,lineHeight:1.6 }}>Riders add a small extra cost but significantly enhance your coverage. Accidental Death Benefit is highly recommended for earning members.</p>
                </div>
              </div>
            )}

            {step === 5 && (
              <div style={{ display:'flex',flexDirection:'column',gap:20 }}>
                {/* Export Report button */}
                <div style={{ display:'flex',gap:10 }}>
                  <button onClick={() => setShowReport(true)} style={{
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px',flex:1,
                    borderRadius:14,border:'none',background:'linear-gradient(135deg,#8B5CF6,#6D28D9)',
                    color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
                    boxShadow:'0 4px 16px rgba(139,92,246,0.35)',transition:'all 0.2s',
                  }}>
                    📄 Export Report
                  </button>
                  <button onClick={() => router.push('/calculator/compare')} style={{
                    display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'13px',flex:1,
                    borderRadius:14,border:'none',background:'linear-gradient(135deg,#F59E0B,#D97706)',
                    color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',
                    boxShadow:'0 4px 16px rgba(245,158,11,0.35)',transition:'all 0.2s',
                  }}>
                    ⚖️ Compare Plans
                  </button>
                </div>
                <ResultsDashboard result={result} input={input} isDark={isDark} surface={surface} surface2={surface2} border={border} text={text} text2={text2} hint={hint}/>
                <RecommendationCard recommendations={recs} onSelect={pt => { set({planType:pt as PlanType}); setDir('prev'); setStep(3); }} isDark={isDark} surface={surface} border={border} text={text} text2={text2}/>
              </div>
            )}
          </div>

          {/* ── Navigation Buttons ── */}
          <div style={{ display:'flex',gap:12,justifyContent: step===1 ? 'flex-end' : 'space-between' }}>
            {step > 1 && (
              <button onClick={goBack} style={{
                display:'flex',alignItems:'center',gap:8,padding:'14px 24px',borderRadius:16,
                border:`1.5px solid ${border}`,background:surface,color:text,fontSize:14,fontWeight:700,cursor:'pointer',transition:'all 0.2s',flex:1,justifyContent:'center',
              }}>
                <ArrowLeft size={16}/> Back
              </button>
            )}
            {step < 5 ? (
              <button onClick={goNext} style={{
                display:'flex',alignItems:'center',gap:8,padding:'14px 24px',borderRadius:16,border:'none',
                background:'linear-gradient(135deg,#C8102E,#a00d24)',color:'#fff',fontSize:14,fontWeight:700,
                cursor:'pointer',transition:'all 0.2s',flex:1,justifyContent:'center',
                boxShadow:'0 4px 16px rgba(200,16,46,0.35)',
              }}>
                Next <ArrowRight size={16}/>
              </button>
            ) : (
              <button onClick={() => { setStep(1); setSaved(false); }} style={{
                display:'flex',alignItems:'center',gap:8,padding:'14px 24px',borderRadius:16,border:'none',
                background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontSize:14,fontWeight:700,
                cursor:'pointer',transition:'all 0.2s',flex:1,justifyContent:'center',
                boxShadow:'0 4px 16px rgba(34,197,94,0.35)',
              }}>
                <Calculator size={16}/> New Calculation
              </button>
            )}
          </div>

          {/* ── Live Mini Preview (steps 1-4) ── */}
          {step < 5 && result.isValid && (
            <div style={{ marginTop:20,padding:'16px 20px',borderRadius:16,background:isDark?'rgba(200,16,46,0.08)':'rgba(200,16,46,0.04)',border:'1px solid rgba(200,16,46,0.15)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
              <div>
                <div style={{ fontSize:11,color:text2,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.5px' }}>Live Estimate</div>
                <div style={{ fontSize:22,fontWeight:900,color:'#C8102E',lineHeight:1.2 }}>{formatINR(result.premiumByMode[input.paymentMode as keyof typeof result.premiumByMode] || result.annualPremium)}<span style={{ fontSize:12,fontWeight:600,color:text2 }}>/{input.paymentMode === 'annual' ? 'yr' : input.paymentMode === 'half-yearly' ? '6mo' : input.paymentMode === 'quarterly' ? 'qtr' : 'mo'}</span></div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11,color:text2 }}>Maturity</div>
                <div style={{ fontSize:16,fontWeight:800,color:'#10B981' }}>{formatINR(result.maturityBenefit)}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Generator Modal */}
      {showReport && <ReportGenerator result={result} input={input} onClose={() => setShowReport(false)} />}
    </DashboardShell>
  );
}

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 14, color: '#94A3B8' }}>Loading calculator...</div></div>}>
      <CalculatorPageInner />
    </Suspense>
  );
}
