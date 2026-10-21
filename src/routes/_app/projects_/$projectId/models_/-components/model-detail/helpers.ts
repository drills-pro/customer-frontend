import type { Model } from '@/features/dashboard/data';

export type Delta = { text: string; tone: 'up' | 'down' | 'flat' };

const first: Delta = { text: 'first version', tone: 'flat' };

/** Parses the leading number out of a display string like `82 ms`. */
function ms(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function signed(diff: number, format: (value: number) => string): Delta {
  if (diff === 0) return { text: 'unchanged', tone: 'flat' };
  return {
    text: `${diff > 0 ? '▲' : '▼'} ${format(Math.abs(diff))}`,
    tone: diff > 0 ? 'up' : 'down',
  };
}

/**
 * How each headline metric moved against the previous version. Tone is the
 * direction of change, not whether it is good — latency improving is a `down`.
 */
export function versionDeltas(model: Model, previous?: Model) {
  if (!previous) {
    return { accuracy: first, f1: first, latency: first, size: first };
  }

  const latencyNow = ms(model.latencyP95);
  const latencyBefore = ms(previous.latencyP95);
  const label = `v${previous.version}`;

  return {
    accuracy: withSuffix(
      signed(Number((model.accuracy - previous.accuracy).toFixed(1)), (value) => `${value.toFixed(1)} pts`),
      label,
    ),
    f1: withSuffix(
      signed(Number((model.f1 - previous.f1).toFixed(3)), (value) => value.toFixed(3)),
      label,
    ),
    latency:
      latencyNow === undefined || latencyBefore === undefined
        ? first
        : withSuffix(
            signed(latencyNow - latencyBefore, (value) => `${value} ms`),
            label,
          ),
    size:
      model.size === previous.size
        ? { text: 'unchanged', tone: 'flat' as const }
        : withSuffix({ text: `was ${previous.size}`, tone: 'flat' }, ''),
  };
}

function withSuffix(delta: Delta, label: string): Delta {
  if (delta.tone === 'flat' || !label) return delta;
  return { ...delta, text: `${delta.text} vs ${label}` };
}

/**
 * Whether a lower number is the better one, so the delta can be colored by
 * outcome rather than by arithmetic direction.
 */
export const lowerIsBetter = { latency: true, accuracy: false, f1: false };
