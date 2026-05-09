'use client';
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, Clock, Flame, ChevronRight } from 'lucide-react';
import { searchPlans, getPlansByCategory } from '@/lib/plan-utils';
import { LIC_PLANS, POPULAR_PLAN_IDS, CATEGORY_META } from '@/data/lic-plans';
import type { LICPlanConfig, PlanCategory } from '@/types/lic-plans';

// ── Props ─────────────────────────────────────────────────────────────────────

interface PlanSelectorProps {
  /** Currently selected plan ID */
  value: string;
  /** Called when user selects a plan */
  onChange: (planId: string, plan: LICPlanConfig) => void;
  /** Show validation errors */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Restrict to one category */
  categoryFilter?: PlanCategory;
  /** Theme props */
  isDark: boolean;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  text2: string;
  hint: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const RECENT_KEY = 'lic_plan_selector_recent';
const MAX_RECENT = 5;

const ALL_CATEGORIES: Array<{ id: PlanCategory | 'all'; label: string; emoji: string }> = [
  { id: 'all', label: 'All Plans', emoji: '🏛️' },
  { id: 'term', label: 'Term', emoji: '🛡️' },
  { id: 'endowment', label: 'Endowment', emoji: '💎' },
  { id: 'moneyback', label: 'Money Back', emoji: '💵' },
  { id: 'whole-life', label: 'Whole Life', emoji: '♾️' },
  { id: 'pension', label: 'Pension', emoji: '👴' },
  { id: 'ulip', label: 'ULIP', emoji: '📈' },
  { id: 'children', label: 'Children', emoji: '👶' },
  { id: 'health', label: 'Health', emoji: '🏥' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlanSelector({
  value, onChange, error, placeholder = 'Search policy name or number…',
  categoryFilter, isDark, surface, surface2, border, text, text2, hint,
}: PlanSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PlanCategory | 'all'>(categoryFilter ?? 'all');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected plan
  const selected = useMemo(() => LIC_PLANS.find(p => p.id === value), [value]);

  // Load recent from localStorage
  useEffect(() => {
    try {
      const r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
      setRecentIds(Array.isArray(r) ? r.slice(0, MAX_RECENT) : []);
    } catch { setRecentIds([]); }
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Derived: search results or categorized list
  const searchResults = useMemo(() => {
    const opts = activeCategory !== 'all' ? { category: activeCategory } : {};
    if (query.trim()) {
      return searchPlans(query, opts).map(r => r.plan);
    }
    return activeCategory !== 'all'
      ? getPlansByCategory(activeCategory)
      : LIC_PLANS;
  }, [query, activeCategory]);

  // Popular + recent plan objects
  const popularPlans = useMemo(() =>
    POPULAR_PLAN_IDS.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
  []);
  const recentPlans = useMemo(() =>
    recentIds.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
  [recentIds]);

  // Flat list for keyboard nav
  const flatList = useMemo(() => {
    if (query.trim()) return searchResults;
    const seen = new Set<string>();
    const out: LICPlanConfig[] = [];
    [...recentPlans, ...popularPlans, ...searchResults].forEach(p => {
      if (!seen.has(p.id)) { seen.add(p.id); out.push(p); }
    });
    return out;
  }, [query, searchResults, recentPlans, popularPlans]);

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelectorAll('[data-plan-item]')[focusedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  function openDropdown() {
    setOpen(true);
    setFocusedIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function closeDropdown() {
    setOpen(false);
    setQuery('');
    setFocusedIndex(-1);
  }

  function selectPlan(plan: LICPlanConfig) {
    onChange(plan.id, plan);
    closeDropdown();
    // Save to recent
    const next = [plan.id, ...recentIds.filter(id => id !== plan.id)].slice(0, MAX_RECENT);
    setRecentIds(next);
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'Enter' || e.key === ' ') openDropdown(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIndex(i => Math.min(i + 1, flatList.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && focusedIndex >= 0) { e.preventDefault(); selectPlan(flatList[focusedIndex]); }
    else if (e.key === 'Escape') closeDropdown();
  }, [open, focusedIndex, flatList]);

  const catMeta = selected ? CATEGORY_META[selected.category] : null;
  const visibleCategories = categoryFilter
    ? ALL_CATEGORIES.filter(c => c.id === 'all' || c.id === categoryFilter)
    : ALL_CATEGORIES;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} onKeyDown={handleKeyDown}>
      {/* ── Trigger ── */}
      <button
        type="button"
        onClick={openDropdown}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 16px', borderRadius: 14, cursor: 'pointer', textAlign: 'left',
          border: `1.5px solid ${error ? '#EF4444' : open ? '#C8102E' : border}`,
          background: surface, color: text, boxSizing: 'border-box',
          boxShadow: open ? '0 0 0 3px rgba(200,16,46,0.1)' : error ? '0 0 0 3px rgba(239,68,68,0.1)' : 'none',
          transition: 'all 0.2s',
        }}
      >
        {selected ? (
          <>
            <span style={{ fontSize: 22, flexShrink: 0, lineHeight: 1 }}>{selected.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.policyName}
              </div>
              <div style={{ fontSize: 11, color: text2, marginTop: 1 }}>
                Plan No. {selected.policyNumber}
                {catMeta && <> · <span style={{ color: catMeta.color }}>{catMeta.label}</span></>}
              </div>
            </div>
            {selected.tag && (
              <span style={{ padding: '3px 8px', borderRadius: 20, background: `${catMeta?.color}20`, color: catMeta?.color, fontSize: 10, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
                {selected.tag}
              </span>
            )}
          </>
        ) : (
          <>
            <Search size={16} color={hint} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: 14, color: hint }}>{placeholder}</span>
          </>
        )}
        <ChevronDown size={15} color={hint} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {error && <p style={{ fontSize: 11, color: '#EF4444', marginTop: 5, fontWeight: 500 }}>{error}</p>}

      {/* ── Dropdown ── */}
      {open && (
        <div role="listbox" style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 1000,
          background: surface, border: `1.5px solid ${border}`, borderRadius: 18,
          boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.6)' : '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column', maxHeight: 460, overflow: 'hidden',
        }}>

          {/* Search bar */}
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Search size={14} color={hint} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setFocusedIndex(-1); }}
              placeholder={`Search "${placeholder}"`}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: text, caretColor: '#C8102E' }}
              autoComplete="off"
            />
            {query && (
              <button onClick={() => { setQuery(''); setFocusedIndex(-1); inputRef.current?.focus(); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: hint, display: 'flex', padding: 2, borderRadius: 4 }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Category tabs */}
          {!categoryFilter && (
            <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: `1px solid ${border}`, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
              {visibleCategories.map(cat => (
                <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setFocusedIndex(-1); }}
                  style={{
                    padding: '5px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                    border: 'none',
                    background: activeCategory === cat.id ? '#C8102E' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    color: activeCategory === cat.id ? '#fff' : text2,
                    transition: 'all 0.15s',
                  }}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div ref={listRef} style={{ overflowY: 'auto', flex: 1 }}>
            {query.trim() ? (
              /* ── Search results ── */
              searchResults.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                  <Search size={32} color={hint} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                  <p style={{ fontSize: 13, color: hint }}>No plans match "<strong>{query}</strong>"</p>
                  <p style={{ fontSize: 11, color: hint, marginTop: 4 }}>Try policy number, e.g. "815"</p>
                </div>
              ) : (
                <>
                  <SectionLabel icon={<Search size={11} />} label={`${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`} color={hint} />
                  {searchResults.map((plan, i) => (
                    <PlanItem key={plan.id} plan={plan} selected={value === plan.id} focused={focusedIndex === i}
                      onSelect={selectPlan} text={text} text2={text2} hint={hint} isDark={isDark} query={query} />
                  ))}
                </>
              )
            ) : (
              /* ── Default: Recent + Popular + Category ── */
              <>
                {recentPlans.length > 0 && (
                  <section>
                    <SectionLabel icon={<Clock size={11} />} label="Recently Viewed" color={hint} />
                    {recentPlans.map((plan, i) => (
                      <PlanItem key={plan.id} plan={plan} selected={value === plan.id} focused={focusedIndex === i}
                        onSelect={selectPlan} text={text} text2={text2} hint={hint} isDark={isDark} />
                    ))}
                  </section>
                )}

                <section>
                  <SectionLabel icon={<Flame size={11} />} label="Popular Plans" color={hint} />
                  {popularPlans
                    .filter(p => activeCategory === 'all' || p.category === activeCategory)
                    .map((plan, i) => (
                      <PlanItem key={plan.id} plan={plan} selected={value === plan.id}
                        focused={focusedIndex === (recentPlans.length + i)}
                        onSelect={selectPlan} text={text} text2={text2} hint={hint} isDark={isDark} />
                    ))}
                </section>

                {/* Grouped by category when "all" selected */}
                {activeCategory === 'all' ? (
                  ALL_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                    const plans = getPlansByCategory(cat.id as PlanCategory).filter(p => !POPULAR_PLAN_IDS.includes(p.id));
                    if (plans.length === 0) return null;
                    return (
                      <section key={cat.id}>
                        <SectionLabel icon={<span style={{ fontSize: 11 }}>{cat.emoji}</span>} label={cat.label} color={hint} />
                        {plans.map(plan => (
                          <PlanItem key={plan.id} plan={plan} selected={value === plan.id} focused={false}
                            onSelect={selectPlan} text={text} text2={text2} hint={hint} isDark={isDark} />
                        ))}
                      </section>
                    );
                  })
                ) : (
                  <section>
                    <SectionLabel icon={<ChevronRight size={11} />} label="All Plans" color={hint} />
                    {getPlansByCategory(activeCategory as PlanCategory)
                      .filter(p => !POPULAR_PLAN_IDS.includes(p.id))
                      .map(plan => (
                        <PlanItem key={plan.id} plan={plan} selected={value === plan.id} focused={false}
                          onSelect={selectPlan} text={text} text2={text2} hint={hint} isDark={isDark} />
                      ))}
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
      {icon}{label}
    </div>
  );
}

function PlanItem({ plan, selected, focused, onSelect, text, text2, hint: _hint, isDark, query }: {
  plan: LICPlanConfig; selected: boolean; focused: boolean;
  onSelect: (p: LICPlanConfig) => void;
  text: string; text2: string; hint: string; isDark: boolean;
  query?: string;
}) {
  const meta = CATEGORY_META[plan.category];

  function highlight(str: string) {
    if (!query) return <>{str}</>;
    const idx = str.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return <>{str}</>;
    return (
      <>{str.slice(0, idx)}<mark style={{ background: `${meta.color}30`, color: meta.color, borderRadius: 2, padding: '0 1px' }}>{str.slice(idx, idx + query.length)}</mark>{str.slice(idx + query.length)}</>
    );
  }

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      data-plan-item
      onClick={() => onSelect(plan)}
      style={{
        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '10px 14px', border: 'none', cursor: 'pointer', textAlign: 'left',
        background: selected ? `${meta.color}12` : focused ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : 'none',
        borderLeft: `3px solid ${selected ? meta.color : 'transparent'}`,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => { if (!selected && !focused) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
      onMouseLeave={e => { if (!selected && !focused) (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{plan.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: selected ? 700 : 600, color: selected ? meta.color : text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {highlight(plan.policyName)}
          </span>
          <span style={{ fontSize: 10, color: text2, flexShrink: 0 }}>No. {highlight(plan.policyNumber)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: `${meta.color}18`, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
            {meta.emoji} {meta.label}
          </span>
          <span style={{ fontSize: 11, color: text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {plan.tagline}
          </span>
        </div>
        <div style={{ fontSize: 10, color: text2, marginTop: 3 }}>
          {plan.startingPremium} · Ages {plan.validation.minAge}–{plan.validation.maxAge}
        </div>
      </div>
      {plan.tag && (
        <span style={{ padding: '2px 8px', borderRadius: 10, background: `${meta.color}20`, color: meta.color, fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
          {plan.tag}
        </span>
      )}
    </button>
  );
}
