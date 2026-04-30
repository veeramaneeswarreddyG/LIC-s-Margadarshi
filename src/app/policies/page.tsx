'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Shield, Heart, PiggyBank, CheckCircle,
  AlertCircle, Clock, CreditCard, FileText, Download,
  ChevronRight, Phone, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import DashboardShell from '@/components/DashboardShell';

// Mock detailed policy data (would come from DB in production)
const MY_POLICIES_DATA = [
  {
    id: 'P001', name: 'Jeevan Anand', planNo: '815', type: 'Endowment',
    sumAssured: '₹15,00,000', premium: '₹6,420', premiumFreq: 'Yearly',
    startDate: '12 Mar 2021', maturityDate: '12 Mar 2036',
    nextDue: '12 Mar 2027', paidPct: 68, color: '#FFB300',
    icon: Shield, status: 'Active', policyTerm: '15 years',
    premiumTerm: '15 years', nominee: 'Priya (Spouse)',
    totalPremiumPaid: '₹38,520', bonusAccrued: '₹42,000',
    premiumHistory: [
      { date: '12 Mar 2026', amount: '₹6,420', status: 'Paid' },
      { date: '12 Mar 2025', amount: '₹6,420', status: 'Paid' },
      { date: '12 Mar 2024', amount: '₹6,420', status: 'Paid' },
      { date: '12 Mar 2023', amount: '₹6,420', status: 'Paid' },
      { date: '12 Mar 2022', amount: '₹6,420', status: 'Paid' },
      { date: '12 Mar 2021', amount: '₹6,420', status: 'Paid' },
    ],
  },
  {
    id: 'P002', name: 'Jeevan Umang', planNo: '945', type: 'Whole Life',
    sumAssured: '₹25,00,000', premium: '₹11,200', premiumFreq: 'Yearly',
    startDate: '02 Aug 2022', maturityDate: '02 Aug 2072',
    nextDue: '02 Aug 2026', paidPct: 42, color: '#C8102E',
    icon: Heart, status: 'Active', policyTerm: 'Whole Life (age 100)',
    premiumTerm: '20 years', nominee: 'Rama (Mother)',
    totalPremiumPaid: '₹44,800', bonusAccrued: '₹28,000',
    premiumHistory: [
      { date: '02 Aug 2025', amount: '₹11,200', status: 'Paid' },
      { date: '02 Aug 2024', amount: '₹11,200', status: 'Paid' },
      { date: '02 Aug 2023', amount: '₹11,200', status: 'Paid' },
      { date: '02 Aug 2022', amount: '₹11,200', status: 'Paid' },
    ],
  },
  {
    id: 'P003', name: 'Jeevan Labh', planNo: '936', type: 'Endowment',
    sumAssured: '₹10,00,000', premium: '₹4,850', premiumFreq: 'Yearly',
    startDate: '20 Sep 2019', maturityDate: '20 Sep 2035',
    nextDue: '20 Sep 2026', paidPct: 85, color: '#22c55e',
    icon: PiggyBank, status: 'Active', policyTerm: '16 years',
    premiumTerm: '10 years', nominee: 'Arjun (Son)',
    totalPremiumPaid: '₹33,950', bonusAccrued: '₹62,000',
    premiumHistory: [
      { date: '20 Sep 2025', amount: '₹4,850', status: 'Paid' },
      { date: '20 Sep 2024', amount: '₹4,850', status: 'Paid' },
      { date: '20 Sep 2023', amount: '₹4,850', status: 'Paid' },
      { date: '20 Sep 2022', amount: '₹4,850', status: 'Paid' },
      { date: '20 Sep 2021', amount: '₹4,850', status: 'Paid' },
      { date: '20 Sep 2020', amount: '₹4,850', status: 'Paid' },
      { date: '20 Sep 2019', amount: '₹4,850', status: 'Paid' },
    ],
  },
];

function RingProgress({ pct, size = 64, stroke = 5, color = '#FFB300' }: any) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#E8EAED" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
    </svg>
  );
}

