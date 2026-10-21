import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { recipes, slotRecipes } from './recipes';
import { linearEasing, bounceGentle, bounceRelaxed } from './motion';
import { semanticColors, tokenColors } from './semantic-colors';
import { fontFamilies, radiusValues, shadowValues, textStyleValues, pixelValues } from './tokens.generated';

const famToken: Record<string, string> = { sans: 'body', mono: 'mono', display: 'display' };
const textStyles = Object.fromEntries(
  Object.entries(textStyleValues).map(([name, s]) => [
    name,
    { description: s.description, value: { ...s.value, fontFamily: famToken[s.value.fontFamily] ?? 'body' } },
  ]),
);

const sh = (v: { _light: string; _dark: string }) => ({ value: v });

export const config = defineConfig({
  // Chakra's default is "chakra"; kept so community snippets and devtools work unchanged.
  cssVarsPrefix: 'chakra',
  globalCss: {
    html: {
      colorPalette: 'brand',
      '--focus-ring-width': '3px',
      '--focus-ring-offset': '2px',
      bg: 'bg',
      color: 'fg',
      fontFamily: 'body',
      textStyle: 'body',
    },
    '*::selection': { bg: 'brand-soft', color: 'ink' },
    '*::placeholder, *[data-placeholder]': { color: 'fg.muted', opacity: 1 },
    // Pixel art: never smoothed.
    '[data-pixel], [data-pixel] svg, [data-pixel] img': { imageRendering: 'pixelated', shapeRendering: 'crispEdges' },
    // Every transition bounces, including Chakra's built-in `transition="backgrounds"` presets that hardcode a bezier.
    // A subtree picks another curve by setting --ui-ease (the Motion showcase does).
    ':root': { '--ui-ease': 'var(--chakra-easings-bounce-relaxed)' },
    '*, *::before, *::after': {
      transitionTimingFunction: 'var(--ui-ease) !important',
      _motionReduce: { animationDuration: '200ms !important', transitionDuration: '200ms !important' },
    },
  },
  theme: {
    keyframes: {
      // Entrance for cards and alerts. Timing comes from the bounces.
      'rise-in': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
      // Rises from a crouch; the bounce easing supplies the landing and rebounds.
      'icon-bounce': {
        from: { transform: 'translateY(8px) scale(0.8, 1.15)' },
        to: { transform: 'none' },
      },
    },
    tokens: {
      colors: tokenColors as never,
      fonts: {
        body: { value: fontFamilies.body },
        heading: { value: fontFamilies.heading },
        mono: { value: fontFamilies.mono },
        display: { value: fontFamilies.display },
      },
      radii: {
        sm: { value: radiusValues.sm },
        md: { value: radiusValues.md },
        lg: { value: radiusValues.lg },
        pill: { value: radiusValues.pill },
      },
      // Each bounce has its own length. relaxed rebounds deep, so it stays short and small; gentle rebounds shallow, so it can run long on big things.
      durations: {
        pixel: { value: pixelValues['pixel-step'] },
        'bounce-gentle': { value: '550ms' },
        'bounce-relaxed': { value: '250ms' },
      },
      // Two bounces. relaxed (deep rebounds, short): small feedback (hover, press, toggle). gentle (shallow rebounds, long): large surfaces.
      // Chakra's own easing names point at them, so every component that uses an easing token bounces too.
      easings: {
        pixel: { value: pixelValues['pixel-timing'] },
        // `bounce-gentle` and `bounce-relaxed` are the out shape (arrivals, the default); -in is for leaving, -in-out for moves.
        'bounce-gentle': { value: linearEasing(bounceGentle.out) },
        'bounce-gentle-in': { value: linearEasing(bounceGentle.in) },
        'bounce-gentle-in-out': { value: linearEasing(bounceGentle.inOut) },
        'bounce-relaxed': { value: linearEasing(bounceRelaxed.out) },
        'bounce-relaxed-in': { value: linearEasing(bounceRelaxed.in) },
        'bounce-relaxed-in-out': { value: linearEasing(bounceRelaxed.inOut) },
        'ease-in': { value: '{easings.bounce-relaxed-in}' },
        'ease-out': { value: '{easings.bounce-relaxed}' },
        'ease-in-out': { value: '{easings.bounce-relaxed-in-out}' },
        'ease-in-smooth': { value: '{easings.bounce-gentle}' },
      },
      sizes: {
        'sprite-1x': { value: pixelValues['sprite-1x'] },
        'sprite-4x': { value: pixelValues['sprite-4x'] },
        'sprite-6x': { value: pixelValues['sprite-6x'] },
        'sprite-8x': { value: pixelValues['sprite-8x'] },
        'favicon-1x': { value: pixelValues['favicon-1x'] },
      },
    },
    semanticTokens: {
      colors: semanticColors as never,
      radii: { l1: { value: '{radii.sm}' }, l2: { value: '{radii.md}' }, l3: { value: '{radii.lg}' } },
      shadows: {
        raised: sh(shadowValues.raised),
        pressed: sh(shadowValues.pressed),
        pop: sh(shadowValues.pop),
        // Chakra's scale, remapped: no blurred shadows anywhere.
        xs: sh(shadowValues.raised),
        sm: sh(shadowValues.raised),
        md: sh(shadowValues.pop),
        lg: sh(shadowValues.pop),
        xl: sh(shadowValues.pop),
        '2xl': sh(shadowValues.pop),
        inner: sh(shadowValues.pressed),
        inset: sh(shadowValues.pressed),
      },
    },
    textStyles: textStyles as never,
    recipes,
    slotRecipes,
  },
});

export const system = createSystem(defaultConfig, config);
export default system;
