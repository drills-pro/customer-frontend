import * as React from 'react'
import { toast } from 'sonner'

import { defaultPreferences } from '@/features/dashboard/data'
import type { DashboardPreferences } from '@/features/dashboard/data'
import {
  loadPreferences,
  savePreferences,
} from '@/features/dashboard/persistence/storage'

/**
 * Owns the persisted workspace preferences: hydration, writes, and the single
 * notice shown when browser storage is unavailable. Storage failures never
 * throw here — the in-memory state stays usable for the session.
 */
export function usePreferences() {
  const [preferences, setPreferences] =
    React.useState<DashboardPreferences>(defaultPreferences)
  const [hydrated, setHydrated] = React.useState(false)
  const [persistenceAvailable, setPersistenceAvailable] = React.useState(true)

  React.useEffect(() => {
    const { preferences: restored, available } = loadPreferences()
    setPreferences(restored)
    setPersistenceAvailable(available)
    setHydrated(true)
  }, [])

  React.useEffect(() => {
    if (!hydrated) return
    if (!savePreferences(preferences)) setPersistenceAvailable(false)
  }, [hydrated, preferences])

  // One non-blocking notice, not one per failed write.
  const noticeShown = React.useRef(false)
  React.useEffect(() => {
    if (!hydrated || persistenceAvailable || noticeShown.current) return
    noticeShown.current = true
    toast.info(
      'Browser storage is unavailable. This workspace stays usable, but changes will not persist.',
    )
  }, [hydrated, persistenceAvailable])

  const updatePreferences = React.useCallback(
    (partial: Partial<DashboardPreferences>) =>
      setPreferences((current) => ({ ...current, ...partial })),
    [],
  )

  return { preferences, updatePreferences, hydrated, persistenceAvailable }
}
