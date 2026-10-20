import {
  Avatar,
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Progress,
  Stack,
  Text,
} from '@chakra-ui/react'
import type { AvatarRootProps, MenuItemProps } from '@chakra-ui/react'
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
import { toaster } from '@/components/toaster'

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
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <IconButton
          variant="ghost"
          colorPalette="gray"
          size="xs"
          aria-label="User menu"
          rounded="full"
          _expanded={{ outline: '3px solid', outlineColor: 'brand.subtle' }}
        >
          <UserAvatar user={user} />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content w="18.5rem" p="0">
            <HStack gap="3" p="4" pb="3">
              <UserAvatar user={user} boxSize="38px" />
              <Box minW="0">
                <Text fontWeight="medium" textStyle="body-sm">
                  {user?.fullName}
                </Text>
                <Text truncate fontSize="xs" color="fg.muted">
                  {user?.email}
                </Text>
              </Box>
            </HStack>

            <Stack gap="2" mx="4" mb="3" p="3" rounded="l2" bg="bg.muted">
              <Flex align="center" justify="space-between" gap="2">
                <Text fontSize="xs" fontWeight="medium">
                  {org.name}
                </Text>
                {billing && (
                  <Badge colorPalette="brand" variant="subtle">
                    {billing.plan_name.toUpperCase()}
                  </Badge>
                )}
              </Flex>
              <Flex
                align="center"
                justify="space-between"
                fontSize="xs"
                color="fg.muted"
              >
                <span>Credits used</span>
                <Text
                  as="span"
                  fontWeight="semibold"
                  color="fg"
                  fontVariantNumeric="tabular-nums"
                >
                  {billing
                    ? `${formatCount(billing.credits_used)} / ${formatCount(billing.credits_total)}`
                    : ''}
                </Text>
              </Flex>
              <Progress.Root
                size="xs"
                value={
                  billing
                    ? Math.round(
                        (billing.credits_used / billing.credits_total) * 100,
                      )
                    : 0
                }
              >
                <Progress.Track aria-label="Credits used">
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Stack>

            <Menu.Separator my="0" />
            <Menu.ItemGroup p="1.5">
              {accountLinks.map((item) => (
                <MenuLink key={item.to} item={item} />
              ))}
            </Menu.ItemGroup>

            <Menu.Separator my="0" />
            <Menu.ItemGroup p="1.5">
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
              <MenuItem value="keyboard-shortcuts" onSelect={onOpenShortcuts}>
                <Keyboard />
                Keyboard shortcuts
                <Menu.ItemCommand>⌘/</Menu.ItemCommand>
              </MenuItem>
            </Menu.ItemGroup>

            <Menu.Separator my="0" />
            <Menu.ItemGroup p="1.5">
              <MenuItem
                value="help"
                onSelect={() => unavailable('Help & documentation')}
              >
                <CircleHelp />
                Help & documentation
              </MenuItem>
              <MenuItem
                value="log-out"
                color="fg.error"
                _highlighted={{ bg: 'bg.error', color: 'fg.error' }}
                css={{ '& svg': { boxSize: '4', color: 'fg.error' } }}
                onSelect={() =>
                  toaster.create({
                    type: 'info',
                    title: 'Logging out is not available in this demo.',
                  })
                }
              >
                <LogOut />
                Log out
              </MenuItem>
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}

/** A menu row with a muted leading icon. */
function MenuItem(props: MenuItemProps) {
  return (
    <Menu.Item
      gap="2.5"
      px="2.5"
      py="2"
      css={{ '& svg': { boxSize: '4', color: 'fg.muted' } }}
      {...props}
    />
  )
}

function MenuLink({
  item,
  shortcut,
}: {
  item: AccountLink
  shortcut?: string
}) {
  const Icon = item.icon
  return (
    <MenuItem value={item.to} asChild>
      <Link to={item.to}>
        <Icon />
        {item.label}
        {shortcut && (
          <Menu.ItemCommand letterSpacing="normal">{shortcut}</Menu.ItemCommand>
        )}
      </Link>
    </MenuItem>
  )
}

function UserAvatar({
  user,
  ...props
}: { user: CurrentUser | undefined } & AvatarRootProps) {
  return (
    <Avatar.Root
      boxSize="8"
      rounded="full"
      borderWidth="0"
      color="white"
      // The user's own color, from the API.
      bg={user?.color}
      {...props}
    >
      <Avatar.Fallback fontSize="xs" fontWeight="semibold">
        {user?.initials}
      </Avatar.Fallback>
    </Avatar.Root>
  )
}
