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
import type { Organization, ThemePreference } from '@/features/dashboard/data'
import { OrgSwitcher } from './org-switcher'
import type { OrgSwitcherEntry } from './org-switcher'
import { UserMenu } from './user-menu'

export function AppHeader({
  org,
  orgEntries,
  theme,
  notificationsRead,
  onSwitchOrganization,
  onCreateOrganization,
  onMarkNotificationsRead,
  onOpenSearch,
  onOpenShortcuts,
}: {
  org: Organization
  orgEntries: OrgSwitcherEntry[]
  theme: ThemePreference
  notificationsRead: boolean
  onSwitchOrganization: (orgId: string) => void
  onCreateOrganization: () => void
  onMarkNotificationsRead: () => void
  onOpenSearch: () => void
  onOpenShortcuts: () => void
}) {
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

      <Badge
        variant="secondary"
        className="hidden rounded-full bg-primary-muted font-medium text-primary sm:flex"
      >
        1,240 credits
      </Badge>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Open search"
        className="md:hidden"
        onClick={onOpenSearch}
      >
        <Search />
      </Button>

      <DropdownMenu onOpenChange={(open) => open && onMarkNotificationsRead()}>
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
          <div className="p-3 text-sm">
            <strong>Training complete</strong>
            <p className="mt-1 text-muted-foreground">
              resnet50-v3 reached 94.2% accuracy.
            </p>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserMenu org={org} theme={theme} onOpenShortcuts={onOpenShortcuts} />
    </header>
  )
}
