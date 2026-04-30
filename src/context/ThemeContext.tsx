'use client';
import { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  toggleTheme: () => void;
}

// Read theme synchronously (runs once at module load time on client)
function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return true; // SSR → dark default
  const saved = localStorage.getItem('lic-theme');
  return saved !== null ? saved === 'dark' : true; // default dark
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  setIsDark: () => {},
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize synchronously from localStorage — no flicker
  const [isDark, setIsDarkState] = useState<boolean>(getInitialTheme);

  // Apply data-theme attribute on mount and on every change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Also apply immediately on first mount in case of SSR mismatch
  useEffect(() => {
    const saved = localStorage.getItem('lic-theme');
    const dark = saved !== null ? saved === 'dark' : true;
    if (dark !== isDark) setIsDarkState(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setIsDark = (v: boolean) => {
    setIsDarkState(v);
    localStorage.setItem('lic-theme', v ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light');
  };

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, setIsDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
