import * as React from 'react'
import { Link, useLocation } from '@tanstack/react-router'

export const accountSections = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/security', label: 'Security' },
  { to: '/account/notifications', label: 'Notifications' },
  { to: '/account/billing', label: 'Billing & usage' },
  { to: '/account/api-keys', label: 'API keys' },
  { to: '/account/team', label: 'Team' },
  { to: '/account/appearance', label: 'Appearance' },
] as const

export function AccountNav() {
  const navRef = React.useRef<HTMLElement>(null)
  const pathname = useLocation({ select: (location) => location.pathname })

  // On narrow screens the nav is a horizontal strip; keep the current tab in
  // view. Only the strip scrolls, never the page.
  React.useEffect(() => {
    const nav = navRef.current
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return
    nav.scrollLeft =
      active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2
  }, [pathname])

  return (
    <nav
      ref={navRef}
      aria-label="Account settings"
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:sticky lg:top-22 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0"
    >
      {accountSections.map((section) => (
        <Link
          key={section.to}
          to={section.to}
          activeProps={{ 'aria-current': 'page' }}
          className="shrink-0 rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors outline-hidden hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-primary-muted aria-[current=page]:font-medium aria-[current=page]:text-primary"
        >
          {section.label}
        </Link>
      ))}
    </nav>
  )
}
