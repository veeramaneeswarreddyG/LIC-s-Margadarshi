'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, Star, Clock, Plus, ChevronDown, Check, Flame } from 'lucide-react';
import { searchPlans } from '@/lib/plan-utils';
import { LIC_PLANS, POPULAR_PLAN_IDS, CATEGORY_META } from '@/data/lic-plans';
import type { LICPlanConfig } from '@/types/lic-plans';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const RECENT_KEY = 'lic_comparison_recent';
const FAVORITES_KEY = 'lic_comparison_favorites';
const MIN_PLANS = 2;
const MAX_PLANS = 5;

// â”€â”€ Props â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface Props {
  /** Selected plan IDs */
  value: string[];
  onChange: (planIds: string[]) => void;
  isDark: boolean;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  text2: string;
  hint: string;
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ComparisonPlanPicker({
  value, onChange, isDark, surface, surface2, border, text, text2, hint,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Hydrate persistent state
  useEffect(() => {
    try {
      setRecentIds(JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 6));
      setFavoriteIds(JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'));
    } catch {}
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedPlans = useMemo(
    () => value.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
    [value]
  );

  const popular = useMemo(
    () => POPULAR_PLAN_IDS.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
    []
  );

  const recent = useMemo(
    () => recentIds.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
    [recentIds]
  );

  const favorites = useMemo(
    () => favoriteIds.map(id => LIC_PLANS.find(p => p.id === id)).filter(Boolean) as LICPlanConfig[],
    [favoriteIds]
  );

  const searchResults = useMemo(
    () => query.trim() ? searchPlans(query).map(r => r.plan) : [],
    [query]
  );

  // â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  function toggle(planId: string) {
    let next: string[];
    if (value.includes(planId)) {
      next = value.filter(id => id !== planId);
    } else {
      if (value.length >= MAX_PLANS) return; // hard limit
      next = [...value, planId];
      // Save to recent
      const newRecent = [planId, ...recentIds.filter(id => id !== planId)].slice(0, 6);
      setRecentIds(newRecent);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(newRecent)); } catch {}
    }
    onChange(next);
  }

  function remove(planId: string) {
    onChange(value.filter(id => id !== planId));
  }

  function toggleFavorite(planId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next = favoriteIds.includes(planId)
      ? favoriteIds.filter(id => id !== planId)
      : [...favoriteIds, planId].slice(0, 10);
    setFavoriteIds(next);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch {}
  }

  function clearAll() { onChange([]); }

  function openPicker() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 40);
  }

  const canAddMore = value.length < MAX_PLANS;
  const isReady = value.length >= MIN_PLANS;

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div ref={containerRef} style={{ width: '100%' }}>

      {/* â”€â”€ Selected chips â”€â”€ */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: selectedPlans.length > 0 ? 12 : 0 }}>
        {selectedPlans.map(plan => {
          const meta = CATEGORY_META[plan.category];
          return (
            <div key={plan.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 20,
              background: `${meta.color}15`, border: `1.5px solid ${meta.color}40`,
              fontSize: 12, fontWeight: 700, color: meta.color,
              animation: 'chipIn 0.2s ease',
            }}>
              <span style={{ fontSize: 14 }}>{plan.emoji}</span>
              <span>{plan.policyName}</span>
              <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 500 }}>#{plan.policyNumber}</span>
              <button onClick={() => remove(plan.id)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: meta.color, display: 'flex', padding: '1px', marginLeft: 2, borderRadius: '50%',
              }}>
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* Add slot button */}
        {canAddMore && (
          <button onClick={openPicker} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
            border: `1.5px dashed ${open ? '#C8102E' : border}`,
            background: open ? 'rgba(200,16,46,0.05)' : 'none',
            color: open ? '#C8102E' : hint, fontSize: 12, fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <Plus size={13} />
            {selectedPlans.length === 0 ? 'Select plans to compare' : `Add plan (${value.length}/${MAX_PLANS})`}
          </button>
        )}

        {/* Clear all */}
        {value.length > 0 && (
          <button onClick={clearAll} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 11, color: hint, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px',
          }}>
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Status bar */}
      {value.length > 0 && (
        <div style={{
          fontSize: 11, color: isReady ? '#22c55e' : '#F59E0B', fontWeight: 600,
          marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          {isReady
            ? <><Check size={12} /> {value.length} plans selected â€” ready to compare</>
            : <><span>âš ï¸</span> Select at least {MIN_PLANS} plans to compare ({MIN_PLANS - value.length} more needed)</>
          }
        </div>
      )}

      {/* â”€â”€ Dropdown picker â”€â”€ */}
      {open && (
        <div style={{
          background: surface, border: `1.5px solid ${border}`, borderRadius: 18,
          boxShadow: isDark ? '0 12px 48px rgba(0,0,0,0.55)' : '0 8px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden', maxHeight: 460, display: 'flex', flexDirection: 'column',
        }}>
          {/* Search input */}
          <div style={{ padding: '11px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <Search size={14} color={hint} style={{ flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search policy name or numberâ€¦'
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: text, caretColor: '#C8102E' }}
              autoComplete="off"
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: hint, display: 'flex' }}>
                <X size={13} />
              </button>
            )}
            <button onClick={() => { setOpen(false); setQuery(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: hint, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              Done <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>

          {/* Limit notice */}
          {!canAddMore && (
            <div style={{ padding: '8px 14px', background: 'rgba(200,16,46,0.06)', fontSize: 11, color: '#C8102E', fontWeight: 600, flexShrink: 0, borderBottom: `1px solid ${border}` }}>
              âš¡ Maximum {MAX_PLANS} plans reached. Remove a plan to add another.
            </div>
          )}

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {query.trim() ? (
              /* Search results */
              searchResults.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: hint, fontSize: 13 }}>
                  No plans found for "<strong>{query}</strong>"
                </div>
              ) : (
                <>
                  <SectionLabel icon={<Search size={11} />} label={`${searchResults.length} results`} color={hint} />
                  {searchResults.map(plan => (
                    <PickerRow key={plan.id} plan={plan} selected={value.includes(plan.id)}
                      disabled={!canAddMore && !value.includes(plan.id)}
                      isFavorite={favoriteIds.includes(plan.id)}
                      onToggle={toggle} onFavorite={toggleFavorite}
                      text={text} text2={text2} hint={hint} border={border} isDark={isDark} query={query} />
                  ))}
                </>
              )
            ) : (
              <>
                {/* Favorites */}
                {favorites.length > 0 && (
                  <section>
                    <SectionLabel icon={<Star size={11} />} label="Favorites" color={hint} />
                    {favorites.map(plan => (
                      <PickerRow key={plan.id} plan={plan} selected={value.includes(plan.id)}
                        disabled={!canAddMore && !value.includes(plan.id)}
                        isFavorite={true} onToggle={toggle} onFavorite={toggleFavorite}
                        text={text} text2={text2} hint={hint} border={border} isDark={isDark} />
                    ))}
                  </section>
                )}

                {/* Recent comparisons */}
                {recent.length > 0 && (
                  <section>
                    <SectionLabel icon={<Clock size={11} />} label="Recently Compared" color={hint} />
                    {recent.map(plan => (
                      <PickerRow key={plan.id} plan={plan} selected={value.includes(plan.id)}
                        disabled={!canAddMore && !value.includes(plan.id)}
                        isFavorite={favoriteIds.includes(plan.id)}
                        onToggle={toggle} onFavorite={toggleFavorite}
                        text={text} text2={text2} hint={hint} border={border} isDark={isDark} />
                    ))}
                  </section>
                )}

                {/* Popular */}
                <section>
                  <SectionLabel icon={<Flame size={11} />} label="Popular Plans" color={hint} />
                  {popular.map(plan => (
                    <PickerRow key={plan.id} plan={plan} selected={value.includes(plan.id)}
                      disabled={!canAddMore && !value.includes(plan.id)}
                      isFavorite={favoriteIds.includes(plan.id)}
                      onToggle={toggle} onFavorite={toggleFavorite}
                      text={text} text2={text2} hint={hint} border={border} isDark={isDark} />
                  ))}
                </section>

                {/* All plans */}
                <section>
                  <SectionLabel icon={<ChevronDown size={11} />} label="All Plans" color={hint} />
                  {LIC_PLANS.filter(p => !POPULAR_PLAN_IDS.includes(p.id)).map(plan => (
                    <PickerRow key={plan.id} plan={plan} selected={value.includes(plan.id)}
                      disabled={!canAddMore && !value.includes(plan.id)}
                      isFavorite={favoriteIds.includes(plan.id)}
                      onToggle={toggle} onFavorite={toggleFavorite}
                      text={text} text2={text2} hint={hint} border={border} isDark={isDark} />
                  ))}
                </section>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes chipIn { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
      `}</style>
    </div>
  );
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionLabel({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <div style={{ padding: '8px 14px 4px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
      {icon} {label}
    </div>
  );
}

function PickerRow({ plan, selected, disabled, isFavorite, onToggle, onFavorite, text, text2, hint, border, isDark, query }: {
  plan: LICPlanConfig;
  selected: boolean;
  disabled: boolean;
  isFavorite: boolean;
  onToggle: (id: string) => void;
  onFavorite: (id: string, e: React.MouseEvent) => void;
  text: string; text2: string; hint: string; border: string; isDark: boolean;
  query?: string;
}) {
  const meta = CATEGORY_META[plan.category];

  function highlight(str: string) {
    if (!query) return <>{str}</>;
    const idx = str.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return <>{str}</>;
    return <>{str.slice(0, idx)}<mark style={{ background: `${meta.color}30`, color: meta.color, borderRadius: 2 }}>{str.slice(idx, idx + query.length)}</mark>{str.slice(idx + query.length)}</>;
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle(plan.id)}
      disabled={disabled && !selected}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', border: 'none', textAlign: 'left', cursor: disabled && !selected ? 'not-allowed' : 'pointer',
        background: selected ? `${meta.color}10` : 'none',
        borderLeft: `3px solid ${selected ? meta.color : 'transparent'}`,
        opacity: disabled && !selected ? 0.4 : 1,
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!selected && !disabled) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = 'none'; }}
    >
      {/* Checkbox */}
      <div style={{
        width: 18, height: 18, borderRadius: 6, flexShrink: 0,
        border: `2px solid ${selected ? meta.color : border}`,
        background: selected ? meta.color : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {selected && <Check size={11} color="#fff" strokeWidth={3} />}
      </div>

      <span style={{ fontSize: 18, flexShrink: 0 }}>{plan.emoji}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: selected ? 700 : 600, color: selected ? meta.color : text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {highlight(plan.policyName)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: text2 }}>No. {highlight(plan.policyNumber)}</span>
          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: `${meta.color}18`, color: meta.color, fontWeight: 700 }}>
            {meta.label}
          </span>
          <span style={{ fontSize: 10, color: text2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {plan.startingPremium}
          </span>
        </div>
      </div>

      {/* Favorite star */}
      <button
        type="button"
        onClick={e => onFavorite(plan.id, e)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0, color: isFavorite ? '#F59E0B' : hint, transition: 'color 0.15s' }}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Star size={14} fill={isFavorite ? '#F59E0B' : 'none'} />
      </button>

      {plan.tag && (
        <span style={{ padding: '2px 7px', borderRadius: 10, background: `${meta.color}18`, color: meta.color, fontSize: 9, fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap' }}>
          {plan.tag}
        </span>
      )}
    </button>
  );
}

