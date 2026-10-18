/**
 * The dashboard's metric history. core-api serves `/v1/dashboard` itself but
 * keeps no per-day history yet, so the trend and sparkline come from here.
 *
 * Each series ends at what the mock store holds today and is seeded, so a
 * reload draws the same curves.
 */
import type {
  ApiMetricHistory,
  ApiMetricSeries,
} from '@/features/dashboard/api/types'
import { route } from '../router'
import { daysAgo } from '../seed/units'
import { seededNoise } from '../seed/usage'
import { deployments, projects, trainingRuns } from '../store'
import { invalid } from './shared'

const MIN_DAYS = 7
const MAX_DAYS = 90

/** Calendar dates of the window, oldest first, ending today. */
function windowDates(days: number) {
  return Array.from({ length: days }, (_, index) =>
    daysAgo(days - 1 - index).slice(0, 10),
  )
}

function countSeries(dates: string[], values: number[]): ApiMetricSeries {
  return {
    points: dates.map((date, index) => ({ date, value: values[index] })),
    change: values[values.length - 1] - values[0],
    change_unit: 'count',
  }
}

/** A count that only grows, a step at a time, from `start` to `end`. */
function staircase(days: number, start: number, end: number, seed: number) {
  const nextNoise = seededNoise(seed)
  let floor = start
  return Array.from({ length: days }, (_, index) => {
    const trend = start + ((end - start) * index) / (days - 1)
    const value = Math.round(trend + (nextNoise() - 0.5) * 0.9)
    floor = Math.min(end, Math.max(floor, value))
    return index === days - 1 ? end : floor
  })
}

/**
 * A count that wanders up and down within `[0, max]`. Walked backwards from
 * today, so it lands exactly on `end`.
 */
function randomWalk(days: number, end: number, max: number, seed: number) {
  const nextNoise = seededNoise(seed)
  const values = [end]
  for (let index = 1; index < days; index += 1) {
    const step = Math.floor(nextNoise() * 3) - 1
    values.push(Math.min(max, Math.max(0, values[index - 1] + step)))
  }
  return values.reverse()
}

/** Daily request volume: a rising trend with quiet weekends. */
function inferenceCalls(dates: string[], seed: number): ApiMetricSeries {
  const nextNoise = seededNoise(seed)
  const start = 5200
  const end = 6900
  const values = dates.map((date, index) => {
    const trend = start + ((end - start) * index) / (dates.length - 1)
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay()
    const weekend = weekday === 0 || weekday === 6 ? 0.62 : 1
    return Math.round(trend * weekend * (0.9 + nextNoise() * 0.2))
  })

  // Last week against the first, so one quiet day does not swing the figure.
  const sum = (part: number[]) => part.reduce((total, value) => total + value)
  const first = sum(values.slice(0, 7))
  const last = sum(values.slice(-7))

  return {
    points: dates.map((date, index) => ({ date, value: values[index] })),
    change: first === 0 ? 0 : Math.round(((last - first) / first) * 100),
    change_unit: 'percent',
  }
}

route('GET', '/v1/dashboard/metrics/history', ({ query }) => {
  const days = Number(query.get('days') ?? 30)
  if (!Number.isInteger(days) || days < MIN_DAYS || days > MAX_DAYS) {
    invalid(`days must be a whole number from ${MIN_DAYS} to ${MAX_DAYS}`)
  }

  const dates = windowDates(days)
  const activeProjects = projects
    .all()
    .filter((project) => project.status === 'active').length
  const running = trainingRuns
    .all()
    .filter((run) => run.status === 'running').length
  const live = deployments
    .all()
    .filter((deployment) => deployment.status === 'live').length

  const history: ApiMetricHistory = {
    days,
    metrics: {
      active_projects: countSeries(
        dates,
        staircase(days, Math.max(0, activeProjects - 3), activeProjects, 41),
      ),
      trainings_running: countSeries(
        dates,
        randomWalk(days, running, Math.max(4, running), 53),
      ),
      models_deployed: countSeries(
        dates,
        staircase(days, Math.max(0, live - 2), live, 67),
      ),
      inference_calls: inferenceCalls(dates, 79),
    },
  }
  return history
})
