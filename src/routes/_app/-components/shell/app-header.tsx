import { Badge, Box, Button, Flex, IconButton, Kbd, Menu, Portal, Text } from '@chakra-ui/react';
import { Bell, BellRing, Search } from 'lucide-react';

import { useMarkNotificationsRead, useNotifications } from '@/features/account/queries';
import type { Organization, ThemePreference } from '@/features/dashboard/domain/types';
import { useBilling } from '@/features/organizations/queries';
import { formatCount } from '@/lib/format';
import { SidebarTrigger } from './app-shell';
import { OrgSwitcher } from './org-switcher';
import type { OrgSwitcherEntry } from './org-switcher';
import { UserMenu } from './user-menu';

export function AppHeader({
  org,
  orgEntries,
  theme,
  onSwitchOrganization,
  onCreateOrganization,
  onOpenSearch,
  onOpenShortcuts,
}: {
  org: Organization;
  orgEntries: OrgSwitcherEntry[];
  theme: ThemePreference;
  onSwitchOrganization: (orgId: string) => void;
  onCreateOrganization: () => void;
  onOpenSearch: () => void;
  onOpenShortcuts: () => void;
}) {
  const billing = useBilling(org.id).data;
  const notifications = useNotifications().data ?? [];
  const markRead = useMarkNotificationsRead();
  const notificationsRead = notifications.every((item) => item.read);

  return (
    <Flex
      as="header"
      position="sticky"
      top="0"
      zIndex="sticky"
      h="14"
      align="center"
      gap="3"
      px={{ base: '3', sm: '5' }}
      borderBottomWidth="1px"
      borderColor="border"
      bg="surface"
    >
      <SidebarTrigger aria-label="Toggle navigation" />

      <OrgSwitcher org={org} entries={orgEntries} onSwitchOrganization={onSwitchOrganization} onCreateOrganization={onCreateOrganization} />

      <Button
        type="button"
        variant="subtle"
        colorPalette="gray"
        size="xs"
        onClick={onOpenSearch}
        display={{ base: 'none', md: 'flex' }}
        mx="auto"
        w="full"
        maxW="md"
        gap="2"
        px="3"
        fontWeight="normal"
        color="fg.muted"
        aria-label="Search projects, models, runs"
      >
        <Search />
        <Text as="span" flex="1" textAlign="start">
          Search projects, models, runs...
        </Text>
        <Kbd size="sm">⌘K</Kbd>
      </Button>

      {billing && (
        <Badge colorPalette="brand" variant="subtle" display={{ base: 'none', sm: 'flex' }}>
          {formatCount(Math.max(0, billing.credits_total - billing.credits_used))} credits
        </Badge>
      )}

      <IconButton
        variant="ghost"
        colorPalette="gray"
        size="xs"
        aria-label="Open search"
        display={{ base: 'flex', md: 'none' }}
        onClick={onOpenSearch}
      >
        <Search />
      </IconButton>

      <Menu.Root
        positioning={{ placement: 'bottom-end' }}
        onOpenChange={(event) => {
          if (event.open && !notificationsRead) markRead.mutate();
        }}
      >
        <Menu.Trigger asChild>
          <IconButton variant="ghost" colorPalette="gray" size="xs" aria-label="Notifications" position="relative">
            {notificationsRead ? <Bell /> : <BellRing />}
            {!notificationsRead && (
              <Box
                position="absolute"
                top="1.5"
                insetEnd="1.5"
                boxSize="2"
                rounded="full"
                bg="danger"
                outline="2px solid"
                outlineColor="surface"
              />
            )}
          </IconButton>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content w="72">
              <Menu.ItemGroup>
                <Menu.ItemGroupLabel>Notifications</Menu.ItemGroupLabel>
              </Menu.ItemGroup>
              <Menu.Separator />
              {notifications.length === 0 && (
                <Text p="3" textStyle="body-sm" color="fg.muted">
                  You're all caught up.
                </Text>
              )}
              {notifications.map((item) => (
                <Box p="3" textStyle="body-sm" key={item.id}>
                  <strong>{item.title}</strong>
                  <Text mt="1" color="fg.muted">
                    {item.body}
                  </Text>
                </Box>
              ))}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      <UserMenu org={org} theme={theme} onOpenShortcuts={onOpenShortcuts} />
    </Flex>
  );
}
