import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DrillsProvider } from '@/provider';
import { TENANTS } from '@/showcase/tenants';

const read = () => {
  try {
    return localStorage.getItem('drills-theme');
  } catch {
    return null;
  }
};

interface Ctx {
  theme: string;
  setTheme: (n: string) => void;
}
const PreviewCtx = createContext<Ctx | null>(null);

/** Owns the tenant preview theme (switched in /showcase) and wraps the app in DrillsProvider with it. */
export function PreviewThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState(() => {
    const t = read();
    return t && t in TENANTS ? t : 'drills.pro';
  });
  const setTheme = useCallback((n: string) => {
    setThemeState(n);
    try {
      localStorage.setItem('drills-theme', n);
    } catch {
      /* private mode */
    }
  }, []);
  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return (
    <PreviewCtx.Provider value={value}>
      <DrillsProvider tenant={TENANTS[theme] ?? null}>{children}</DrillsProvider>
    </PreviewCtx.Provider>
  );
}

export function usePreviewTheme(): Ctx {
  const v = useContext(PreviewCtx);
  if (!v) throw new Error('usePreviewTheme must be used inside <PreviewThemeProvider>');
  return v;
}
