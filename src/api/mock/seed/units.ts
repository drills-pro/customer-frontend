/** Helpers that keep seed data readable: sizes in bytes, times as ISO strings. */

export const kb = (value: number) => Math.round(value * 1e3);
export const mb = (value: number) => Math.round(value * 1e6);
export const gb = (value: number) => Math.round(value * 1e9);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/**
 * Seeds are placed relative to the moment the mock loads, so "2 hours ago"
 * stays two hours ago on every fresh load.
 */
export const SEED_NOW = Date.now();

const before = (ms: number) => new Date(SEED_NOW - ms).toISOString();

export const minutesAgo = (value: number) => before(value * MINUTE);
export const hoursAgo = (value: number) => before(value * HOUR);
export const daysAgo = (value: number) => before(value * DAY);
export const weeksAgo = (value: number) => before(value * 7 * DAY);

/** A calendar date at midday UTC, so it reads the same in every time zone. */
export const onDate = (isoDate: string) => `${isoDate}T12:00:00.000Z`;
