import { Box, Button, Icon, Menu, Portal, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Building2, Check, ChevronDown, Plus, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { OrgMark } from '@/features/organizations/components/org-ui';
import { plural } from '@/features/organizations/utils';
import type { Organization } from '@/features/dashboard/data';

export type OrgSwitcherEntry = {
  org: Organization;
  projects: number;
  members: number;
};

export function OrgSwitcher({
  org,
  entries,
  onSwitchOrganization,
  onCreateOrganization,
}: {
  org: Organization;
  entries: OrgSwitcherEntry[];
  onSwitchOrganization: (orgId: string) => void;
  onCreateOrganization: () => void;
}) {
  const links: Array<{
    label: string;
    icon: LucideIcon;
    to: '/organizations' | '/organizations/$orgId/members' | '/organizations/$orgId/settings';
  }> = [
    { label: 'View all organizations', icon: Building2, to: '/organizations' },
    {
      label: 'Manage members',
      icon: Users,
      to: '/organizations/$orgId/members',
    },
    {
      label: 'Organization settings',
      icon: Settings,
      to: '/organizations/$orgId/settings',
    },
  ];

  return (
    <Menu.Root positioning={{ placement: 'bottom-start' }}>
      <Menu.Trigger asChild>
        <Button variant="ghost" colorPalette="gray" size="xs" gap="2" aria-label={`Current organization: ${org.name}`}>
          <OrgMark org={org} boxSize="6" rounded="l1" fontSize="xs" />
          <Text as="span" display={{ base: 'none', sm: 'inline' }} maxW="40" truncate>
            {org.name}
          </Text>
          <Icon boxSize="3.5" color="fg.muted" asChild>
            <ChevronDown />
          </Icon>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content w="80" p="0">
            <Menu.ItemGroup p="1.5" maxH="80" overflowY="auto">
              <Menu.ItemGroupLabel fontSize="2xs" fontWeight="semibold" letterSpacing="wider" color="fg.muted" textTransform="uppercase">
                Switch organization
              </Menu.ItemGroupLabel>
              {entries.map((entry) => {
                const current = entry.org.id === org.id;
                return (
                  <Menu.Item
                    key={entry.org.id}
                    value={entry.org.id}
                    onSelect={() => onSwitchOrganization(entry.org.id)}
                    aria-current={current || undefined}
                    gap="3"
                    px="2.5"
                    py="2"
                    bg={current ? 'selected-bg' : undefined}
                  >
                    <OrgMark org={entry.org} />
                    <Box as="span" minW="0" flex="1">
                      <Text as="span" display="block" truncate fontWeight="medium">
                        {entry.org.name}
                      </Text>
                      <Text as="span" display="block" truncate fontSize="xs" color="fg.muted">
                        {entry.org.plan} plan · {plural(entry.projects, 'project')} · {plural(entry.members, 'member')}
                      </Text>
                    </Box>
                    {current && (
                      <Icon boxSize="4" color="brand-text" asChild>
                        <Check />
                      </Icon>
                    )}
                  </Menu.Item>
                );
              })}
            </Menu.ItemGroup>

            <Menu.Separator my="0" />
            <Menu.ItemGroup p="1.5">
              {links.map((link) => (
                <Menu.Item
                  key={link.to}
                  value={link.to}
                  asChild
                  gap="2.5"
                  px="2.5"
                  py="2"
                  css={{ '& svg': { boxSize: '4', color: 'fg.muted' } }}
                >
                  <Link to={link.to} params={{ orgId: org.id }}>
                    <link.icon />
                    {link.label}
                  </Link>
                </Menu.Item>
              ))}
            </Menu.ItemGroup>

            <Menu.Separator my="0" />
            <Menu.ItemGroup p="1.5">
              <Menu.Item
                value="create-organization"
                onSelect={onCreateOrganization}
                gap="2.5"
                px="2.5"
                py="2"
                fontWeight="medium"
                color="brand-text"
                css={{ '& svg': { boxSize: '4' } }}
              >
                <Plus />
                Create organization
              </Menu.Item>
            </Menu.ItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
