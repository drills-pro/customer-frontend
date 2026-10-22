import { useState, type ReactNode } from 'react';
import { Box, Breadcrumb, CloseButton, Drawer, Flex, HStack, IconButton, Portal, Stack } from '@chakra-ui/react';
import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, Menu, Settings, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppIcon, Wordmark } from '@/brand/Bit';
import { ColorModeButton } from '@/components/color-mode';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useCan, useWorkspace } from '@/modules/workspaces/context';
import { UserMenu } from './UserMenu';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const canManage = useCan('tenant.member.manage');
  const items = [
    { id: 'overview', to: '/w/$slug', label: t('nav.overview'), icon: <LayoutDashboard />, exact: true },
    ...(canManage ? [{ id: 'members', to: '/w/$slug/members', label: t('shell.members'), icon: <Users />, exact: false }] : []),
    { id: 'settings', to: '/w/$slug/settings', label: t('shell.settings'), icon: <Settings />, exact: false },
  ] as const;
  return (
    <Stack as="nav" aria-label={t('shell.navLabel')} gap="1">
      {items.map((i) => (
        <Box
          key={i.to}
          data-testid={`shell-nav-${i.id}`}
          asChild
          display="flex"
          alignItems="center"
          gap="3"
          px="3"
          py="2"
          borderRadius="l2"
          color="fg.muted"
          fontWeight="medium"
          _hover={{ bg: 'bg.subtle', color: 'fg' }}
          _currentPage={{ bg: 'selected-bg', color: 'fg', fontWeight: 'semibold' }}
        >
          <Link to={i.to} params={{ slug }} activeOptions={{ exact: i.exact }} onClick={onNavigate}>
            {i.icon}
            {i.label}
          </Link>
        </Box>
      ))}
    </Stack>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Stack gap="6" p="3" h="full">
      <HStack gap="2" px="1">
        <AppIcon size={32} />
        <Wordmark scale={2} />
      </HStack>
      <WorkspaceSwitcher onNavigate={onNavigate} />
      <SidebarNav onNavigate={onNavigate} />
    </Stack>
  );
}

function Crumbs() {
  const { t } = useTranslation();
  const { slug, name } = useWorkspace();
  const path = useLocation({ select: (l) => l.pathname });
  const page = path.endsWith('/members') ? t('shell.members') : path.endsWith('/settings') ? t('shell.settings') : t('nav.overview');
  return (
    <Breadcrumb.Root size="md">
      <Breadcrumb.List>
        <Breadcrumb.Item display={{ base: 'none', md: 'inline-flex' }}>
          <Breadcrumb.Link asChild>
            <Link to="/w/$slug" params={{ slug }}>
              {name}
            </Link>
          </Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator display={{ base: 'none', md: 'inline-flex' }} />
        <Breadcrumb.Item>
          <Breadcrumb.CurrentLink whiteSpace="nowrap">{page}</Breadcrumb.CurrentLink>
        </Breadcrumb.Item>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
}

/** Sidebar on md+, a Drawer behind a menu button on phones; the header carries breadcrumbs and account controls. */
export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Flex minH="100vh" data-testid="shell">
      <Box
        as="aside"
        display={{ base: 'none', md: 'block' }}
        w="64"
        flexShrink="0"
        bg="surface-sunken"
        borderEndWidth="2px"
        borderColor="border"
        position="sticky"
        top="0"
        h="100vh"
      >
        <Sidebar />
      </Box>

      <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="start" lazyMount unmountOnExit>
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content bg="surface-sunken">
              <Drawer.Body p="0">
                <Sidebar onNavigate={() => setOpen(false)} />
              </Drawer.Body>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" aria-label={t('shell.closeMenu')} />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>

      <Flex direction="column" flex="1" minW="0">
        <Flex
          as="header"
          align="center"
          justify="space-between"
          gap="3"
          px={{ base: '4', md: '6' }}
          py="3"
          bg="surface-raised"
          borderBottomWidth="2px"
          borderColor="border"
        >
          <HStack gap="3" minW="0">
            <IconButton display={{ md: 'none' }} variant="outline" size="sm" aria-label={t('shell.openMenu')} onClick={() => setOpen(true)}>
              <Menu />
            </IconButton>
            <Crumbs />
          </HStack>
          <HStack gap="3">
            <LanguageSwitcher />
            <ColorModeButton size="sm" />
            <UserMenu />
          </HStack>
        </Flex>
        <Box as="main" flex="1" minW="0" px={{ base: '4', md: '6' }} py="8" maxW="5xl" w="full" mx="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
