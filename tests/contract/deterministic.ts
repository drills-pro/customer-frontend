/**
 * Makes the mock answer the same bytes on every run, so its answers can be
 * committed as fixtures. Import it before anything from `src/api/mock`: the
 * seeds read the clock when they load (`SEED_NOW`), and ids and keys come
 * from `crypto`.
 */

/** The instant the contract fixtures are recorded at. */
export const FIXED_NOW = Date.UTC(2026, 0, 1);

const RealDate = Date;

class FixedDate extends RealDate {
  constructor(...args: unknown[]) {
    if (args.length === 0) super(FIXED_NOW);
    else super(...(args as [string | number | Date]));
  }

  static now() {
    return FIXED_NOW;
  }
}

globalThis.Date = FixedDate as DateConstructor;

let counter = 0;

/** Starts the id sequence over, so a request's ids don't depend on its order. */
export function resetDeterminism() {
  counter = 0;
}

function nextByte() {
  counter = (counter + 1) % 256;
  return counter;
}

Object.defineProperty(globalThis.crypto, 'randomUUID', {
  configurable: true,
  value: () => {
    const hex = Array.from({ length: 16 }, () => nextByte().toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  },
});

Object.defineProperty(globalThis.crypto, 'getRandomValues', {
  configurable: true,
  value: <T extends ArrayBufferView | null>(array: T): T => {
    if (array instanceof Uint8Array) array.forEach((_, i) => (array[i] = nextByte()));
    return array;
  },
});
