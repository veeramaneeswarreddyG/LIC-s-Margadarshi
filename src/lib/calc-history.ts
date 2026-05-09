import type { CalcInput, CalcResult } from '@/lib/premium-engine';

export interface CalcHistoryItem {
  id: string;
  timestamp: number;
  input: CalcInput;
  premium: number;
  maturity: number;
  deathBenefit: number;
  planName: string;
  planType: string;
  roi: number;
  favorite: boolean;
  aiInsight: string;
}

const STORAGE_KEY = 'lic_calc_history';

function read(): CalcHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}

function write(items: CalcHistoryItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function saveCalculation(input: CalcInput, result: CalcResult): CalcHistoryItem {
  const item: CalcHistoryItem = {
    id: `calc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    input: { ...input },
    premium: result.annualPremium,
    maturity: result.maturityBenefit,
    deathBenefit: result.deathBenefit,
    planName: result.planName,
    planType: input.planType,
    roi: result.roi,
    favorite: false,
    aiInsight: result.aiInsight,
  };
  const items = read();
  items.unshift(item);
  // Keep max 100 items
  write(items.slice(0, 100));
  return item;
}

export function getHistory(): CalcHistoryItem[] {
  return read();
}

export function toggleFavorite(id: string): CalcHistoryItem[] {
  const items = read();
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) items[idx].favorite = !items[idx].favorite;
  write(items);
  return items;
}

export function deleteItem(id: string): CalcHistoryItem[] {
  const items = read().filter(i => i.id !== id);
  write(items);
  return items;
}

export function clearHistory(): CalcHistoryItem[] {
  write([]);
  return [];
}

export function duplicateItem(id: string): { items: CalcHistoryItem[]; input: CalcInput | null } {
  const items = read();
  const found = items.find(i => i.id === id);
  return { items, input: found ? { ...found.input } : null };
}
