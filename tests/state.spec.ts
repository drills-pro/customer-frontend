import { expect, test } from '@playwright/test'
import {
  advanceSimulation,
  restoreState,
  seedState,
  stateSchema,
} from '../src/features/drills/data'

test('seed and saved state preserve valid resource relationships', () => {
  const seed = seedState(100000000)
  expect(stateSchema.safeParse(seed).success).toBe(true)
  expect(restoreState(JSON.stringify(seed), 100000000).recovered).toBe(false)
  expect(restoreState('{broken', 100000000).recovered).toBe(true)
  expect(
    restoreState(JSON.stringify({ ...seed, version: 99 }), 100000000).recovered,
  ).toBe(true)
  expect(
    restoreState(JSON.stringify({ ...seed, datasets: [] }), 100000000)
      .recovered,
  ).toBe(true)
})

test('restoring elapsed jobs completes once and does not duplicate models', () => {
  const now = 100000000
  const seed = seedState(now)
  const completed = advanceSimulation(seed, now + 2000000)
  expect(completed.datasets.find((d) => d.id === 'retail-raw')?.status).toBe(
    'Ready',
  )
  expect(completed.runs.find((r) => r.id === 'retail-run-24')?.status).toBe(
    'Completed',
  )
  expect(
    completed.models.filter((m) => m.runId === 'retail-run-24'),
  ).toHaveLength(1)
  expect(advanceSimulation(completed, now + 4000000)).toBe(completed)
  const restored = restoreState(JSON.stringify(completed), now + 5000000)
  expect(
    restored.state.models.filter((m) => m.runId === 'retail-run-24'),
  ).toHaveLength(1)
})

test('stopped jobs and paused endpoints do not advance', () => {
  const now = 100000000
  const seed = seedState(now)
  seed.runs = seed.runs.map((r) => ({
    ...r,
    status:
      r.status === 'Running' || r.status === 'Queued' ? 'Stopped' : r.status,
  }))
  const paused = seed.deployments.find((d) => d.status === 'Paused')!
  paused.readyAt = now - 1000
  const next = advanceSimulation(seed, now + 5000000)
  expect(next.deployments.find((d) => d.id === paused.id)?.status).toBe(
    'Paused',
  )
  expect(next.models).toHaveLength(seed.models.length)
})
