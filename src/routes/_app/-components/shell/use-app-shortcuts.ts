import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'

/** How long after `G` the second key of a navigation sequence is accepted. */
const SEQUENCE_TIMEOUT = 1000

const sequenceTargets = {
  h: '/',
  p: '/projects',
  a: '/account/profile',
} as const

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/** App-wide shortcuts; the list shown to users is `KeyboardShortcutsDialog`. */
export function useAppShortcuts({
  toggleSearch,
  toggleShortcuts,
  openShortcuts,
}: {
  toggleSearch: () => void
  toggleShortcuts: () => void
  openShortcuts: () => void
}) {
  const navigate = useNavigate()
  const handlers = React.useRef({
    toggleSearch,
    toggleShortcuts,
    openShortcuts,
  })
  handlers.current = { toggleSearch, toggleShortcuts, openShortcuts }

  React.useEffect(() => {
    let sequenceStartedAt = 0

    const handle = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()

      if (event.metaKey || event.ctrlKey) {
        if (key === 'k') {
          event.preventDefault()
          handlers.current.toggleSearch()
        } else if (key === '/') {
          event.preventDefault()
          handlers.current.toggleShortcuts()
        }
        return
      }

      // Single-key shortcuts must never fire while typing or inside a dialog.
      if (
        event.altKey ||
        isTyping(event.target) ||
        document.querySelector('[role="dialog"], [role="alertdialog"]')
      ) {
        sequenceStartedAt = 0
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        handlers.current.openShortcuts()
        return
      }

      if (
        sequenceStartedAt &&
        Date.now() - sequenceStartedAt < SEQUENCE_TIMEOUT &&
        key in sequenceTargets
      ) {
        sequenceStartedAt = 0
        event.preventDefault()
        void navigate({
          to: sequenceTargets[key as keyof typeof sequenceTargets],
        })
        return
      }

      sequenceStartedAt = key === 'g' && !event.shiftKey ? Date.now() : 0
    }

    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [navigate])
}
