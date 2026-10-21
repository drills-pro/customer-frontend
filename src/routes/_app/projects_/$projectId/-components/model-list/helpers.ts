/** Accuracy is stored as a percent; one decimal is the precision that matters. */
export function formatAccuracy(accuracy: number) {
  return `${accuracy.toFixed(1)}%`;
}

/** Macro F1 is a 0–1 ratio, conventionally shown to three decimals. */
export function formatF1(f1: number) {
  return f1.toFixed(3);
}
