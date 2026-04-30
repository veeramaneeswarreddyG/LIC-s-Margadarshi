'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Search, X, CheckCircle, Info, CreditCard,
  Shield, ChevronRight, Star, Filter
} from 'lucide-react';
import { LIC_PLANS, PLAN_CATEGORIES, CATEGORY_COLORS, type LICPlan } from '@/lib/lic-plans';
import { useTheme } from '@/context/ThemeContext';
import DashboardShell from '@/components/DashboardShell';

export default function PlansPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState<LICPlan | null>(null);

  const bg       = isDark ? '#0F1117'  : '#FAFAFA';
  const surface  = isDark ? '#161B27'  : '#FFFFFF';
  const surface2 = isDark ? '#1E2436'  : '#F8F9FA';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : '#DADCE0';
  const text     = isDark ? '#E2E8F0'  : '#202124';
  const text2    = isDark ? '#94A3B8'  : '#5F6368';
  const hint     = isDark ? '#64748B'  : '#9AA0A6';
  const headerBg = isDark ? 'rgba(22,27,39,0.95)' : 'rgba(255,255,255,0.95)';

  const filtered = LIC_PLANS.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.planNo.includes(search) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.tagline.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const catColor = CATEGORY_COLORS[selectedPlan?.category || ''] || '#FFB300';

  return (
    <DashboardShell>
    <div style={{ minHeight:'100vh', background:bg, color:text, fontFamily:'Inter, sans-serif', transition:'background 0.3s, color 0.3s' }}>
      <style>{`
        .plan-card{transition:all 0.2s ease;cursor:pointer;}
        .plan-card:hover{transform:translateY(-2px);border-color:#C8102E!important;box-shadow:0 4px 16px rgba(60,64,67,0.15);}
        .cat-scroll::-webkit-scrollbar{display:none;}
        .cat-scroll{-ms-overflow-style:none;scrollbar-width:none;}
        @media(max-width:640px){
          .plans-grid{grid-template-columns:1fr!important;}
          .modal-inner{width:95vw!important;max-height:90vh!important;}
        }
      `}</style>

      {/* Header */}
      <header style={{ height:64,display:'flex',alignItems:'center',gap:14,padding:'0 20px',borderBottom:`1px solid ${border}`,background:headerBg,backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:30,transition:'background 0.3s,border-color 0.3s' }}>
        <button onClick={() => router.back()} style={{ width:36,height:36,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text,flexShrink:0 }}>
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 style={{ fontSize:17,fontWeight:800,lineHeight:1,color:text }}>Explore LIC Plans</h1>
          <p style={{ fontSize:11,color:hint,marginTop:2 }}>{LIC_PLANS.length} official plans · Updated 2025–26</p>
        </div>
      </header>

      <div style={{ maxWidth:960,margin:'0 auto',padding:'20px 16px 60px' }}>
        {/* Search */}
        <div style={{ position:'relative',marginBottom:16 }}>
          <Search size={15} style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:hint }} />
          <input type="text" placeholder="Search by plan name or number…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width:'100%',background:surface2,border:`1px solid ${border}`,borderRadius:12,padding:'11px 40px 11px 40px',fontSize:13,color:text,outline:'none',boxSizing:'border-box',transition:'background 0.3s,border-color 0.3s' }} />
          {search && <button onClick={() => setSearch('')} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:hint,cursor:'pointer' }}><X size={15} /></button>}
        </div>

        {/* Category Tabs */}
        <div className="cat-scroll" style={{ display:'flex',gap:8,overflowX:'auto',paddingBottom:8,marginBottom:24 }}>
          {PLAN_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              style={{ padding:'8px 16px',borderRadius:30,border:'1px solid',cursor:'pointer',fontSize:12,fontWeight:700,flexShrink:0,whiteSpace:'nowrap',transition:'all 0.2s',
                background: activeCategory === cat.id ? '#C8102E' : surface2,
                color: activeCategory === cat.id ? 'white' : text2,
                borderColor: activeCategory === cat.id ? 'transparent' : border,
                boxShadow: activeCategory === cat.id ? '0 4px 14px rgba(200,16,46,0.3)' : 'none',
              }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Count */}
        <p style={{ fontSize:12,color:hint,marginBottom:16 }}>
          {filtered.length} plan{filtered.length !== 1 ? 's' : ''} found
          {search && <> for "<span style={{ color:'#FFB300' }}>{search}</span>"</>}
        </p>

        {/* Plans Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center',padding:'60px 0',color:hint }}>
            <Search size={40} style={{ margin:'0 auto 16px',opacity:0.3 }} />
            <p style={{ fontSize:14 }}>No plans found. Try a different search.</p>
          </div>
        ) : (
          <div className="plans-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16 }}>
            {filtered.map(plan => {
              const color = CATEGORY_COLORS[plan.category] || '#FFB300';
              return (
                <div key={plan.id} className="plan-card"
                  onClick={() => setSelectedPlan(plan)}
                  style={{ background:surface2,border:`1px solid ${border}`,borderRadius:18,padding:'20px',position:'relative',overflow:'hidden',transition:'background 0.3s,border-color 0.3s' }}>

                  {/* Glow */}
                  <div style={{ position:'absolute',top:-30,right:-30,width:100,height:100,borderRadius:'50%',background:`radial-gradient(circle,${color}22,transparent)`,pointerEvents:'none' }} />

                  {/* Tag */}
                  {plan.tag && (
                    <span style={{ position:'absolute',top:14,right:14,fontSize:9,fontWeight:800,background:`${color}22`,color,border:`1px solid ${color}44`,padding:'3px 8px',borderRadius:20 }}>{plan.tag}</span>
                  )}

                  {/* Category badge */}
                  <div style={{ display:'flex',alignItems:'center',gap:6,marginBottom:14 }}>
                    <span style={{ background:`${color}18`,color,fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,border:`1px solid ${color}33` }}>
                      {PLAN_CATEGORIES.find(c => c.id === plan.category)?.emoji} {plan.category.charAt(0).toUpperCase() + plan.category.slice(1)}
                    </span>
                    <span style={{ fontSize:10,color:text2,fontWeight:600 }}>Plan {plan.planNo}</span>
                  </div>

                  <h3 style={{ fontSize:16,fontWeight:800,marginBottom:4,lineHeight:1.2,color:text }}>{plan.name}</h3>
                  <p style={{ fontSize:12,color:text2,marginBottom:14,lineHeight:1.5 }}>{plan.tagline}</p>

                  {/* Key stats */}
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14 }}>
                    {[
                      { label:'Entry Age',value:plan.entryAge },
                      { label:'Policy Term',value:plan.policyTerm },
                      { label:'Min SA',value:plan.minSumAssured },
                      { label:'From',value:plan.startingPremium },
                    ].map(s => (
                      <div key={s.label} style={{ background:isDark ? 'rgba(255,255,255,0.04)' : '#F1F3F4',borderRadius:8,padding:'8px 10px',border:`1px solid ${border}` }}>
                        <div style={{ fontSize:9,color:hint,fontWeight:700,letterSpacing:'0.5px',marginBottom:2 }}>{s.label.toUpperCase()}</div>
                        <div style={{ fontSize:11,fontWeight:700,color:text }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Features preview */}
                  <div style={{ marginBottom:14 }}>
                    {plan.features.slice(0, 2).map((f, i) => (
                      <div key={i} style={{ display:'flex',gap:6,alignItems:'flex-start',marginBottom:5 }}>
                        <CheckCircle size={11} color={color} style={{ flexShrink:0,marginTop:2 }} />
                        <span style={{ fontSize:11,color:text2,lineHeight:1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Badges */}
                  <div style={{ display:'flex',gap:6,flexWrap:'wrap',marginBottom:14 }}>
                    {plan.loanFacility && <span style={{ fontSize:10,background:'rgba(34,197,94,0.1)',color:'#4ade80',padding:'2px 7px',borderRadius:20,fontWeight:600 }}>Loan ✓</span>}
                    {plan.bonuses && <span style={{ fontSize:10,background:'rgba(255,179,0,0.1)',color:'#FFB300',padding:'2px 7px',borderRadius:20,fontWeight:600 }}>Bonus ✓</span>}
                    {plan.surrenderValue && <span style={{ fontSize:10,background:'rgba(59,130,246,0.12)',color:'#60a5fa',padding:'2px 7px',borderRadius:20,fontWeight:600 }}>Surrender ✓</span>}
                  </div>

                  <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <span style={{ fontSize:12,color:color,fontWeight:700 }}>Starting {plan.startingPremium}</span>
                    <div style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,color:color,fontWeight:700 }}>
                      View Details <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Plan Detail Modal ─── */}
      {selectedPlan && (
        <div onClick={() => setSelectedPlan(null)}
          style={{ position:'fixed',inset:0,background:isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
          <div className="modal-inner" onClick={e => e.stopPropagation()}
            style={{ width:'100%',maxWidth:560,maxHeight:'85vh',overflowY:'auto',background:surface,border:`1px solid ${border}`,borderRadius:22,padding:'28px',transition:'background 0.3s' }}>

            {/* Modal header */}
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20 }}>
              <div>
                <div style={{ display:'flex',gap:6,marginBottom:8,flexWrap:'wrap' }}>
                  <span style={{ background:`${catColor}18`,color:catColor,fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:20,border:`1px solid ${catColor}33` }}>
                    {PLAN_CATEGORIES.find(c => c.id === selectedPlan.category)?.emoji} {selectedPlan.category}
                  </span>
                  <span style={{ fontSize:10,color:hint,padding:'4px 8px',background:surface2,borderRadius:20,fontWeight:600 }}>Plan No. {selectedPlan.planNo}</span>
                  {selectedPlan.tag && <span style={{ fontSize:10,background:'linear-gradient(90deg,#FFB300,#C8102E)',color:'#202124',padding:'4px 10px',borderRadius:20,fontWeight:700 }}>{selectedPlan.tag}</span>}
                </div>
                <h2 style={{ fontSize:22,fontWeight:700,margin:0,color:text }}>{selectedPlan.name}</h2>
                <p style={{ fontSize:13,color:text2,marginTop:4 }}>{selectedPlan.tagline}</p>
              </div>
              <button onClick={() => setSelectedPlan(null)}
                style={{ width:32,height:32,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text,flexShrink:0 }}>
                <X size={16} />
              </button>
            </div>

            {/* Description */}
            <p style={{ fontSize:13,color:text2,lineHeight:1.7,marginBottom:22,padding:'14px',background:surface2,borderRadius:10,border:`1px solid ${border}` }}>
              {selectedPlan.description}
            </p>

            {/* Key details grid */}
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:22 }}>
              {[
                { label:'Entry Age',value:selectedPlan.entryAge },
                { label:'Policy Term',value:selectedPlan.policyTerm },
                { label:'Premium Paying Term',value:selectedPlan.premiumTerm },
                { label:'Maturity Age',value:selectedPlan.maturityAge },
                { label:'Min Sum Assured',value:selectedPlan.minSumAssured },
                { label:'Max Sum Assured',value:selectedPlan.maxSumAssured },
              ].map(d => (
                <div key={d.label} style={{ background:surface2,borderRadius:10,padding:'12px',border:`1px solid ${border}` }}>
                  <div style={{ fontSize:10,color:hint,fontWeight:600,letterSpacing:'0.5px',marginBottom:4 }}>{d.label.toUpperCase()}</div>
                  <div style={{ fontSize:12,fontWeight:700,color:text }}>{d.value}</div>
                </div>
              ))}
            </div>

            {/* Benefits */}
            <div style={{ marginBottom:20 }}>
              <h4 style={{ fontSize:11,fontWeight:700,color:hint,letterSpacing:'1px',marginBottom:12,textTransform:'uppercase' }}>BENEFITS</h4>
              {[
                { label:'🎯 Maturity Benefit',value:selectedPlan.maturityBenefit },
                { label:'🛡️ Death Benefit',value:selectedPlan.deathBenefit },
                { label:'🏦 Tax Benefit',value:selectedPlan.taxBenefit },
              ].map(b => (
                <div key={b.label} style={{ marginBottom:10,padding:'12px',background:surface2,borderRadius:10,border:`1px solid ${border}` }}>
                  <div style={{ fontSize:12,fontWeight:700,marginBottom:4,color:text }}>{b.label}</div>
                  <div style={{ fontSize:12,color:text2 }}>{b.value}</div>
                </div>
              ))}
            </div>

            {/* Features */}
            <div style={{ marginBottom:22 }}>
              <h4 style={{ fontSize:11,fontWeight:700,color:hint,letterSpacing:'1px',marginBottom:12,textTransform:'uppercase' }}>KEY FEATURES</h4>
              {selectedPlan.features.map((f, i) => (
                <div key={i} style={{ display:'flex',gap:8,alignItems:'flex-start',marginBottom:8 }}>
                  <CheckCircle size={14} color={catColor} style={{ flexShrink:0,marginTop:1 }} />
                  <span style={{ fontSize:12,color:text,lineHeight:1.5 }}>{f}</span>
                </div>
              ))}
            </div>

            {/* Facility badges */}
            <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginBottom:24 }}>
              {selectedPlan.loanFacility && <span style={{ fontSize:12,background:'rgba(34,197,94,0.1)',color:'#16a34a',border:'1px solid rgba(34,197,94,0.2)',padding:'5px 12px',borderRadius:20,fontWeight:600 }}>✓ Loan Facility</span>}
              {selectedPlan.surrenderValue && <span style={{ fontSize:12,background:'rgba(59,130,246,0.08)',color:'#2563eb',border:'1px solid rgba(59,130,246,0.2)',padding:'5px 12px',borderRadius:20,fontWeight:600 }}>✓ Surrender Value</span>}
              {selectedPlan.bonuses && <span style={{ fontSize:12,background:'rgba(255,179,0,0.1)',color:'#d97706',border:'1px solid rgba(255,179,0,0.25)',padding:'5px 12px',borderRadius:20,fontWeight:600 }}>✓ Bonus Accrual</span>}
              {!selectedPlan.loanFacility && !selectedPlan.surrenderValue && !selectedPlan.bonuses && (
                <span style={{ fontSize:12,color:'#9AA0A6' }}>Pure protection plan – no savings component</span>
              )}
            </div>

            {/* CTA */}
            <div style={{ display:'flex',gap:10 }}>
              <button onClick={() => { setSelectedPlan(null); router.push('/dashboard'); }}
                style={{ flex:1,padding:'13px',borderRadius:50,border:'none',background:'#C8102E',color:'#1e1e1e',fontSize:14,fontWeight:600,cursor:'pointer',boxShadow:'0 2px 8px rgba(200,16,46,0.35)' }}>
                Get This Plan
              </button>
              <a href={`https://licindia.in/products`} target="_blank" rel="noreferrer"
                style={{ padding:'13px 18px',borderRadius:50,border:`1px solid ${border}`,background:surface2,color:text,fontSize:13,fontWeight:600,cursor:'pointer',textDecoration:'none',display:'flex',alignItems:'center',gap:6 }}>
                LIC.in
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardShell>
  );
}










