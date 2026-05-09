'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, Star, Clock, TrendingUp } from 'lucide-react';
import { LIC_PLANS, searchPlans, POPULAR_PLAN_IDS, CATEGORY_META } from '@/data/lic-plans';
import type { LICPlanConfig } from '@/types/lic-plans';

interface Props {
  value: string;           // planId
  onChange: (planId: string) => void;
  isDark: boolean;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  text2: string;
  hint: string;
}

export default function PlanSearchSelector({ value, onChange, isDark, surface, surface2, border, text, text2, hint }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = LIC_PLANS.find(p => p.id === value);

  // Load recent from localStorage
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem('lic_recent_plans') || '[]');
      setRecentIds(r.slice(0, 3));
    } catch {}
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => searchPlans(query), [query]);

  const popular = useMemo(() =>
    POPULAR_PLAN_IDS.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
  []);

  const recent = useMemo(() =>
    recentIds.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
  [recentIds]);

  function select(plan: LICPlanConfig) {
    onChange(plan.id);
    setOpen(false);
    setQuery('');
    // Save to recent
    const next = [plan.id, ...recentIds.filter(id => id !== plan.id)].slice(0, 5);
    setRecentIds(next);
    try { localStorage.setItem('lic_recent_plans', JSON.stringify(next)); } catch {}
  }

  function openDropdown() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const catMeta = selected ? CATEGORY_META[selected.category] : null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button onClick={openDropdown} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 16px', borderRadius: 14, cursor: 'pointer',
        border: `1.5px solid ${open ? '#C8102E' : border}`,
        background: surface, color: text, textAlign: 'left',
        transition: 'border-color 0.2s', boxSizing: 'border-box',
        boxShadow: open ? '0 0 0 3px rgba(200,16,46,0.1)' : 'none',
      }}>
        {selected ? (
          <>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{selected.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selected.policyName}
              </div>
              <div style={{ fontSize: 11, color: text2, marginTop: 1 }}>
                Plan No. {selected.policyNumber} · {catMeta?.label}
              </div>
            </div>
            {selected.tag && (
              <span style={{ padding: '3px 8px', borderRadius: 20, background: `${catMeta?.color}20`, color: catMeta?.color, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                {selected.tag}
              </span>
            )}
          </>
        ) : (
          <>
            <Search size={16} color={hint} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: hint }}>Search policy name or number…</span>
          </>
        )}
        <ChevronDown size={16} color={hint} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 999,
          background: surface, border: `1.5px solid ${border}`, borderRadius: 16,
          boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.15)',
          maxHeight: 420, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Search input */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} color={hint} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search "Jeevan Anand", "854", "term"…'
              style={{
                flex: 1, background: 'none', border: 'none', outline: 'none',
                fontSize: 13, color: text, caretColor: '#C8102E',
              }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: hint, display: 'flex', padding: 2 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* Results list */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
            {query ? (
              results.length === 0 ? (
                <div style={{ padding: '20px 16px', textAlign: 'center', color: hint, fontSize: 13 }}>
                  No plans found for "{query}"
                </div>
              ) : (
                <>
                  <SectionLabel label={`${results.length} result${results.length !== 1 ? 's' : ''}`} color={hint} />
                  {results.map(p => <PlanRow key={p.id} plan={p} selected={value === p.id} onSelect={select} text={text} text2={text2} hint={hint} surface2={surface2} border={border} />)}
                </>
              )
            ) : (
              <>
                {recent.length > 0 && (
                  <>
                    <SectionLabel label="Recent" icon={<Clock size={11} />} color={hint} />
                    {recent.map(p => <PlanRow key={p.id} plan={p} selected={value === p.id} onSelect={select} text={text} text2={text2} hint={hint} surface2={surface2} border={border} />)}
                  </>
                )}
                <SectionLabel label="Popular Plans" icon={<TrendingUp size={11} />} color={hint} />
                {popular.map(p => <PlanRow key={p.id} plan={p} selected={value === p.id} onSelect={select} text={text} text2={text2} hint={hint} surface2={surface2} border={border} />)}
                <SectionLabel label="All Plans" icon={<Star size={11} />} color={hint} />
                {LIC_PLANS.filter(p => !POPULAR_PLAN_IDS.includes(p.id)).map(p =>
                  <PlanRow key={p.id} plan={p} selected={value === p.id} onSelect={select} text={text} text2={text2} hint={hint} surface2={surface2} border={border} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label, icon, color }: { label: string; icon?: React.ReactNode; color: string }) {
  return (
    <div style={{ padding: '6px 14px 4px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
      {icon}{label}
    </div>
  );
}

function PlanRow({ plan, selected, onSelect, text, text2, hint, surface2, border }: {
  plan: LICPlanConfig; selected: boolean; onSelect: (p: LICPlanConfig) => void;
  text: string; text2: string; hint: string; surface2: string; border: string;
}) {
  const meta = CATEGORY_META[plan.category];
  return (
    <button onClick={() => onSelect(plan)} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
      background: selected ? `${meta.color}12` : 'none', border: 'none', cursor: 'pointer',
      borderLeft: selected ? `3px solid ${meta.color}` : '3px solid transparent',
      transition: 'background 0.15s',
    }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.04)'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      <span style={{ fontSize: 18, flexShrink: 0 }}>{plan.emoji}</span>
      <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: selected ? 700 : 600, color: selected ? meta.color : text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {plan.policyName}
        </div>
        <div style={{ fontSize: 11, color: text2, marginTop: 1 }}>
          No. {plan.policyNumber} · {meta.label} · {plan.startingPremium}
        </div>
      </div>
      {plan.tag && (
        <span style={{ padding: '2px 7px', borderRadius: 10, background: `${meta.color}18`, color: meta.color, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
          {plan.tag}
        </span>
      )}
    </button>
  );
}
