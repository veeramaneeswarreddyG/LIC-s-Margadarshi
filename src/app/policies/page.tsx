'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Shield, Heart, PiggyBank, CheckCircle,
  AlertCircle, Clock, CreditCard, FileText, Download,
  ChevronRight, Phone, X
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColors } from '@/hooks/useThemeColors';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/PageHeader';

import { useUserData } from '@/hooks/useUserData';

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
  const { policies, addPolicy, recordPayment } = useUserData();
  const T = useThemeColors();
  const { bg, surface, surface2, border, text, text2, hint, headerBg, shadow, isDark } = T;
  const [selected, setSelected] = useState<any | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'history' | 'documents'>('overview');
  const [paySuccess, setPaySuccess] = useState(false);
  const [showAddPolicy, setShowAddPolicy] = useState(false);
  const [newPolicyData, setNewPolicyData] = useState({ name: '', type: 'Endowment', sum: '', premium: '' });

  const handleAddPolicy = async () => {
    if (!newPolicyData.name || !newPolicyData.sum) return;
    await addPolicy({
      name: newPolicyData.name,
      type: newPolicyData.type,
      sum: `₹${newPolicyData.sum}`,
      premium: `₹${newPolicyData.premium || '0'}/yr`,
      nextDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      paidPct: Math.floor(Math.random() * 50) + 10,
      status: 'Active'
    });
    setShowAddPolicy(false);
  };

  const handlePay = async () => {
    setPaySuccess(true);
    if (selected) await recordPayment(selected.id, selected.premium);
    setTimeout(() => setPaySuccess(false), 3000);
  };

  return (
    <DashboardShell>
      <div suppressHydrationWarning style={{ minHeight:'100vh', background:bg, color:text, fontFamily:'Inter, sans-serif', transition:'background 0.3s, color 0.3s' }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}.fade-in{animation:fadeIn 0.3s ease;}`}</style>

      <PageHeader>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ width:34,height:34,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text,flexShrink:0 }}>
            <ArrowLeft size={15}/>
          </button>
          <div>
            <h1 style={{ fontSize:17,fontWeight:800,lineHeight:1,color:text }}>My Policies</h1>
            <p style={{ fontSize:11,color:hint,marginTop:2 }}>{policies.length} active policies</p>
          </div>
        </div>
        <button onClick={() => setShowAddPolicy(true)} style={{ background:'linear-gradient(135deg,#C8102E,#a00d24)',color:'white',border:'none',borderRadius:20,padding:'7px 16px',fontSize:12,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(200,16,46,0.35)' }}>
          + Add
        </button>
      </PageHeader>

      <div style={{ maxWidth:760,margin:'0 auto',padding:'24px 16px 60px' }}>
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

        {/* Policy Cards or Empty State */}
        {policies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: surface, borderRadius: 16, border: `1px solid ${border}` }}>
            <div style={{ width: 64, height: 64, background: 'rgba(255,179,0,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Shield size={32} color="#FFB300" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: text }}>No policies found</h2>
            <p style={{ fontSize: 13, color: text2, maxWidth: 300, margin: '0 auto 24px', lineHeight: 1.6 }}>
              It looks like you haven't linked any LIC policies yet. Add your first policy to track your progress!
            </p>
            <button onClick={() => setShowAddPolicy(true)} className="lic-btn" style={{ padding: '12px 24px', borderRadius: 30 }}>
              Add Your First Policy
            </button>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            {policies.map(policy => (
              <div key={policy.id} onClick={() => { setSelected(policy); setDetailTab('overview'); }}
                style={{ background:surface,border:`1px solid ${border}`,borderRadius:14,padding:'18px',cursor:'pointer',transition:'all 0.2s ease,background 0.3s',boxShadow:shadow }}>

                <div style={{ display:'flex',alignItems:'flex-start',gap:14 }}>
                  {/* Ring */}
                  <div style={{ position:'relative',flexShrink:0 }}>
                    <RingProgress pct={policy.paidPct || 10} size={60} stroke={5} color="#C8102E"/>
                    <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:800,color: '#C8102E' }}>{policy.paidPct || 10}%</div>
                  </div>

                  {/* Info */}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4 }}>
                      <span style={{ fontSize:15,fontWeight:800 }}>{policy.name}</span>
                      <span style={{ fontSize:10,background:'rgba(34,197,94,0.1)',color:'#16a34a',padding:'2px 8px',borderRadius:20,fontWeight:700 }}>{policy.status}</span>
                    </div>
                    <div style={{ fontSize:11,color:text2,marginBottom:8 }}>Plan {policy.id} · {policy.type}</div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:6 }}>
                      {[
                        { l:'Sum Assured',v:policy.sum,c:text },
                        { l:'Premium',v:policy.premium,c: '#C8102E' },
                        { l:'Nominee',v: 'Not added',c:text2 },
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

                <div style={{ marginTop:14,paddingTop:14,borderTop:`1px solid ${border}`,display:'flex',alignItems:'center',gap:10 }}>
                  <AlertCircle size={14} color="#C8102E"/>
                  <span style={{ fontSize:12,color:'#C8102E',flex:1 }}>Premium due soon</span>
                  <button onClick={e => { e.stopPropagation(); setSelected(policy); handlePay(); }}
                    style={{ padding:'7px 16px',borderRadius:20,border:'none',background:'linear-gradient(90deg,#FFB300,#C8102E)',color:'#202124',fontSize:12,fontWeight:700,cursor:'pointer' }}>
                    Pay {policy.premium.split('/')[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

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
                      { l:'Sum Assured',v:selected.sum },
                      { l:'Premium Amount',v:selected.premium },
                      { l:'Start Date',v:'Added recently' },
                      { l:'Next Due Date',v:selected.nextDue },
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
                  {selected.premiumHistory.map((h: any, i: number) => (
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

      {/* ─── Add Policy Modal ─── */}
      {showAddPolicy && (
        <div onClick={() => setShowAddPolicy(false)}
          style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
          <div onClick={e => e.stopPropagation()} className="fade-in"
            style={{ width:'100%',maxWidth:400,background:surface,borderRadius:16,padding:24,boxShadow:'0 20px 40px rgba(0,0,0,0.2)',border:`1px solid ${border}` }}>
            
            <h2 style={{ fontSize:20,fontWeight:800,marginBottom:20,color:text }}>Add New Policy</h2>
            
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block',fontSize:12,fontWeight:700,marginBottom:6,color:text2 }}>Policy Name</label>
              <input type="text" placeholder="e.g. Jeevan Anand" style={{ width:'100%',padding:'12px 14px',borderRadius:8,border:`1px solid ${border}`,background:surface2,color:text }} value={newPolicyData.name} onChange={e => setNewPolicyData({...newPolicyData, name: e.target.value})} />
            </div>

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block',fontSize:12,fontWeight:700,marginBottom:6,color:text2 }}>Sum Assured (₹)</label>
              <input type="number" placeholder="e.g. 1000000" style={{ width:'100%',padding:'12px 14px',borderRadius:8,border:`1px solid ${border}`,background:surface2,color:text }} value={newPolicyData.sum} onChange={e => setNewPolicyData({...newPolicyData, sum: e.target.value})} />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block',fontSize:12,fontWeight:700,marginBottom:6,color:text2 }}>Premium Amount (₹)</label>
              <input type="number" placeholder="e.g. 5000" style={{ width:'100%',padding:'12px 14px',borderRadius:8,border:`1px solid ${border}`,background:surface2,color:text }} value={newPolicyData.premium} onChange={e => setNewPolicyData({...newPolicyData, premium: e.target.value})} />
            </div>

            <div style={{ display:'flex',gap:12 }}>
              <button onClick={() => setShowAddPolicy(false)} style={{ flex:1,padding:14,borderRadius:30,border:`1px solid ${border}`,background:'transparent',color:text,fontSize:13,fontWeight:700,cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAddPolicy} className="lic-btn" style={{ flex:1,padding:14,borderRadius:30,fontSize:13,cursor:'pointer' }}>Add Policy</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </DashboardShell>
  );
}









