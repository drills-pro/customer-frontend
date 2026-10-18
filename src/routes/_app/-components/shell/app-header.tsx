import { Bell, BellRing, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  useMarkNotificationsRead,
  useNotifications,
} from '@/features/account/queries'
import type {
  Organization,
  ThemePreference,
} from '@/features/dashboard/domain/types'
import { useBilling } from '@/features/organizations/queries'
import { formatCount } from '@/lib/format'
import { OrgSwitcher } from './org-switcher'
import type { OrgSwitcherEntry } from './org-switcher'
import { UserMenu } from './user-menu'

export function AppHeader({
  org,
  orgEntries,
  theme,
  onSwitchOrganization,
  onCreateOrganization,
  onOpenSearch,
  onOpenShortcuts,
}: {
  org: Organization
  orgEntries: OrgSwitcherEntry[]
  theme: ThemePreference
  onSwitchOrganization: (orgId: string) => void
  onCreateOrganization: () => void
  onOpenSearch: () => void
  onOpenShortcuts: () => void
}) {
  const billing = useBilling(org.id).data
  const notifications = useNotifications().data ?? []
  const markRead = useMarkNotificationsRead()
  const notificationsRead = notifications.every((item) => item.read)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/95 px-3 backdrop-blur sm:px-5">
      <SidebarTrigger aria-label="Toggle navigation" />

      <OrgSwitcher
        org={org}
        entries={orgEntries}
        onSwitchOrganization={onSwitchOrganization}
        onCreateOrganization={onCreateOrganization}
      />

      <Button
        type="button"
        variant="ghost"
        onClick={onOpenSearch}
        className="mx-auto hidden h-8 w-full max-w-md items-center gap-2 rounded-lg bg-muted px-3 text-sm text-muted-foreground/80 transition-colors hover:bg-border md:flex"
        aria-label="Search projects, models, runs"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">
          Search projects, models, runs...
        </span>
        <Kbd>⌘K</Kbd>
      </Button>

      {billing && (
        <Badge
          variant="secondary"
          className="hidden rounded-full bg-primary-muted font-medium text-primary sm:flex"
        >
          {formatCount(
            Math.max(0, billing.credits_total - billing.credits_used),
          )}{' '}
          credits
        </Badge>
      )}

      <Button
        variant="ghost"
        size="icon"
        aria-label="Open search"
        className="md:hidden"
        onClick={onOpenSearch}
      >
        <Search />
      </Button>

      <DropdownMenu
        onOpenChange={(open) => {
          if (open && !notificationsRead) markRead.mutate()
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
          >
            {notificationsRead ? <Bell /> : <BellRing />}
            {!notificationsRead && (
              <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive ring-2 ring-card" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 && (
            <p className="p-3 text-sm text-muted-foreground">
              You're all caught up.
            </p>
          )}
          {notifications.map((item) => (
            <div className="p-3 text-sm" key={item.id}>
              <strong>{item.title}</strong>
              <p className="mt-1 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserMenu org={org} theme={theme} onOpenShortcuts={onOpenShortcuts} />
    </header>
  )
}
