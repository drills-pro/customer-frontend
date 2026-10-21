import * as React from 'react';

import { DASHBOARD_STORAGE_KEY } from './data';
import type { ThemePreference } from './domain/types';

export type ResolvedTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function resolveTheme(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

/** Puts the resolved theme on `<html>`, where the tokens in styles.css read it. */
export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove(theme === 'dark' ? 'light' : 'dark');
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

/**
 * Runs before first paint (see `__root.tsx`) so a dark choice never flashes
 * light while the app hydrates. It must stay self-contained: it is serialized
 * into an inline script, not bundled.
 */
export const themeBootScript = `(function(){try{var t='light';try{var s=JSON.parse(localStorage.getItem(${JSON.stringify(DASHBOARD_STORAGE_KEY)})||'{}');if(s&&(s.theme==='dark'||s.theme==='system'))t=s.theme}catch(e){}if(t==='system')t=matchMedia(${JSON.stringify(DARK_QUERY)}).matches?'dark':'light';var r=document.documentElement;r.classList.add(t);r.style.colorScheme=t}catch(e){}})()`;

/**
 * Keeps `<html>` in sync with the saved preference, following the OS while it
 * is "system". Waits for hydration: before that the preferences are defaults
 * and would overwrite what the boot script applied.
 */
export function useApplyTheme(preference: ThemePreference, hydrated: boolean) {
  React.useEffect(() => {
    if (!hydrated) return;
    const media = window.matchMedia(DARK_QUERY);
    const sync = () => applyTheme(resolveTheme(preference, media.matches));
    sync();
    if (preference !== 'system') return;
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [preference, hydrated]);
}

function subscribeToRootClass(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  return () => observer.disconnect();
}

/** The theme currently on `<html>`, for widgets that style themselves (toasts). */
export function useResolvedTheme(): ResolvedTheme {
  return React.useSyncExternalStore(
    subscribeToRootClass,
    () => (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
    () => 'light',
  );
}
