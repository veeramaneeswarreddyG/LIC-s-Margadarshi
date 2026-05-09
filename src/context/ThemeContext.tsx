'use client';
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: false,   // light is the SSR-safe default
  setIsDark: () => {},
  toggleTheme: () => {},
  mounted: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // ALWAYS start with false (light) on BOTH server and client.
  // Reading localStorage in useState() causes hydration mismatch because
  // localStorage is undefined on the server.
  const [isDark, setIsDarkState] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // After mount (client-only), read the real preference from localStorage.
  // This is safe because it runs only in the browser, after hydration.
  useEffect(() => {
    const saved = localStorage.getItem('lic-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = saved !== null ? saved === 'dark' : prefersDark;
    setIsDarkState(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    setMounted(true);
  }, []);

  // Sync data-theme attribute whenever theme changes after mount
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark, mounted]);

  const setIsDark = (v: boolean) => {
    setIsDarkState(v);
    localStorage.setItem('lic-theme', v ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light');
  };

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
