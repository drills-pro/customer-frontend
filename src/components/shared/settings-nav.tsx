import * as React from 'react'
import { cn } from 'cn'

export type SettingsSection = { id: string; label: string }

/** The section id styled as destructive in the menu. */
const DANGER_ID = 'danger-zone'

/**
 * Distance from the viewport top where a section counts as current: the 56px
 * sticky app header plus a gap. Matches `lg:top-22` on the nav and
 * `scroll-mt-22` on every card, so a clicked card lands exactly on this line.
 */
const SECTION_OFFSET = 88

/** The last section whose top has reached the offset line. */
function sectionAtScroll(sections: readonly SettingsSection[]) {
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2
  // Short trailing cards can never reach the line, so the page bottom wins.
  if (atBottom) return sections[sections.length - 1].id

  let current = sections[0].id
  for (const section of sections) {
    const element = document.getElementById(section.id)
    if (element && element.getBoundingClientRect().top <= SECTION_OFFSET + 1)
      current = section.id
  }
  return current
}

function useActiveSection(sections: readonly SettingsSection[]) {
  const [active, setActive] = React.useState(sections[0].id)
  // Set when a section is chosen from the menu. A card near the page bottom
  // cannot scroll up to the offset line, so the scroll position alone would
  // name a later section; the choice holds until the user scrolls themselves.
  const pinnedRef = React.useRef(false)
  const sectionsRef = React.useRef(sections)
  sectionsRef.current = sections

  const scrollTo = React.useCallback((id: string) => {
    const element = document.getElementById(id)
    if (!element) return
    setActive(id)
    history.replaceState(history.state, '', `#${id}`)

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    pinnedRef.current = true
    element.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [])

  React.useEffect(() => {
    let frame = 0
    const onScroll = () => {
      if (pinnedRef.current || frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        if (!pinnedRef.current) setActive(sectionAtScroll(sectionsRef.current))
      })
    }
    // Any input that can scroll the page by hand releases the pin: wheel,
    // touch, keys, and pointer presses (scrollbar drags). A press on a menu
    // link fires before its click, which pins again.
    const unpin = () => {
      pinnedRef.current = false
    }
    const userInputs = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const
    window.addEventListener('scroll', onScroll, { passive: true })
    for (const type of userInputs)
      window.addEventListener(type, unpin, { passive: true })

    const hash = window.location.hash.slice(1)
    if (sectionsRef.current.some((section) => section.id === hash))
      scrollTo(hash)
    else setActive(sectionAtScroll(sectionsRef.current))

    return () => {
      window.removeEventListener('scroll', onScroll)
      for (const type of userInputs) window.removeEventListener(type, unpin)
      cancelAnimationFrame(frame)
    }
  }, [scrollTo])

  return [active, scrollTo] as const
}

/** Sticky in-page menu for a settings page made of anchored cards. */
export function SettingsNav({
  sections,
}: {
  sections: readonly SettingsSection[]
}) {
  const [active, scrollTo] = useActiveSection(sections)

  return (
    <nav
      aria-label="Settings sections"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:sticky lg:top-22 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0"
    >
      {sections.map((section) => {
        const current = active === section.id
        const danger = section.id === DANGER_ID
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={current ? 'location' : undefined}
            onClick={(event) => {
              event.preventDefault()
              scrollTo(section.id)
            }}
            className={cn(
              'shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors outline-hidden focus-visible:ring-2 focus-visible:ring-ring',
              danger
                ? current
                  ? 'bg-destructive-muted font-medium text-destructive'
                  : 'text-destructive hover:bg-destructive-muted'
                : current
                  ? 'bg-primary-muted font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted',
            )}
          >
            {section.label}
          </a>
        )
      })}
    </nav>
  )
}
