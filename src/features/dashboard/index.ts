/**
 * The dashboard feature's public surface. Import from here rather than reaching
 * into `data`, `persistence/*`, or `selectors/*` directly, so those modules can
 * keep moving without touching every route.
 */
export * from './data'
export * from './navigation'
export * from './templates'
export * from './training'
export * from './selectors/projects'
export * from './selectors/training-runs'
export * from './selectors/models'
export * from './selectors/deployments'
export * from './selectors/organizations'
export { restorePreferences } from './persistence/restore'
export { loadPreferences, savePreferences } from './persistence/storage'
export {
  migrateCreatedProject,
  migrateDataset,
  migrateTrainingRun,
} from './persistence/migrations'
export * from './persistence/schema'
