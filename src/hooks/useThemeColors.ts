'use client';

/**
 * useThemeColors — SSR-safe theme color hook
 *
 * Returns light-theme values on the server (and before mount) so that
 * server-rendered HTML matches the initial client render exactly.
 * After mount, returns the real user preference from localStorage.
 *
 * Usage:
 *   const T = useThemeColors();
 *   <div style={{ background: T.bg, color: T.text }}>
 */

import { useTheme } from '@/context/ThemeContext';

export interface ThemeColors {
  /** True only after client mount — theme is accurate */
  mounted: boolean;
  isDark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  text2: string;
  hint: string;
  headerBg: string;
  headerBorder: string;
  modalBg: string;
  shadow: string;
  shadowDark: string;
  inputBg: string;
  hoverBg: string;
}

export function useThemeColors(): ThemeColors {
  const { isDark, mounted } = useTheme();
  const D = mounted && isDark;

  return {
    mounted,
    isDark: D,
    bg:           D ? '#0F1117'              : '#F3F4F6',
    surface:      D ? '#161B27'              : '#FFFFFF',
    surface2:     D ? '#1E2436'              : '#F8F9FA',
    border:       D ? 'rgba(255,255,255,0.07)' : '#DADCE0',
    text:         D ? '#E2E8F0'              : '#202124',
    text2:        D ? '#94A3B8'              : '#5F6368',
    hint:         D ? '#64748B'              : '#9AA0A6',
    headerBg:     D ? 'rgba(22,27,39,0.95)'  : 'rgba(255,255,255,0.95)',
    headerBorder: D ? 'rgba(255,255,255,0.07)' : '#DADCE0',
    modalBg:      D ? 'rgba(0,0,0,0.7)'      : 'rgba(0,0,0,0.4)',
    shadow:       D ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(60,64,67,0.08)',
    shadowDark:   D ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(60,64,67,0.12)',
    inputBg:      D ? 'rgba(255,255,255,0.06)' : '#F1F3F4',
    hoverBg:      D ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
  };
}
