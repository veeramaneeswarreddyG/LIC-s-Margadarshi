'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, ExternalLink, Clock, Tag, RefreshCw, Newspaper, AlertCircle } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import DashboardShell from '@/components/DashboardShell';

const CAT_COLORS: Record<string, string> = {
  'Product Launch': '#FFB300',
  'Technology': '#3b82f6',
  'Campaign': '#22c55e',
  'Financial Results': '#8b5cf6',
  'Product Update': '#f97316',
  'Service Update': '#06b6d4',
  'Corporate': '#ec4899',
  'Claims': '#22c55e',
  'business': '#FFB300',
  'News': '#9AA0A6',
};

export default function NewsPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<'live' | 'curated' | 'fallback'>('curated');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');

  // ── Theme vars ───────────────────────────────────────
  const D = isDark;
  const bg = D ? '#0F1117' : '#F3F4F6';
  const surface = D ? '#161B27' : '#FFFFFF';
  const surface2 = D ? '#1E2436' : '#F8F9FA';
  const border = D ? 'rgba(255,255,255,0.07)' : '#DADCE0';
  const text = D ? '#E2E8F0' : '#202124';
  const text2 = D ? '#94A3B8' : '#5F6368';
  const hint = D ? '#64748B' : '#9AA0A6';
  const inputBg = D ? '#1E2436' : '#FFFFFF';
  const headerBg = D ? 'rgba(15,17,23,0.97)' : 'rgba(255,255,255,0.97)';
  const iconBtn = D ? '#1E2436' : '#F1F3F4';
  const iconClr = D ? '#CBD5E1' : '#202124';
  const codeBg = D ? 'rgba(255,255,255,0.08)' : '#E8EAED';
  const codeClr = D ? '#94A3B8' : '#202124';

  const fetchNews = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/lic-news');
      const data = await res.json();
      setArticles(data.results || []);
      setSource(data.status === 'live' ? 'live' : 'fallback');
    } catch {
      setError('Failed to load news. Please try again.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNews(); }, []);

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category || 'News')))];
  const filtered = articles.filter(a => {
    const matchCat = selectedCat === 'All' || a.category === selectedCat;
    const matchSearch = !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.description?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return d; }
  };

  return (
    <DashboardShell>
      <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: 'Inter, sans-serif', transition: 'background 0.3s, color 0.3s' }}>
        <style>{`
          @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
          .spin{animation:spin 1s linear infinite}
          .news-card{transition:all 0.2s ease;}
          .news-card:hover{transform:translateY(-2px);border-color:#C8102E!important;box-shadow:0 8px 24px rgba(0,0,0,0.18);}
          .cat-btn{transition:all 0.2s;white-space:nowrap;cursor:pointer;}
          .cat-btn:hover{opacity:0.85;}
          ::-webkit-scrollbar{height:4px;width:4px;}
          ::-webkit-scrollbar-thumb{background:rgba(200,16,46,0.3);border-radius:4px;}
        `}</style>

        {/* ── Sticky Header ── */}
        <header style={{
          height: 64, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 20px',
          borderBottom: `1px solid ${border}`,
          background: headerBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          position: 'sticky', top: 0, zIndex: 30,
          transition: 'background 0.3s, border-color 0.3s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => router.back()} style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `1px solid ${border}`, background: iconBtn,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: iconClr, transition: 'all 0.2s',
            }}>
              <ArrowLeft size={16} />
            </button>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 800, lineHeight: 1, color: text }}>LIC News &amp; Updates</h1>
              <p style={{ fontSize: 11, color: hint, marginTop: 2 }}>
                {source === 'live' ? '🟢 Live from NewsData.io' : '📋 Curated updates'} · {articles.length} articles
              </p>
            </div>
          </div>
          <button onClick={fetchNews} style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${border}`, background: iconBtn,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: iconClr, transition: 'all 0.2s',
          }}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
          </button>
        </header>

        <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px 60px' }}>

          {/* API Key notice */}
          {source === 'fallback' && !error && (
            <div style={{ display: 'flex', gap: 10, padding: '12px 16px', background: 'rgba(255,179,0,0.08)', border: '1px solid rgba(255,179,0,0.2)', borderRadius: 12, marginBottom: 20 }}>
              <AlertCircle size={16} color="#FFB300" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#FFB300', marginBottom: 2 }}>Showing curated LIC updates</p>
                <p style={{ fontSize: 11, color: text2, lineHeight: 1.5 }}>
                  Add your free <strong>NewsData.io</strong> API key in{' '}
                  <code style={{ background: codeBg, color: codeClr, padding: '1px 5px', borderRadius: 4 }}>.env.local</code>{' '}
                  to get live news. Get key at{' '}
                  <a href="https://newsdata.io" target="_blank" rel="noreferrer" style={{ color: '#FFB300' }}>newsdata.io</a>
                </p>
              </div>
            </div>
          )}

          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: hint }} />
            <input
              type="text" placeholder="Search news…" value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: inputBg,
                border: `1px solid ${border}`, borderRadius: 12,
                padding: '11px 16px 11px 40px', fontSize: 13,
                color: text, outline: 'none', boxSizing: 'border-box',
                transition: 'background 0.3s, border-color 0.3s',
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 20 }}>
            {categories.map(cat => (
              <button key={cat} className="cat-btn" onClick={() => setSelectedCat(cat)}
                style={{
                  padding: '7px 14px', borderRadius: 30, border: '1px solid', fontSize: 12, fontWeight: 600, flexShrink: 0,
                  background: selectedCat === cat ? '#C8102E' : surface2,
                  color: selectedCat === cat ? 'white' : text2,
                  borderColor: selectedCat === cat ? 'transparent' : border,
                }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 40, height: 40, border: '3px solid rgba(255,179,0,0.15)', borderTopColor: '#C8102E', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: hint, fontSize: 13 }}>Fetching latest LIC news…</p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#C8102E', fontSize: 14, marginBottom: 16 }}>{error}</p>
              <button onClick={fetchNews} style={{ padding: '10px 24px', borderRadius: 30, border: 'none', background: 'linear-gradient(90deg,#FFB300,#C8102E)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
                Retry
              </button>
            </div>
          )}

          {/* Articles */}
          {!loading && !error && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: hint }}>
                  <Newspaper size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p style={{ fontSize: 14 }}>No articles match your search</p>
                </div>
              ) : filtered.map((a, i) => (
                <a key={i} href={a.link} target="_blank" rel="noreferrer"
                  className="news-card"
                  style={{
                    display: 'block', textDecoration: 'none', color: 'inherit',
                    background: surface, border: `1px solid ${border}`,
                    borderRadius: 16, overflow: 'hidden', transition: 'background 0.3s, border-color 0.3s',
                  }}>
                  <div style={{ padding: '18px 20px' }}>
                    {/* Category + date */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={11} color={CAT_COLORS[a.category] || '#FFB300'} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[a.category] || '#FFB300' }}>{a.category || 'News'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Clock size={11} color={hint} />
                        <span style={{ fontSize: 11, color: hint }}>{formatDate(a.pubDate)}</span>
                        <span style={{ fontSize: 10, color: hint, marginLeft: 4 }}>· {a.source}</span>
                      </div>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4, marginBottom: 8, color: text }}>{a.title}</h3>
                    {a.description && (
                      <p style={{ fontSize: 12, color: text2, lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {a.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 12, color: '#FFB300', fontWeight: 600 }}>
                      Read full article <ExternalLink size={11} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Press Release link */}
          <div style={{ marginTop: 32, padding: '20px', background: D ? 'rgba(255,179,0,0.05)' : 'rgba(255,179,0,0.06)', border: '1px solid rgba(255,179,0,0.15)', borderRadius: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: text2, marginBottom: 10 }}>Official LIC Press Releases &amp; Office Hours</p>
            <a href="https://licindia.in/press-release" target="_blank" rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 30, border: 'none', background: 'linear-gradient(90deg,#FFB300,#C8102E)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Visit LIC India Official Site <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
