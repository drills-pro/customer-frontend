// Bounces from epiceasing.com (kind: bounce), exported as 12-step keyframes and normalized to progress 0..1.
// A bounce lands on the target and rebounds off it, never past it. Three shapes per style:
//   out    decelerates into the target, rebounding off it: the default, for anything arriving or responding.
//   in     rebounds in place, then rushes to the target: for anything leaving.
//   inOut  rebounds near the start, crosses the middle fast, rebounds near the end: for moves between two visible places.
// (The site's "out-in" shape sits at 50% and then jumps, so it is not used.) The theme tokens and the Motion showcase share these numbers.
const progress = (values: number[], from = -50, to = 50) => values.map((v) => Math.round(((v - from) / (to - from)) * 1000) / 1000);

/** 3 bounces, stiffness 1.5: shallow rebounds (about 10% deep). Long (550ms) on large surfaces, where a deep bounce looks sloppy. */
export const bounceGentle = {
  out: progress([-180, 74.256, 158.307, 142.637, 163.101, 178.771, 176.788, 177.827, 179.471, 179.805, 179.762, 179.906, 180], -180, 180),
  in: progress([-50, -49.974, -49.934, -49.946, -49.853, -49.396, -49.108, -49.659, -45.306, -39.621, -43.974, -20.627, 50]),
  inOut: progress([-50, -49.967, -49.927, -49.554, -47.653, -46.987, 0, 46.987, 47.653, 49.554, 49.927, 49.967, 50]),
};
/** 4 bounces, stiffness 1.0: deep rebounds (about 20% deep). Short (250ms) on small controls. */
export const bounceRelaxed = {
  out: progress([-50, 29.686, 30.076, 36.182, 50, 46.106, 48.418, 49.546, 49.37, 49.872, 49.874, 49.913, 50]),
  in: progress([-50, -49.913, -49.874, -49.872, -49.37, -49.546, -48.418, -46.106, -50, -36.182, -30.076, -29.686, 50]),
  inOut: progress([-50, -49.937, -49.685, -49.209, -50, -40.038, 0, 40.038, 50, 49.209, 49.685, 49.937, 50]),
};

/** The same samples as a function of time, for libraries that take a JS easing (recharts). */
export const bounceFn = (pts: number[]) => (t: number) => {
  const x = Math.min(Math.max(t, 0), 1) * (pts.length - 1);
  const i = Math.min(Math.floor(x), pts.length - 2);
  return pts[i] + (pts[i + 1] - pts[i]) * (x - i);
};

/** Spread onto every recharts series (Line, Bar, Area, Pie, ...): marks grow on the gentle bounce, since a chart is a large surface. */
export const chartMotion = {
  isAnimationActive: true,
  animationDuration: matchMedia('(prefers-reduced-motion: reduce)').matches ? 200 : 550,
  animationEasing: bounceFn(bounceGentle.out),
} as const;

export const linearEasing = (pts: number[]) => `linear(${pts.join(', ')})`;
