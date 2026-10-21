/** Display formatting for training configuration values. */

/** `1h 20m`, or `45m` under an hour. */
export function formatDuration(hours: number) {
  const minutes = Math.round(hours * 60);
  const wholeHours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return wholeHours ? `${wholeHours}h ${String(remainder).padStart(2, '0')}m` : `${minutes}m`;
}

/** `1e-3`, `2.5e-4`. */
export function formatLearningRate(value: number) {
  return value.toExponential(1).replace('.0e', 'e');
}
