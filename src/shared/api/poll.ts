/** Backoff for pages that follow a server job (an import, a training run) until it settles. */
export const POLL_BASE_MS = 3000;
export const POLL_MAX_MS = 15000;
const POLL_FACTOR = 1.5;

/** Delay before the next poll: grows from POLL_BASE_MS by 1.5x per answer already received, capped at POLL_MAX_MS. */
export const pollDelay = (answers: number) => Math.min(POLL_BASE_MS * POLL_FACTOR ** answers, POLL_MAX_MS);
