/**
 * Theme template: five inputs per color mode -> every role and control color, with WCAG 2 checks.
 * Same algorithm as the design system's ThemeTemplate card.
 */
export type ColorMode = 'light' | 'dark';
export interface TemplateInput { background: string; primary: string; secondary: string; warning: string; 'font-color': string }
export interface TenantTemplate { tenant: string; light: TemplateInput; dark: TemplateInput }
export interface Check { fg: string; bg: string; need: number; ratio: number; ok: boolean }
export interface DerivedTheme { mode: ColorMode; tokens: Record<string, string>; checks: Check[]; notes: string[]; suggest: { primary: string } | null; ok: boolean }

const hex = (h: string) => { let s = String(h).trim().replace('#', ''); if (s.length === 3) s = s.split('').map((c) => c + c).join(''); return ('#' + s.slice(0, 6)).toUpperCase(); };
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(hex(h).slice(i, i + 2), 16));
const lum = (h: string) => { const [r, g, b] = rgb(h).map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const mix = (a: string, b: string, t: number) => { const A = rgb(a), B = rgb(b); return ('#' + A.map((c, i) => Math.round(c * (1 - t) + B[i] * t).toString(16).padStart(2, '0')).join('')).toUpperCase(); };
const minRatio = (c: string, grounds: string[]) => Math.min(...grounds.map((g) => ratio(c, g)));
const fit = (c: string, to: string, grounds: string[], need: number) => { for (let t = 0; t <= 1.0001; t += 0.02) { const m = mix(c, to, t); if (minRatio(m, grounds) >= need) return { value: m, moved: Math.round(t * 100) }; } return { value: hex(to), moved: 100 }; };
const best = (fill: string, cands: string[]) => cands.reduce((a, b) => (ratio(b, fill) > ratio(a, fill) ? b : a));
const INK = '#0E1320', PAPER = '#FBFAF7';

export const DRILLS_TEMPLATE: TenantTemplate = {
  tenant: 'drills-pro',
  light: { background: PAPER, primary: '#FF6A1A', secondary: '#0A7066', warning: '#8A5A00', 'font-color': INK },
  dark: { background: INK, primary: '#FF6A1A', secondary: '#2DD4BF', warning: '#F5B83D', 'font-color': PAPER },
};

export function deriveTheme(input: TemplateInput, mode?: ColorMode): DerivedTheme {
  const i = { background: hex(input.background), primary: hex(input.primary), secondary: hex(input.secondary), warning: hex(input.warning), fontColor: hex(input['font-color']) };
  const m: ColorMode = mode ?? (lum(i.background) > 0.3 ? 'light' : 'dark');
  const L = m === 'light', notes: string[] = [];
  const bg = i.background;
  const raised = L ? mix(bg, '#FFFFFF', 1) : mix(bg, i.fontColor, 0.06);
  const sunken = L ? mix(bg, i.fontColor, 0.04) : mix(bg, '#000000', 0.3);
  const S = [bg, raised, sunken];
  const brandSoft = mix(bg, i.primary, L ? 0.16 : 0.24);
  const T4 = [...S, brandSoft];
  const extreme = L ? '#000000' : '#FFFFFF';
  let ink = i.fontColor;
  if (minRatio(ink, T4) < 4.5) { const f = fit(ink, extreme, T4, 4.5); notes.push(`font-color moved ${f.moved}% toward ${extreme} to reach 4.5:1`); ink = f.value; }
  let muted = ink; for (let t = 0; t <= 0.6; t += 0.02) { const c = mix(ink, bg, t); if (minRatio(c, T4) >= 5) muted = c; else break; }
  const line = mix(bg, ink, L ? 0.2 : 0.18);
  const lineStrong = fit(bg, ink, S, 3.1).value;
  const brand = i.primary;
  const outline = lum(ink) < lum(bg) ? ink : bg;
  const onBrand = best(brand, [ink, bg, INK, '#FFFFFF']);
  let suggest: { primary: string } | null = null;
  if (ratio(onBrand, brand) < 4.5) {
    const away = lum(onBrand) > 0.5 ? '#000000' : '#FFFFFF';
    suggest = { primary: fit(brand, away, [onBrand], 4.5).value };
    notes.push(`no text color reaches 4.5:1 on primary (best ${ratio(onBrand, brand).toFixed(2)}); try ${suggest.primary}`);
  }
  const brandText = fit(brand, ink, T4, 4.5); if (brandText.moved) notes.push(`primary moved ${brandText.moved}% toward font-color for brand-text`);
  const lens = fit(i.secondary, ink, S, 4.5); if (lens.moved) notes.push(`secondary moved ${lens.moved}% toward font-color to be text-safe`);
  const warn = fit(i.warning, ink, S, 4.5); if (warn.moved) notes.push(`warning moved ${warn.moved}% toward font-color to be text-safe`);
  const danger = fit(L ? '#B3202A' : '#FF8A90', ink, S, 4.5).value;
  const focus = fit(L ? '#2457D6' : '#8DB4FF', ink, T4, 3).value;
  const night = L ? ink : mix(bg, ink, 0.14);
  const t: Record<string, string> = {
    background: bg, primary: brand, secondary: lens.value, warning: warn.value, 'font-color': ink,
    surface: bg, 'surface-raised': raised, 'surface-sunken': sunken, ink, 'ink-muted': muted, line, 'line-strong': lineStrong, outline,
    brand, 'on-brand': onBrand, 'brand-text': brandText.value, 'brand-soft': brandSoft, night, 'on-night': best(night, [bg, ink, PAPER, INK]),
    lens: lens.value, 'on-lens': best(lens.value, [ink, bg, INK, '#FFFFFF']), focus, success: lens.value, danger, 'on-danger': best(danger, [ink, bg, INK, '#FFFFFF']), info: focus,
    'control-bg': raised, 'control-border': lineStrong, 'selected-bg': brandSoft, 'selected-edge': brandText.value,
  };
  const checks: Check[] = [];
  const chk = (fg: string, grounds: string[], need: number) => grounds.forEach((g) => { const r = ratio(t[fg], t[g]); checks.push({ fg, bg: g, need, ratio: +r.toFixed(2), ok: r >= need }); });
  const SN = ['surface', 'surface-raised', 'surface-sunken'];
  chk('ink', [...SN, 'brand-soft'], 4.5); chk('ink-muted', [...SN, 'brand-soft'], 4.5); chk('brand-text', [...SN, 'brand-soft'], 4.5);
  chk('lens', SN, 4.5); chk('warning', SN, 4.5); chk('danger', SN, 4.5);
  chk('on-brand', ['brand'], 4.5); chk('on-lens', ['lens'], 4.5); chk('on-danger', ['danger'], 4.5); chk('on-night', ['night'], 4.5);
  chk('control-border', SN, 3); chk('focus', [...SN, 'brand-soft'], 3); chk('selected-edge', ['selected-bg'], 3);
  SN.forEach((g) => { const r = Math.max(ratio(t.brand, t[g]), ratio(t.outline, t[g])); checks.push({ fg: 'brand or outline', bg: g, need: 3, ratio: +r.toFixed(2), ok: r >= 3 }); });
  return { mode: m, tokens: t, checks, notes, suggest, ok: checks.every((c) => c.ok) };
}

/** CSS custom properties Chakra reads, e.g. { '--chakra-colors-brand-text': '#A84B1C' }. */
export function toChakraVars(d: DerivedTheme, prefix = 'chakra'): Record<string, string> {
  return Object.fromEntries(Object.entries(d.tokens).map(([k, v]) => [`--${prefix}-colors-${k}`, v]));
}

/** Static CSS for a tenant (server-rendered or written at build time). Assumes Chakra's class-based color mode. */
export function tenantCss(tpl: TenantTemplate, selector = `[data-tenant="${tpl.tenant}"]`, prefix = 'chakra'): string {
  const block = (sel: string, d: DerivedTheme) => `${sel} {\n${Object.entries(toChakraVars(d, prefix)).map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
  return [block(`:root${selector}, :root${selector}.light`, deriveTheme(tpl.light, 'light')), block(`:root${selector}.dark`, deriveTheme(tpl.dark, 'dark'))].join('\n');
}
