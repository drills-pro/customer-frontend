/**
 * Display formatting for values the API sends raw: ISO times, byte counts,
 * milliseconds. Pure functions; `now` is a parameter so callers can test them.
 */

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function elapsed(iso: string, now: number) {
  const then = new Date(iso).getTime()
  return Number.isNaN(then) ? undefined : Math.max(0, now - then)
}

/** `Just now`, `5m ago`, `2h ago`, `3d ago`, then a date. */
export function relativeTime(iso: string, now = Date.now()) {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const minutes = Math.floor((now - then) / MINUTE)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(then).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function plural(count: number, unit: string) {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`
}

/** `just now`, `5 minutes ago`, `2 hours ago`, `6 days ago`, `3 weeks ago`, `4 months ago`. */
export function relativeTimeLong(iso: string, now = Date.now()) {
  const diff = elapsed(iso, now)
  if (diff === undefined) return ''
  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) return plural(Math.floor(diff / MINUTE), 'minute')
  if (diff < DAY) return plural(Math.floor(diff / HOUR), 'hour')
  const days = Math.floor(diff / DAY)
  if (days < 14) return plural(days, 'day')
  if (days < 63) return plural(Math.floor(days / 7), 'week')
  return plural(Math.floor(days / 30), 'month')
}

/** `12 Jun 2026`. */
export function formatDate(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** `12 Jun`. */
export function formatDayMonth(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Relative inside a week (`2h ago`), a short date after that (`12 Jun`). */
export function recentOrDayMonth(iso: string, now = Date.now()) {
  const diff = elapsed(iso, now)
  if (diff === undefined) return ''
  return diff < 7 * DAY ? relativeTime(iso, now) : formatDayMonth(iso)
}

const byteUnits = ['B', 'KB', 'MB', 'GB', 'TB']

/** Decimal units, one decimal under ten: `4.2 GB`, `520 MB`, `2 KB`. */
export function formatBytes(bytes: number) {
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < byteUnits.length - 1) {
    value /= 1000
    unit += 1
  }
  const rounded = value < 10 ? Math.round(value * 10) / 10 : Math.round(value)
  return `${rounded} ${byteUnits[unit]}`
}

/** `82 ms`, or `82ms` with `compact`. */
export function formatMs(ms: number, { compact = false } = {}) {
  return `${Math.round(ms)}${compact ? '' : ' '}ms`
}

/** `142,380`. */
export function formatCount(value: number) {
  return value.toLocaleString('en-US')
}

/** `$12.40`. */
export function formatUsd(value: number) {
  return `$${value.toFixed(2)}`
}

/** `182000` reads `182k`. */
export function compactCount(value: number) {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  })
    .format(value)
    .toLowerCase()
}

/** What the API sends where the UI shows an em dash. */
export const EMPTY = '—'
