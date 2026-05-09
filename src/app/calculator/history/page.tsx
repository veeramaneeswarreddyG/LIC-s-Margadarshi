'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Star, Trash2, Copy, Clock, Filter, X, AlertCircle } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import DashboardShell from '@/components/DashboardShell';
import PageHeader from '@/components/PageHeader';
import { getHistory, toggleFavorite, deleteItem, clearHistory, type CalcHistoryItem } from '@/lib/calc-history';
import { formatINR } from '@/lib/premium-engine';

const TYPE_COLORS: Record<string,string> = {
  term:'#3B82F6', endowment:'#10B981', moneyback:'#F59E0B', 'whole-life':'#EC4899',
  children:'#8B5CF6', pension:'#F97316', ulip:'#06B6D4',
};
const TYPE_LABELS: Record<string,string> = {
  term:'Term', endowment:'Endowment', moneyback:'Money Back', 'whole-life':'Whole Life',
  children:'Child', pension:'Pension', ulip:'ULIP',
};

export default function HistoryPage() {
  const router = useRouter();
  const T = useThemeColors();
  const { bg, surface, surface2, border, text, text2, hint, isDark } = T;
  const [items, setItems] = useState<CalcHistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'favorites'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { setItems(getHistory()); }, []);

  const filtered = items.filter(i => {
    if (filter === 'favorites' && !i.favorite) return false;
    if (typeFilter !== 'all' && i.planType !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return i.planName.toLowerCase().includes(s) || i.planType.includes(s) || formatINR(i.premium).includes(s);
    }
    return true;
  });

  const handleFav = (id: string) => setItems(toggleFavorite(id));
  const handleDelete = (id: string) => setItems(deleteItem(id));
  const handleClear = () => { setItems(clearHistory()); setConfirmClear(false); };
  const handleDuplicate = (item: CalcHistoryItem) => {
    const params = new URLSearchParams({ restore: JSON.stringify(item.input) });
    router.push(`/calculator?${params.toString()}`);
  };

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  };

  const types = ['all', ...Array.from(new Set(items.map(i => i.planType)))];

  return (
    <DashboardShell>
      <div style={{ minHeight:'100vh', background:bg, color:text, fontFamily:'Inter,sans-serif', transition:'background 0.3s' }}>
        <style>{`
          @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
          .hist-card{animation:fadeUp 0.3s ease backwards;transition:transform 0.2s,box-shadow 0.2s;}
          .hist-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.12);}
          .hist-card:nth-child(2){animation-delay:0.05s}.hist-card:nth-child(3){animation-delay:0.1s}
          .hist-card:nth-child(4){animation-delay:0.15s}.hist-card:nth-child(5){animation-delay:0.2s}
        `}</style>

        <PageHeader>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <button onClick={() => router.push('/calculator')} style={{ width:34,height:34,borderRadius:'50%',border:`1px solid ${border}`,background:surface2,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:text }}>
              <ArrowLeft size={15}/>
            </button>
            <div>
              <h1 style={{ fontSize:17,fontWeight:800,lineHeight:1,color:text }}>Calculation History</h1>
              <p style={{ fontSize:11,color:hint,marginTop:2 }}>{items.length} saved calculations</p>
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={() => setConfirmClear(true)} style={{ padding:'6px 12px',borderRadius:20,border:`1px solid rgba(239,68,68,0.3)`,background:'rgba(239,68,68,0.08)',color:'#EF4444',fontSize:11,fontWeight:700,cursor:'pointer' }}>
              Clear All
            </button>
          )}
        </PageHeader>

        <div style={{ maxWidth:700,margin:'0 auto',padding:'20px 16px 80px' }}>

          {/* Search */}
          <div style={{ position:'relative',marginBottom:14 }}>
            <Search size={15} style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:hint }}/>
            <input type="text" placeholder="Search by plan name or amount…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%',background:surface2,border:`1.5px solid ${border}`,borderRadius:14,padding:'12px 40px 12px 40px',fontSize:13,color:text,outline:'none',boxSizing:'border-box',transition:'border-color 0.2s' }}/>
            {search && <button onClick={() => setSearch('')} style={{ position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:hint,cursor:'pointer' }}><X size={15}/></button>}
          </div>

          {/* Filter tabs */}
          <div style={{ display:'flex',gap:8,marginBottom:8,flexWrap:'wrap' }}>
            {(['all','favorites'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:'7px 14px',borderRadius:20,fontSize:12,fontWeight:700,cursor:'pointer',
                border:filter===f?'none':`1.5px solid ${border}`,
                background:filter===f?'linear-gradient(135deg,#C8102E,#a00d24)':surface2,
                color:filter===f?'#fff':text,transition:'all 0.2s',
              }}>
                {f === 'all' ? `All (${items.length})` : `★ Favorites (${items.filter(i=>i.favorite).length})`}
              </button>
            ))}
          </div>
          <div style={{ display:'flex',gap:6,overflowX:'auto',marginBottom:20,paddingBottom:4 }}>
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} style={{
                padding:'6px 12px',borderRadius:16,fontSize:11,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0,
                border:typeFilter===t?'none':`1px solid ${border}`,
                background:typeFilter===t?(t==='all'?'#334155':TYPE_COLORS[t]||'#666'):surface2,
                color:typeFilter===t?'#fff':text2,transition:'all 0.2s',
              }}>
                {t === 'all' ? 'All Types' : TYPE_LABELS[t] || t}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div style={{ textAlign:'center',padding:'60px 20px' }}>
              <Clock size={48} color={hint} style={{ margin:'0 auto 16px',opacity:0.3 }}/>
              <h3 style={{ fontSize:16,fontWeight:700,color:text,marginBottom:6 }}>
                {items.length === 0 ? 'No calculations yet' : 'No matching results'}
              </h3>
              <p style={{ fontSize:13,color:text2,marginBottom:20 }}>
                {items.length === 0 ? 'Your calculation history will appear here automatically.' : 'Try different search or filters.'}
              </p>
              {items.length === 0 && (
                <button onClick={() => router.push('/calculator')} style={{
                  padding:'12px 28px',borderRadius:14,border:'none',background:'linear-gradient(135deg,#C8102E,#a00d24)',
                  color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',boxShadow:'0 4px 16px rgba(200,16,46,0.35)',
                }}>
                  Start Calculating
                </button>
              )}
            </div>
          )}

          {/* History cards */}
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {filtered.map(item => {
              const color = TYPE_COLORS[item.planType] || '#666';
              return (
                <div key={item.id} className="hist-card" style={{
                  background:surface, border:`1px solid ${border}`, borderRadius:18, overflow:'hidden',
                  borderLeft:`4px solid ${color}`, transition:'background 0.3s',
                }}>
                  <div style={{ padding:'16px 18px' }}>
                    {/* Header row */}
                    <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12 }}>
                      <div>
                        <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                          <span style={{ fontSize:15,fontWeight:800,color:text }}>{item.planName}</span>
                          <span style={{ fontSize:10,padding:'2px 8px',borderRadius:10,background:`${color}18`,color,fontWeight:700 }}>
                            {TYPE_LABELS[item.planType] || item.planType}
                          </span>
                        </div>
                        <div style={{ display:'flex',alignItems:'center',gap:6,fontSize:11,color:hint }}>
                          <Clock size={11}/> {fmtDate(item.timestamp)}
                          <span>· Age {item.input.age} · {item.input.gender === 'male' ? '♂' : '♀'} · {item.input.policyTerm}yr</span>
                        </div>
                      </div>
                      <button onClick={() => handleFav(item.id)} style={{ background:'none',border:'none',cursor:'pointer',padding:4 }}>
                        <Star size={18} color="#FFB300" fill={item.favorite ? '#FFB300' : 'none'} strokeWidth={item.favorite ? 0 : 2}/>
                      </button>
                    </div>

                    {/* Metrics row */}
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10,marginBottom:12 }}>
                      <div style={{ padding:'10px',borderRadius:12,background:isDark?'rgba(200,16,46,0.08)':'rgba(200,16,46,0.04)' }}>
                        <div style={{ fontSize:9,color:hint,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.3px',marginBottom:3 }}>Premium/yr</div>
                        <div style={{ fontSize:15,fontWeight:900,color:'#C8102E' }}>{formatINR(item.premium)}</div>
                      </div>
                      <div style={{ padding:'10px',borderRadius:12,background:isDark?'rgba(16,185,129,0.08)':'rgba(16,185,129,0.04)' }}>
                        <div style={{ fontSize:9,color:hint,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.3px',marginBottom:3 }}>Maturity</div>
                        <div style={{ fontSize:15,fontWeight:900,color:'#10B981' }}>{formatINR(item.maturity)}</div>
                      </div>
                      <div style={{ padding:'10px',borderRadius:12,background:isDark?'rgba(59,130,246,0.08)':'rgba(59,130,246,0.04)' }}>
                        <div style={{ fontSize:9,color:hint,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.3px',marginBottom:3 }}>Death Cover</div>
                        <div style={{ fontSize:15,fontWeight:900,color:'#3B82F6' }}>{formatINR(item.deathBenefit)}</div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display:'flex',gap:8 }}>
                      <button onClick={() => handleDuplicate(item)} style={{
                        flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
                        padding:'9px',borderRadius:10,border:`1px solid ${border}`,background:surface2,
                        color:text,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.2s',
                      }}>
                        <Copy size={13}/> Recalculate
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{
                        width:36,height:36,borderRadius:10,border:`1px solid rgba(239,68,68,0.2)`,
                        background:'rgba(239,68,68,0.06)',display:'flex',alignItems:'center',justifyContent:'center',
                        cursor:'pointer',color:'#EF4444',flexShrink:0,
                      }}>
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirm clear modal */}
        {confirmClear && (
          <div style={{ position:'fixed',inset:0,zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)' }}
            onClick={() => setConfirmClear(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background:surface,borderRadius:20,padding:'28px',maxWidth:340,width:'90%',border:`1px solid ${border}`,boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
              <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                <div style={{ width:40,height:40,borderRadius:12,background:'rgba(239,68,68,0.1)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                  <AlertCircle size={20} color="#EF4444"/>
                </div>
                <div>
                  <div style={{ fontSize:16,fontWeight:800,color:text }}>Clear All History?</div>
                  <div style={{ fontSize:12,color:text2 }}>This cannot be undone</div>
                </div>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button onClick={() => setConfirmClear(false)} style={{ flex:1,padding:'12px',borderRadius:12,border:`1px solid ${border}`,background:surface2,color:text,fontSize:13,fontWeight:600,cursor:'pointer' }}>Cancel</button>
                <button onClick={handleClear} style={{ flex:1,padding:'12px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#EF4444,#DC2626)',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer' }}>Clear All</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
