import { useState } from 'react';
import { Badge, Box, Button, Checkbox, HStack, Icon, IconButton, Stack, Text } from '@chakra-ui/react';
import { Shuffle } from 'pixelarticons/react';
import { bounceGentle, bounceRelaxed } from '@/theme/motion';
import { Page, Section } from '@/showcase/parts';

/** The bounce as a 40x40 plot: time left to right, progress bottom to top. It touches the dashed end line and rebounds below it. */
const Curve = ({ pts }: { pts: number[] }) => (
  <svg viewBox="-2 -14 44 56" width="44" height="56" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="0" x2="40" y1="0" y2="0" strokeDasharray="2 3" strokeWidth="1" />
    <polyline points={pts.map((v, i) => `${(i / (pts.length - 1)) * 40},${40 - v * 40}`).join(' ')} />
  </svg>
);

const SHAPES = [
  { key: 'out', suffix: '', use: 'arriving or responding: hover, press, appear' },
  { key: 'in', suffix: '-in', use: 'leaving: dismiss, close' },
  { key: 'inOut', suffix: '-in-out', use: 'moving between two visible places' },
] as const;
const STYLES = [
  { name: 'bounce-relaxed', curves: bounceRelaxed, note: 'Small things, 250ms. Deep rebounds (about 20%).' },
  {
    name: 'bounce-gentle',
    curves: bounceGentle,
    note: 'Big things, 550ms. Shallow rebounds (about 10%), so a large element never looks sloppy.',
  },
] as const;

/** Setting --ui-ease on a subtree is the one way to pick a bounce; every transition below it follows. */
function Row({ name, duration, use, pts, go }: { name: string; duration: string; use: string; pts: number[]; go: boolean }) {
  return (
    <HStack gap="4" align="center">
      <Box w="11" flexShrink="0" color="fg.muted">
        <Curve pts={pts} />
      </Box>
      <Stack gap="1" flex="1" minW="0" css={{ '--ui-ease': `var(--chakra-easings-${name})` }}>
        <Text fontFamily="mono" textStyle="mono-sm">
          {name}
        </Text>
        <Text color="fg.muted" textStyle="label">
          {use}
        </Text>
        <Box position="relative" h="4" bg="bg.subtle" borderRadius="pill" mt="1">
          <Box
            position="absolute"
            top="0"
            h="4"
            w="4"
            borderRadius="pill"
            bg="brand.solid"
            insetInlineStart={go ? 'calc(100% - 1rem)' : '0'}
            transitionProperty="inset-inline-start"
            transitionDuration={duration}
          />
        </Box>
      </Stack>
    </HStack>
  );
}

export function Motion() {
  const [go, setGo] = useState(false);
  const [rolls, setRolls] = useState(0);
  return (
    <Page
      title="Motion"
      lead="One feel everywhere: two bounces from epiceasing.com. Relaxed (deep rebounds, short) for small feedback, gentle (shallow rebounds, long) for big surfaces. Every transition and animation in the theme uses them, so nothing is tuned per component."
    >
      <Section title="Bounces" wide>
        <Stack gap="5">
          {STYLES.map((st) => (
            <Stack key={st.name} gap="4">
              <Text textStyle="label" color="fg.muted">
                {st.note}
              </Text>
              {SHAPES.map((sh) => (
                <Row key={sh.key} name={st.name + sh.suffix} duration={st.name} use={sh.use} pts={st.curves[sh.key]} go={go} />
              ))}
            </Stack>
          ))}
          <Box>
            <Button variant="solid" onClick={() => setGo((g) => !g)}>
              {go ? 'Play back' : 'Play'}
            </Button>
          </Box>
        </Stack>
      </Section>

      <Section title="Live in the theme">
        <Stack gap="4">
          <HStack gap="3">
            <IconButton variant="hint" aria-label="Roll" onClick={() => setRolls((n) => n + 1)}>
              <Icon key={rolls} data-bounce={rolls ? '' : undefined}>
                <Shuffle />
              </Icon>
            </IconButton>
            <Text color="fg.muted">Hint button: hover for a brand color and a small zoom, click to bounce.</Text>
          </HStack>
          <Checkbox.Root defaultChecked>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Checkbox, switch, tabs and menus follow the same curve</Checkbox.Label>
          </Checkbox.Root>
        </Stack>
      </Section>

      <Section title="Rules">
        <Stack gap="2">
          <Text>
            <Badge colorPalette="brand">Relaxed</Badge> is the default for every transition, set once in the theme.
          </Text>
          <Text>
            <Badge colorPalette="brand">Gentle</Badge> is for large surfaces and entrances:{' '}
            <code>animationTimingFunction=&quot;bounce-gentle&quot;</code> with <code>animationDuration=&quot;bounce-gentle&quot;</code>.
          </Text>
          <Text>
            Pick the shape by what the element does: <code>-in</code> when it leaves, <code>-in-out</code> when it moves between two visible
            places, no suffix otherwise (the default). The site's out-in shape is left out: it stalls at 50% and jumps at the end.
          </Text>
          <Text color="fg.muted">Duration is free to tune per use; the curve is not.</Text>
        </Stack>
      </Section>
    </Page>
  );
}
