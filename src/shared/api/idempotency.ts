import { useRef } from 'react';

/** The header core-api replays an answer under, so a retry of one attempt never makes a second record. */
export const IDEMPOTENCY_HEADER = 'Idempotency-Key';

export const newIdempotencyKey = (): string => crypto.randomUUID();

/**
 * Keys for one form's attempts. `keyFor(signature)` returns the same key while the signature is unchanged and a fresh one when it
 * changes; `renew()` forces a fresh key. Call them from event handlers, never during render.
 */
export function useIdempotencyKey() {
  const current = useRef<{ signature: string; key: string } | null>(null);
  const keyFor = (signature: string): string => {
    const held = current.current;
    if (held && held.signature === signature) return held.key;
    const key = newIdempotencyKey();
    current.current = { signature, key };
    return key;
  };
  const renew = () => {
    current.current = null;
  };
  return { keyFor, renew };
}
