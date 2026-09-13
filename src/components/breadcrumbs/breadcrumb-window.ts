export type BreadcrumbWindow = {
  start: number
  end: number
  hasPrev: boolean
  hasNext: boolean
  maxPage: number
}

/**
 * Pages through `total` crumbs `size` at a time, newest first. Page 0 is the
 * last `size` items; each further page steps `size` items back, clamping the
 * oldest window to the first `size` items.
 */
export function getBreadcrumbWindow(
  total: number,
  page: number,
  size = 3,
): BreadcrumbWindow {
  const maxPage = Math.max(0, Math.ceil((total - size) / size))
  const current = Math.min(Math.max(page, 0), maxPage)

  let end = total - current * size
  let start = end - size
  if (start < 0) {
    start = 0
    end = Math.min(size, total)
  }

  return { start, end, hasPrev: start > 0, hasNext: end < total, maxPage }
}
