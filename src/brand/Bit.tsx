import { Box, type BoxProps } from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import BitGen, { type BitFrameOptions, type BitPose } from './bit-sprites.js';
import { useTenant } from '../tenant/TenantTheme';

const GRID = 32;
const warnScale = (size: number, grid = GRID) => {
  if (import.meta.env.DEV && size % grid !== 0)
    console.warn(`[drills.pro] pixel art must scale by whole numbers: ${size}px is not a multiple of ${grid}px`);
};
const usePrefersReducedMotion = () => {
  const [r, setR] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setR(q.matches);
    q.addEventListener('change', f);
    return () => q.removeEventListener('change', f);
  }, []);
  return r;
};
/** The tenant's primary becomes Bit's accent; drills.pro itself keeps the sprite's own orange. */
const useAccent = (accent?: string | null) => {
  const t = useTenant();
  return accent !== undefined ? accent : t.isDefault ? null : t.accent;
};

type Common = Omit<BoxProps, 'children'> & { size?: number; accent?: string | null; label?: string };

function Sprite({ svg, size, label, ...rest }: { svg: string; size: number; label: string } & Omit<BoxProps, 'children'>) {
  return (
    <Box
      data-pixel
      role="img"
      aria-label={label}
      width={`${size}px`}
      height={`${size}px`}
      flexShrink={0}
      css={{ '& svg': { width: '100%', height: '100%', display: 'block' } }}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...rest}
    />
  );
}

/** Bit in one of five poses. Sizes: 128 (sprite-4x), 192, 256. */
export function Bit({ pose = 'idle', size = 128, accent, label, ...rest }: Common & { pose?: BitPose }) {
  warnScale(size);
  const a = useAccent(accent);
  const svg = useMemo(() => BitGen.frame({ pose, accent: a }), [pose, a]);
  return <Sprite svg={svg} size={size} label={label ?? `Bit, ${pose}`} {...rest} />;
}

/** The app icon (t = 0 of the morph) with its transparent-ground rim. */
export function AppIcon({ size = 64, accent, label = 'drills.pro', mask = false, ...rest }: Common & { mask?: boolean }) {
  warnScale(size);
  const a = useAccent(accent);
  const svg = useMemo(() => BitGen.frame({ t: 0, accent: a, mask }), [a, mask]);
  return <Sprite svg={svg} size={size} label={label} {...rest} />;
}

/** Live morph or training loop at 12 fps; a still pose when the user prefers reduced motion. */
export function BitAnimated({
  timeline = 'morph',
  size = 128,
  accent,
  label,
  paused = false,
  ...rest
}: Common & { timeline?: 'morph' | 'train'; paused?: boolean }) {
  warnScale(size);
  const a = useAccent(accent);
  const reduced = usePrefersReducedMotion();
  const [time, setTime] = useState(0);
  useEffect(() => {
    if (reduced || paused) return;
    const start = performance.now();
    const id = window.setInterval(() => setTime((performance.now() - start) / 1000), 83);
    return () => window.clearInterval(id);
  }, [reduced, paused]);
  const opts: BitFrameOptions =
    reduced || paused ? { pose: timeline === 'train' ? 'train' : 'idle' } : BitGen.TL[timeline].at(Math.floor(time * 12) / 12);
  const svg = BitGen.frame({ ...opts, accent: a });
  return <Sprite svg={svg} size={size} label={label ?? (timeline === 'train' ? 'Training in progress' : 'drills.pro')} {...rest} />;
}

/** Pixel wordmark. Height is a whole multiple of its 9px grid (default 27px = 3x). */
export function Wordmark({ scale = 3, ink, ...rest }: Omit<BoxProps, 'children'> & { scale?: number; ink?: string }) {
  const svg = useMemo(() => BitGen.wordmark(ink ?? 'currentColor'), [ink]);
  return (
    <Box
      data-pixel
      role="img"
      aria-label="drills.pro"
      color="ink"
      height={`${9 * scale}px`}
      width={`${42 * scale}px`}
      css={{ '& svg': { width: '100%', height: '100%', display: 'block' } }}
      dangerouslySetInnerHTML={{ __html: svg }}
      {...rest}
    />
  );
}
