import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { DRILLS_TEMPLATE, deriveTheme, toChakraVars, type DerivedTheme, type TenantTemplate } from './derive';

interface TenantCtx { template: TenantTemplate; derived: { light: DerivedTheme; dark: DerivedTheme }; accent: string; isDefault: boolean }
const Ctx = createContext<TenantCtx | null>(null);

/**
 * Applies a tenant's five-color template to the whole app by overriding Chakra's color variables on <html>.
 * Overrides sit on the same element as Chakra's own token declarations, so every palette and alias that
 * references them (brand.solid, colorPalette.*, bg.subtle, ...) re-resolves to the tenant's values.
 * A template that fails any contrast check is not applied (strict) and falls back to drills.pro.
 */
export function TenantTheme({ template, strict = true, children }: { template?: TenantTemplate | null; strict?: boolean; children?: ReactNode }) {
  const { resolvedTheme } = useTheme();
  const tpl = template ?? DRILLS_TEMPLATE;
  const derived = useMemo(() => ({ light: deriveTheme(tpl.light, 'light'), dark: deriveTheme(tpl.dark, 'dark') }), [tpl]);
  const usable = !template || !strict || (derived.light.ok && derived.dark.ok);
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    const root = document.documentElement;
    if (!template || !usable) { root.removeAttribute('data-tenant'); return; }
    const vars = toChakraVars(derived[mode]);
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
    root.setAttribute('data-tenant', tpl.tenant);
    if (import.meta.env.DEV) for (const m of ['light', 'dark'] as const) if (!derived[m].ok) console.warn(`[drills.pro] tenant "${tpl.tenant}" ${m} theme fails contrast`, derived[m].checks.filter((c) => !c.ok), derived[m].notes);
    return () => { for (const k of Object.keys(vars)) root.style.removeProperty(k); root.removeAttribute('data-tenant'); };
  }, [template, usable, derived, mode, tpl.tenant]);

  if (template && !usable && import.meta.env.DEV) console.warn(`[drills.pro] tenant "${tpl.tenant}" rejected: fix the failing pairs or pass strict={false}`);
  const value = useMemo<TenantCtx>(() => ({ template: usable ? tpl : DRILLS_TEMPLATE, derived, accent: usable ? tpl[mode].primary : DRILLS_TEMPLATE[mode].primary, isDefault: !template || !usable }), [tpl, derived, usable, mode, template]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTenant(): TenantCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTenant must be used inside <DrillsProvider>');
  return v;
}
