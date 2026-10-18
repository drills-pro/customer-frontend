import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';
import { recipes, slotRecipes } from './recipes';
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
    '*, *::before, *::after': { _motionReduce: { animationDuration: '0.01ms !important', transitionDuration: '0.01ms !important' } },
  },
  theme: {
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
      durations: { pixel: { value: pixelValues['pixel-step'] } },
      easings: { pixel: { value: pixelValues['pixel-timing'] } },
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
