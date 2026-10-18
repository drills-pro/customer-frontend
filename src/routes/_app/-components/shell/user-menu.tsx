import { Link } from '@tanstack/react-router'
import {
  Bell,
  CircleHelp,
  CreditCard,
  Keyboard,
  Lock,
  LogOut,
  SunMoon,
  User,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import type { CurrentUser } from '@/features/account/mappers'
import { useCurrentUser } from '@/features/account/queries'
import type {
  Organization,
  ThemePreference,
} from '@/features/dashboard/domain/types'
import { useBilling } from '@/features/organizations/queries'
import { formatCount } from '@/lib/format'
import { themeLabel } from '../../account/-components/account-data'
import { unavailable } from '@/lib/unavailable'
import {
  Item,
  ItemContent,
  ItemFooter,
  ItemHeader,
  ItemTitle,
  ItemMedia,
  ItemDescription,
} from '@/components/ui/item'
import { Badge } from '@/components/ui/badge'

type AccountLink = {
  label: string
  icon: LucideIcon
  to:
    | '/account/profile'
    | '/account/security'
    | '/account/billing'
    | '/account/team'
    | '/account/notifications'
    | '/account/appearance'
}

const accountLinks: AccountLink[] = [
  { label: 'Profile', icon: User, to: '/account/profile' },
  { label: 'Account settings', icon: Lock, to: '/account/security' },
  { label: 'Billing & usage', icon: CreditCard, to: '/account/billing' },
  { label: 'Team members', icon: Users, to: '/account/team' },
]

export function UserMenu({
  org,
  theme,
  onOpenShortcuts,
}: {
  org: Organization
  theme: ThemePreference
  onOpenShortcuts: () => void
}) {
  const user = useCurrentUser().data
  const billing = useBilling(org.id).data

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="User menu"
          className="rounded-full data-[state=open]:ring-3 data-[state=open]:ring-primary/20"
        >
          <UserAvatar user={user} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-74 p-0">
        <Item size="sm" className="rounded-none border-0 p-4 pb-3">
          <ItemMedia variant="image">
            <UserAvatar user={user} className="size-9.5" />
          </ItemMedia>

          <ItemContent className="min-w-0">
            <ItemTitle>{user?.fullName}</ItemTitle>
            <ItemDescription className="truncate text-xs">
              {user?.email}
            </ItemDescription>
          </ItemContent>
        </Item>

        <Item variant="muted" size="sm" className="mx-4 mb-3 w-auto">
          <ItemHeader>
            <ItemTitle className="text-xs">{org.name}</ItemTitle>
            {billing && (
              <Badge variant="accent">{billing.plan_name.toUpperCase()}</Badge>
            )}
          </ItemHeader>

          <ItemContent>
            <ItemFooter className="text-xs text-muted-foreground">
              <span>Credits used</span>
              <span className="font-semibold text-foreground tabular-nums">
                {billing
                  ? `${formatCount(billing.credits_used)} / ${formatCount(billing.credits_total)}`
                  : ''}
              </span>
            </ItemFooter>

            <Progress
              value={
                billing
                  ? Math.round(
                      (billing.credits_used / billing.credits_total) * 100,
                    )
                  : 0
              }
              aria-label="Credits used"
            />
          </ItemContent>
        </Item>

        <DropdownMenuSeparator className="mx-0 my-0" />
        <DropdownMenuGroup className="p-1.5">
          {accountLinks.map((item) => (
            <MenuLink key={item.to} item={item} />
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-0 my-0" />
        <DropdownMenuGroup className="p-1.5">
          <MenuLink
            item={{
              label: 'Notifications',
              icon: Bell,
              to: '/account/notifications',
            }}
          />
          <MenuLink
            item={{
              label: 'Appearance',
              icon: SunMoon,
              to: '/account/appearance',
            }}
            shortcut={themeLabel(theme)}
          />
          <DropdownMenuItem className={itemClass} onSelect={onOpenShortcuts}>
            <Keyboard />
            Keyboard shortcuts
            <DropdownMenuShortcut>⌘/</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-0 my-0" />
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem
            className={itemClass}
            onSelect={() => unavailable('Help & documentation')}
          >
            <CircleHelp />
            Help & documentation
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            className={itemClass}
            onSelect={() =>
              toast.info('Logging out is not available in this demo.')
            }
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const itemClass = 'gap-2.5 px-2.5 py-2 [&_svg]:text-muted-foreground'

function MenuLink({
  item,
  shortcut,
}: {
  item: AccountLink
  shortcut?: string
}) {
  const Icon = item.icon
  return (
    <DropdownMenuItem asChild className={itemClass}>
      <Link to={item.to}>
        <Icon />
        {item.label}
        {shortcut && (
          <DropdownMenuShortcut className="tracking-normal">
            {shortcut}
          </DropdownMenuShortcut>
        )}
      </Link>
    </DropdownMenuItem>
  )
}

function UserAvatar({
  user,
  className,
}: {
  user: CurrentUser | undefined
  className?: string
}) {
  return (
    <Avatar className={className}>
      <AvatarFallback
        className="text-xs font-semibold text-white"
        style={{ backgroundColor: user?.color }}
      >
        {user?.initials}
      </AvatarFallback>
    </Avatar>
  )
}