export default function PoliciesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [selected, setSelected] = useState<typeof MY_POLICIES_DATA[0] | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'history' | 'documents'>('overview');
  const [paySuccess, setPaySuccess] = useState(false);

  const bg       = isDark ? '#0F1117'  : '#FAFAFA';
  const surface  = isDark ? '#161B27'  : '#FFFFFF';
  const surface2 = isDark ? '#1E2436'  : '#F8F9FA';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : '#DADCE0';
  const text     = isDark ? '#E2E8F0'  : '#202124';
  const text2    = isDark ? '#94A3B8'  : '#5F6368';
  const hint     = isDark ? '#64748B'  : '#9AA0A6';
  const headerBg = isDark ? 'rgba(22,27,39,0.95)' : 'rgba(255,255,255,0.95)';
  const modalBg  = isDark ? 'rgba(0,0,0,0.7)'     : 'rgba(0,0,0,0.4)';

  const handlePay = () => {
    setPaySuccess(true);
    setTimeout(() => setPaySuccess(false), 3000);
  };

  return (
    <DashboardShell>
      <div style={{ minHeight:'100vh', background:bg, color:text, fontFamily:'Inter, sans-serif', transition:'background 0.3s, color 0.3s' }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.fade-in{animation:fadeIn 0.3s ease;}`}</style>

      {/* Header */}
      <header style={{ height:64,display:'flex',alignItems:'center',gap:14,padding:'0 20px',borderBottom:`1px solid ${border}`,background:headerBg,backdropFilter:'blur(12px)',position:'sticky',top:0,zIndex:30,transition:'background 0.3s,border-color 0.3s' }}>
        <button onClick={() => router.back()} style={{ width:36,height:36,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text,flexShrink:0 }}>
          <ArrowLeft size={16}/>
        </button>
        <div>
          <h1 style={{ fontSize:17,fontWeight:800,lineHeight:1,color:text }}>My Policies</h1>
          <p style={{ fontSize:11,color:hint,marginTop:2 }}>{MY_POLICIES_DATA.length} active policies</p>
        </div>
      </header>

      <div style={{ maxWidth:760,margin:'0 auto',padding:'20px 16px 60px' }}>
        {/* Summary Banner */}
        <div style={{ background:'linear-gradient(135deg,#C8102E 0%,#a00d24 100%)',borderRadius:14,padding:'20px 24px',marginBottom:20,display:'flex',gap:24,flexWrap:'wrap' }}>
          {[
            { label:'Total Coverage',value:'₹50,00,000',color:'#FFB300' },
            { label:'Total Premiums Paid',value:'₹1,17,270',color:'#22c55e' },
            { label:'Total Bonus Accrued',value:'₹1,32,000',color:'#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ flex:1,minWidth:120 }}>
              <div style={{ fontSize:10,color:'rgba(255,255,255,0.7)',fontWeight:600,letterSpacing:'0.5px',marginBottom:4 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize:18,fontWeight:700,color:'white' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Policy Cards */}
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          {MY_POLICIES_DATA.map(policy => (
            <div key={policy.id} onClick={() => { setSelected(policy); setDetailTab('overview'); }}
              style={{ background:surface,border:`1px solid ${border}`,borderRadius:14,padding:'18px',cursor:'pointer',transition:'all 0.2s ease,background 0.3s',boxShadow:isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(60,64,67,0.08)' }}>

              <div style={{ display:'flex',alignItems:'flex-start',gap:14 }}>
                {/* Ring */}
                <div style={{ position:'relative',flexShrink:0 }}>
                  <RingProgress pct={policy.paidPct} size={60} stroke={5} color={policy.color}/>
                  <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color:policy.color }}>{policy.paidPct}%</div>
                </div>

                {/* Info */}
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4 }}>
                    <span style={{ fontSize:15,fontWeight:800 }}>{policy.name}</span>
                    <span style={{ fontSize:10,background:'rgba(34,197,94,0.1)',color:'#16a34a',padding:'2px 8px',borderRadius:20,fontWeight:700 }}>{policy.status}</span>
                  </div>
                  <div style={{ fontSize:11,color:text2,marginBottom:8 }}>Plan {policy.planNo} · {policy.type} · {policy.id}</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                    {[
                      { l:'Sum Assured',v:policy.sumAssured,c:text },
                      { l:'Premium',v:`${policy.premium}/${policy.premiumFreq === 'Yearly' ? 'yr' : 'mo'}`,c:policy.color },
                      { l:'Nominee',v:policy.nominee,c:text2 },
                      { l:'Maturity',v:policy.maturityDate,c:text2 },
                    ].map(d => (
                      <div key={d.l}>
                        <div style={{ fontSize:9,color:hint,fontWeight:700,letterSpacing:'0.3px' }}>{d.l.toUpperCase()}</div>
                        <div style={{ fontSize:11,fontWeight:700,color:d.c,marginTop:1 }}>{d.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right */}
                <div style={{ flexShrink:0,textAlign:'right' }}>
                  <div style={{ fontSize:9,color:hint,marginBottom:3 }}>NEXT DUE</div>
                  <div style={{ fontSize:12,fontWeight:700,color:'#FFB300' }}>{policy.nextDue}</div>
                  <ChevronRight size={16} color={hint} style={{ marginTop:10 }}/>
                </div>
              </div>

              {/* Pay button if due soon */}
              {policy.id === 'P003' && (
                <div style={{ marginTop:14,paddingTop:14,borderTop:'1px solid #DADCE0',display:'flex',alignItems:'center',gap:10 }}>
                  <AlertCircle size={14} color="#C8102E"/>
                  <span style={{ fontSize:12,color:'#C8102E',flex:1 }}>Premium due in <strong>12 days</strong></span>
                  <button onClick={e => { e.stopPropagation(); handlePay(); }}
                    style={{ padding:'7px 16px',borderRadius:20,border:'none',background:'linear-gradient(90deg,#FFB300,#C8102E)',color:'#202124',fontSize:12,fontWeight:700,cursor:'pointer' }}>
                    Pay ₹4,850
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Success toast */}
        {paySuccess && (
          <div className="fade-in" style={{ position:'fixed',bottom:32,left:'50%',transform:'translateX(-50%)',background:'rgba(34,197,94,0.9)',color:'#202124',padding:'12px 24px',borderRadius:30,fontSize:13,fontWeight:700,display:'flex',gap:8,alignItems:'center',zIndex:200,backdropFilter:'blur(8px)' }}>
            <CheckCircle size={16}/> Payment successful! Premium paid.
          </div>
        )}

        {/* Contact / Help */}
        <div style={{ marginTop:24,padding:'18px 20px',background:'rgba(255,179,0,0.06)',border:'1px solid rgba(255,179,0,0.15)',borderRadius:16,display:'flex',alignItems:'center',gap:14 }}>
          <div style={{ width:40,height:40,borderRadius:'50%',background:'rgba(255,179,0,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <Phone size={18} color="#FFB300"/>
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13,fontWeight:700,marginBottom:2 }}>Need help with your policy?</p>
            <p style={{ fontSize:11,color:'#5F6368' }}>Call LIC helpline: <strong style={{ color:'#C8102E' }}>1800-209-6527</strong> (toll-free)</p>
          </div>
        </div>
      </div>

      {/* ─── Policy Detail Drawer ─── */}
      {selected && (
        <div onClick={() => setSelected(null)}
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(4px)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
          <div onClick={e => e.stopPropagation()} className="fade-in"
            style={{ width:'100%',maxWidth:600,maxHeight:'88vh',overflowY:'auto',background:'#FFFFFF',borderRadius:'16px 16px 0 0',boxShadow:'0 -4px 20px rgba(60,64,67,0.15)',padding:'0 0 40px' }}>

            {/* Drag handle */}
            <div style={{ padding:'12px 0 0',display:'flex',justifyContent:'center' }}>
              <div style={{ width:36,height:4,borderRadius:2,background:'#E8EAED' }}/>
            </div>

            {/* Top */}
            <div style={{ padding:'16px 24px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
              <div>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                  <h2 style={{ fontSize:20,fontWeight:700,margin:0,color:'#202124' }}>{selected.name}</h2>
                  <span style={{ fontSize:10,background:'rgba(34,197,94,0.1)',color:'#16a34a',padding:'2px 8px',borderRadius:20,fontWeight:600 }}>{selected.status}</span>
                </div>
                <p style={{ fontSize:12,color:'#5F6368' }}>Plan {selected.planNo} · {selected.type} · {selected.id}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ width:32,height:32,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text }}>
                <X size={15}/>
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex',gap:4,padding:'16px 24px 0' }}>
              {(['overview','history','documents'] as const).map(t => (
                <button key={t} onClick={() => setDetailTab(t)}
                  style={{ padding:'8px 14px',borderRadius:10,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,transition:'all 0.2s',
                    background: detailTab === t ? '#C8102E' : '#F8F9FA',
                    color: detailTab === t ? 'white' : '#5F6368',
                  }}>
                  {t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ padding:'16px 24px 0' }}>
              {/* Overview Tab */}
              {detailTab === 'overview' && (
                <div>
                  {/* Ring stat */}
                  <div style={{ background:surface2,borderRadius:16,padding:'20px',marginBottom:16,display:'flex',alignItems:'center',gap:20 }}>
                    <div style={{ position:'relative',flexShrink:0 }}>
                      <RingProgress pct={selected.paidPct} size={76} stroke={6} color={selected.color}/>
                      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column' }}>
                        <div style={{ fontSize:16,fontWeight:900,color:selected.color }}>{selected.paidPct}%</div>
                        <div style={{ fontSize:8,color:'#5f6368' }}>PAID</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize:12,color:'#5f6368',marginBottom:4 }}>Total Premiums Paid</div>
                      <div style={{ fontSize:20,fontWeight:900,color:'#22c55e',marginBottom:8 }}>{selected.totalPremiumPaid}</div>
                      <div style={{ fontSize:12,color:'#5f6368' }}>Bonus Accrued: <strong style={{ color:'#8b5cf6' }}>{selected.bonusAccrued}</strong></div>
                    </div>
                  </div>

                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
                    {[
                      { l:'Sum Assured',v:selected.sumAssured },
                      { l:'Premium Amount',v:`${selected.premium}/${selected.premiumFreq.charAt(0)}`},
                      { l:'Policy Term',v:selected.policyTerm },
                      { l:'Premium Term',v:selected.premiumTerm },
                      { l:'Start Date',v:selected.startDate },
                      { l:'Maturity Date',v:selected.maturityDate },
                      { l:'Next Due Date',v:selected.nextDue },
                      { l:'Nominee',v:selected.nominee },
                    ].map(d => (
                      <div key={d.l} style={{ background:surface2,borderRadius:10,padding:'12px',border:`1px solid ${border}` }}>
                        <div style={{ fontSize:9,color:'#5f6368',fontWeight:700,letterSpacing:'0.5px',marginBottom:4 }}>{d.l.toUpperCase()}</div>
                        <div style={{ fontSize:12,fontWeight:700 }}>{d.v}</div>
                      </div>
                    ))}
                  </div>

                  <button onClick={handlePay}
                    style={{ width:'100%',padding:'14px',borderRadius:50,border:'none',background:'linear-gradient(90deg,#FFB300,#C8102E)',color:'#202124',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(200,16,46,0.35)',marginBottom:10 }}>
                    Pay Premium – {selected.premium}
                  </button>
                  <button style={{ width:'100%',padding:'12px',borderRadius:50,border:`1px solid ${border}`,background:surface2,color:text,fontSize:13,fontWeight:600,cursor:'pointer' }}>
                    Raise a Claim
                  </button>
                </div>
              )}

              {/* History Tab */}
              {detailTab === 'history' && (
                <div>
                  <p style={{ fontSize:12,color:'#5f6368',marginBottom:14 }}>Premium payment history for {selected.name}</p>
                  {selected.premiumHistory.map((h, i) => (
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #DADCE0' }}>
                      <div style={{ width:32,height:32,borderRadius:'50%',background:'rgba(34,197,94,0.12)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <CheckCircle size={14} color="#4ade80"/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13,fontWeight:700 }}>{h.amount}</div>
                        <div style={{ fontSize:11,color:'#9AA0A6',marginTop:2 }}>{h.date}</div>
                      </div>
                      <span style={{ fontSize:10,background:'rgba(34,197,94,0.12)',color:'#4ade80',padding:'3px 9px',borderRadius:20,fontWeight:700 }}>{h.status}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Documents Tab */}
              {detailTab === 'documents' && (
                <div>
                  <p style={{ fontSize:12,color:'#5f6368',marginBottom:16 }}>Policy documents for {selected.name}</p>
                  {[
                    { name:`Policy Bond – ${selected.id}`,type:'PDF',size:'2.4 MB' },
                    { name:'Premium Receipt – 2026',type:'PDF',size:'180 KB' },
                    { name:'Premium Receipt – 2025',type:'PDF',size:'175 KB' },
                    { name:'Nomination Certificate',type:'PDF',size:'320 KB' },
                    { name:'KYC Documents',type:'PDF',size:'1.1 MB' },
                  ].map((doc, i) => (
                    <div key={i} style={{ display:'flex',alignItems:'center',gap:12,padding:'14px 0',borderBottom:'1px solid #DADCE0' }}>
                      <div style={{ width:36,height:36,borderRadius:10,background:'rgba(255,179,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <FileText size={16} color="#FFB300"/>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontSize:13,fontWeight:700,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{doc.name}</div>
                        <div style={{ fontSize:11,color:'#5f6368',marginTop:2 }}>{doc.type} · {doc.size}</div>
                      </div>
                      <button style={{ width:32,height:32,borderRadius:'50%',border:'1px solid rgba(255,179,0,0.25)',background:'rgba(255,179,0,0.08)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#FFB300',flexShrink:0 }}>
                        <Download size={14}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardShell>
  );
}









