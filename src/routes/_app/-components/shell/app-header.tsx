import { Bell, BellRing, Check, ChevronDown, Search } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Kbd } from '@/components/ui/kbd'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { organizations } from '@/features/dashboard/data'
import type { Organization } from '@/features/dashboard/data'
import { unavailable } from './helpers'

export function AppHeader({
  org,
  notificationsRead,
  onSwitchOrganization,
  onMarkNotificationsRead,
  onOpenSearch,
}: {
  org: Organization
  notificationsRead: boolean
  onSwitchOrganization: (orgId: string) => void
  onMarkNotificationsRead: () => void
  onOpenSearch: () => void
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/95 px-3 backdrop-blur sm:px-5">
      <SidebarTrigger aria-label="Toggle navigation" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            aria-label={`Current organization: ${org.name}`}
            className="gap-2"
          >
            <span
              className="flex size-6 items-center justify-center rounded-md text-xs font-semibold text-white"
              style={{ backgroundColor: org.color }}
            >
              {org.initial}
            </span>
            <span className="hidden sm:inline">{org.name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel>Switch organization</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {organizations.map((item) => (
            <DropdownMenuItem
              key={item.id}
              onSelect={() => onSwitchOrganization(item.id)}
            >
              <span
                className="flex size-7 items-center justify-center rounded-md text-xs font-semibold text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.initial}
              </span>
              <span className="flex-1">{item.name}</span>
              {item.id === org.id && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        type="button"
        variant="ghost"
        onClick={onOpenSearch}
        className="mx-auto hidden h-8 w-full max-w-md items-center gap-2 rounded-lg bg-slate-100 px-3 text-sm text-slate-400 transition-colors hover:bg-slate-200 md:flex"
        aria-label="Search projects, models, runs"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">
          Search projects, models, runs...
        </span>
        <Kbd>⌘K</Kbd>
      </Button>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <Badge
          variant="secondary"
          className="hidden rounded-full bg-indigo-50 font-medium text-indigo-700 sm:flex"
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

        <DropdownMenu
          onOpenChange={(open) => open && onMarkNotificationsRead()}
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
                <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="User menu">
              <Avatar>
                <AvatarFallback className="bg-violet-600 text-white">
                  AR
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Alex Rivera</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => unavailable('Profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => unavailable('Account settings')}>
              Account settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
