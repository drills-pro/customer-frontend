import { rawColors, roleColors } from './tokens.generated';

type V = { value: string | { _light: string; _dark: string }; description?: string };
const c = (name: string) => `{colors.${name}}`;
const both = (v: string) => ({ value: { _light: v, _dark: v } });
const tint = (name: string, pct: number) => ({ value: `{colors.${name}/${pct}}` });

/** Chakra colorPalette shape: every palette exposes these slots, so `colorPalette="brand"` works on any component. */
function palette(o: { solid: string; contrast: string; fg: string; subtle: V; muted: V; emphasized: V; border: string; DEFAULT?: V }) {
  return {
    ...(o.DEFAULT ? { DEFAULT: o.DEFAULT } : {}),
    solid: both(c(o.solid)), contrast: both(c(o.contrast)), fg: both(c(o.fg)),
    subtle: o.subtle, muted: o.muted, emphasized: o.emphasized,
    border: both(c(o.border)), focusRing: both(c('focus')),
  };
}

const roles = roleColors as unknown as Record<string, V>;
// Role tokens whose names become palettes are nested under DEFAULT.
const nested = new Set(['brand', 'lens', 'night', 'warning', 'danger', 'success', 'info']);
const flatRoles = Object.fromEntries(Object.entries(roles).filter(([k]) => !nested.has(k)));

export const semanticColors = {
  ...flatRoles,

  // ---- drills.pro palettes
  brand: palette({ DEFAULT: roles.brand, solid: 'brand', contrast: 'on-brand', fg: 'brand-text', subtle: both(c('brand-soft')), muted: both(c('brand-soft')), emphasized: tint('brand', 40), border: 'brand-text' }),
  lens: palette({ DEFAULT: roles.lens, solid: 'lens', contrast: 'on-lens', fg: 'lens', subtle: tint('lens', 12), muted: tint('lens', 20), emphasized: tint('lens', 32), border: 'lens' }),
  night: palette({ DEFAULT: roles.night, solid: 'night', contrast: 'on-night', fg: 'ink', subtle: both(c('surface-sunken')), muted: both(c('line')), emphasized: both(c('line-strong')), border: 'ink' }),
  danger: palette({ DEFAULT: roles.danger, solid: 'danger', contrast: 'on-danger', fg: 'danger', subtle: tint('danger', 12), muted: tint('danger', 20), emphasized: tint('danger', 32), border: 'danger' }),
  warning: palette({ DEFAULT: roles.warning, solid: 'warning', contrast: 'surface', fg: 'warning', subtle: tint('warning', 14), muted: tint('warning', 22), emphasized: tint('warning', 34), border: 'warning' }),
  success: { DEFAULT: roles.success, ...palette({ solid: 'lens', contrast: 'on-lens', fg: 'success', subtle: tint('lens', 12), muted: tint('lens', 20), emphasized: tint('lens', 32), border: 'success' }) },
  info: { DEFAULT: roles.info, ...palette({ solid: 'focus', contrast: 'surface', fg: 'info', subtle: tint('focus', 12), muted: tint('focus', 20), emphasized: tint('focus', 32), border: 'info' }) },

  // Template names as palettes too: colorPalette="primary" | "secondary"
  primary: { DEFAULT: roles.primary, ...palette({ solid: 'brand', contrast: 'on-brand', fg: 'brand-text', subtle: both(c('brand-soft')), muted: both(c('brand-soft')), emphasized: tint('brand', 40), border: 'brand-text' }) },
  secondary: { DEFAULT: roles.secondary, ...palette({ solid: 'lens', contrast: 'on-lens', fg: 'lens', subtle: tint('lens', 12), muted: tint('lens', 20), emphasized: tint('lens', 32), border: 'lens' }) },

  // Chakra's own palettes, remapped so third-party snippets stay on-brand
  orange: palette({ solid: 'brand', contrast: 'on-brand', fg: 'brand-text', subtle: both(c('brand-soft')), muted: both(c('brand-soft')), emphasized: tint('brand', 40), border: 'brand-text' }),
  teal: palette({ solid: 'lens', contrast: 'on-lens', fg: 'lens', subtle: tint('lens', 12), muted: tint('lens', 20), emphasized: tint('lens', 32), border: 'lens' }),
  red: palette({ solid: 'danger', contrast: 'on-danger', fg: 'danger', subtle: tint('danger', 12), muted: tint('danger', 20), emphasized: tint('danger', 32), border: 'danger' }),
  gray: palette({ solid: 'ink', contrast: 'surface', fg: 'ink', subtle: both(c('surface-sunken')), muted: both(c('line')), emphasized: both(c('line-strong')), border: 'line-strong' }),

  // ---- Chakra's semantic slots, pointed at the drills.pro roles
  bg: {
    DEFAULT: both(c('surface')), subtle: both(c('surface-sunken')), muted: both(c('surface-sunken')), emphasized: both(c('line')),
    inverted: both(c('ink')), panel: both(c('surface-raised')),
    error: tint('danger', 12), warning: tint('warning', 14), success: tint('lens', 12), info: tint('focus', 12),
  },
  fg: {
    DEFAULT: both(c('ink')), muted: both(c('ink-muted')), subtle: both(c('ink-muted')), inverted: both(c('surface')),
    error: both(c('danger')), warning: both(c('warning')), success: both(c('success')), info: both(c('info')),
  },
  border: {
    DEFAULT: both(c('line')), muted: both(c('line')), subtle: both(c('line')), emphasized: both(c('control-border')),
    inverted: both(c('ink')), error: both(c('danger')), warning: both(c('warning')), success: both(c('success')), info: both(c('info')),
  },
};

export const tokenColors = rawColors;
