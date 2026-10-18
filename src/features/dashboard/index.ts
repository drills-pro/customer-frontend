/**
 * The dashboard feature's public surface: the UI types, the stored
 * preferences and the navigation shared by the project pages.
 */
export * from './data'
export * from './navigation'
export { restorePreferences } from './persistence/restore'
export { loadPreferences, savePreferences } from './persistence/storage'
export * from './persistence/schema'
