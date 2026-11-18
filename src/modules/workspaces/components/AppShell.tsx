import { Fragment, useState, type ComponentType, type ReactNode } from 'react';
import { Box, Breadcrumb, CloseButton, Drawer, Flex, HStack, IconButton, Portal, Stack } from '@chakra-ui/react';
import { Link, useMatches } from '@tanstack/react-router';
import { Briefcase, Layout, Menu, SettingsCog, Trash, Users } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { AppIcon, Wordmark } from '@/brand/Bit';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useCan, useWorkspace } from '@/modules/workspaces/context';
import { UserMenu } from './UserMenu';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { slug } = useWorkspace();
  const canManage = useCan('tenant.member.manage');
  const items = [
    { id: 'overview', to: '/w/$slug', label: t('nav.overview'), icon: <Layout width={20} height={20} />, exact: true },
    { id: 'projects', to: '/w/$slug/projects', label: t('projects.title'), icon: <Briefcase width={20} height={20} />, exact: false },
    ...(canManage
      ? [{ id: 'members', to: '/w/$slug/members', label: t('shell.members'), icon: <Users width={20} height={20} />, exact: false }]
      : []),
    { id: 'trash', to: '/w/$slug/trash', label: t('nav.trash'), icon: <Trash width={20} height={20} />, exact: false },
    { id: 'settings', to: '/w/$slug/settings', label: t('shell.settings'), icon: <SettingsCog width={20} height={20} />, exact: false },
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
          _hover={{ bg: 'selected-bg/50', color: 'fg' }}
          _currentPage={{ bg: 'selected-bg', color: 'fg', fontWeight: 'semibold', _hover: { bg: 'selected-bg' } }}
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

/** Phones show only the current page and its parent. */
const PHONE_CRUMBS = 2;
const hiddenOnPhone = { base: 'none', md: 'inline-flex' } as const;

type Crumb = { id: string; to: string; search?: Record<string, string>; Label: ComponentType };

/** One crumb per matched route that declares `staticData.crumb`, so a page deep in a project still shows where it sits. */
function Crumbs() {
  const crumbs = useMatches({
    select: (matches) =>
      matches.reduce<Crumb[]>((acc, m) => {
        const { crumb, parentSearch } = m.staticData;
        const parent = acc.at(-1);
        const withParent = parentSearch && parent ? [...acc.slice(0, -1), { ...parent, search: parentSearch }] : acc;
        return crumb ? [...withParent, { id: m.id, to: m.pathname, Label: crumb }] : withParent;
      }, []),
  });
  const firstOnPhone = crumbs.length - PHONE_CRUMBS;
  return (
    <Breadcrumb.Root size="md" minW="0">
      <Breadcrumb.List flexWrap="nowrap" minW="0">
        {crumbs.map(({ id, to, search, Label }, i) => (
          <Fragment key={id}>
            {i > 0 && <Breadcrumb.Separator display={i > firstOnPhone ? undefined : hiddenOnPhone} data-testid="shell-crumb-separator" />}
            <Breadcrumb.Item minW="0" display={i >= firstOnPhone ? undefined : hiddenOnPhone} data-testid="shell-crumb">
              {i === crumbs.length - 1 ? (
                <Breadcrumb.CurrentLink maxW="64" truncate>
                  <Label />
                </Breadcrumb.CurrentLink>
              ) : (
                <Breadcrumb.Link asChild maxW="48" truncate>
                  <Link to={to} search={search}>
                    <Label />
                  </Link>
                </Breadcrumb.Link>
              )}
            </Breadcrumb.Item>
          </Fragment>
        ))}
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
            <UserMenu />
          </HStack>
        </Flex>
        <Box as="main" flex="1" minW="0" px={{ base: '4', md: '6' }} py="8" maxW="7xl" w="full" mx="auto">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
