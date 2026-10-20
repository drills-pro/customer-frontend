import * as React from 'react'
import {
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react'
import type { ButtonProps } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import {
  Building2,
  FolderKanban,
  House,
  LayoutGrid,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import {
  projectSectionLink,
  projectSections,
} from '@/features/dashboard/navigation'
import type { Organization, Project } from '@/features/dashboard/data'
import { unavailable } from '@/lib/unavailable'
import { Sidebar, SidebarTooltip, useSidebar } from './app-shell'

type MainNavigationItem = {
  label: string
  icon: LucideIcon
} & (
  | {
      to:
        '/' | '/projects' | '/organizations' | '/organizations/$orgId/settings'
    }
  | { action: 'unavailable' }
)

const mainNavigation: MainNavigationItem[] = [
  { label: 'Home', icon: House, to: '/' },
  { label: 'Projects', icon: FolderKanban, to: '/projects' },
  { label: 'Organizations', icon: Building2, to: '/organizations' },
  { label: 'Settings', icon: Settings, to: '/organizations/$orgId/settings' },
  { label: 'All Screens', icon: LayoutGrid, action: 'unavailable' },
]

/** A sidebar row. Links mark themselves `data-active="true"` when current. */
function NavButton(props: ButtonProps) {
  const { collapsed, isMobile } = useSidebar()
  const rail = collapsed && !isMobile
  return (
    <Button
      variant="ghost"
      colorPalette="gray"
      size="sm"
      h="8"
      w={rail ? '8' : 'full'}
      minW="0"
      px="2"
      gap="2"
      justifyContent="flex-start"
      fontWeight="normal"
      color="fg"
      overflow="hidden"
      css={{
        '& svg': { width: '4', height: '4', flexShrink: 0 },
        '&[data-active=true]': { bg: 'selected-bg', fontWeight: 'medium' },
      }}
      {...props}
    />
  )
}

/**
 * The label beside an icon. The collapsed rail hides it visually but keeps it
 * as the link's accessible name.
 */
function NavLabel({ children }: { children: React.ReactNode }) {
  const { collapsed, isMobile } = useSidebar()
  return (
    <Text as="span" truncate srOnly={collapsed && !isMobile}>
      {children}
    </Text>
  )
}

export function AppSidebar({
  org,
  currentProject,
}: {
  org: Organization
  currentProject: Project | undefined
}) {
  const { collapsed, isMobile } = useSidebar()
  const rail = collapsed && !isMobile

  return (
    <Sidebar label="Navigation">
      {/* The collapsed rail is 3rem wide: 0.5rem of padding leaves exactly the
          2rem the logo mark needs. */}
      <Flex
        h="14"
        flexShrink={0}
        align="center"
        px={rail ? '2' : '3'}
        borderBottomWidth="1px"
        borderColor="border"
      >
        <SidebarTooltip label="DRILLS home">
          <HStack gap="2" fontWeight="semibold" minW="0">
            <Center
              boxSize="8"
              flexShrink={0}
              rounded="l2"
              bg="brand"
              color="on-brand"
              fontWeight="bold"
            >
              D
            </Center>
            {!rail && <Text as="span">DRILLS</Text>}
          </HStack>
        </SidebarTooltip>
      </Flex>

      <Box
        as="nav"
        aria-label="Main navigation"
        flex="1"
        overflowY="auto"
        overflowX="hidden"
        px="2"
        py="2"
      >
        <Stack as="ul" gap="1" listStyleType="none">
          {mainNavigation.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.label}>
                <SidebarTooltip label={item.label}>
                  {'to' in item ? (
                    <NavButton asChild>
                      <Link
                        to={item.to}
                        params={{ orgId: org.id }}
                        // `/organizations` must not light up on an org's
                        // settings page, which the Settings item owns.
                        activeOptions={{
                          exact:
                            item.to === '/' || item.to === '/organizations',
                        }}
                        activeProps={{ 'data-active': 'true' }}
                      >
                        <Icon />
                        <NavLabel>{item.label}</NavLabel>
                      </Link>
                    </NavButton>
                  ) : (
                    <NavButton onClick={() => unavailable(item.label)}>
                      <Icon />
                      <NavLabel>{item.label}</NavLabel>
                    </NavButton>
                  )}
                </SidebarTooltip>
              </li>
            )
          })}
        </Stack>

        <Box mt="4">
          {!rail && (
            <Text
              px="2"
              h="8"
              display="flex"
              alignItems="center"
              fontSize="2xs"
              fontWeight="semibold"
              letterSpacing="wider"
              color="fg.muted"
            >
              CURRENT PROJECT
            </Text>
          )}
          <Stack as="ul" gap="1" listStyleType="none">
            <li>
              <SidebarTooltip label={currentProject?.name ?? 'No project'}>
                {currentProject ? (
                  <NavButton asChild>
                    <Link
                      to="/projects/$projectId/overview"
                      params={{ projectId: currentProject.id }}
                    >
                      {/* An icon-sized slot, like the lucide icons above, so
                          the collapsed button shows only the mark. */}
                      <Center aria-hidden="true" boxSize="4" flexShrink={0}>
                        <Box boxSize="2" rounded="full" bg="brand" />
                      </Center>
                      <NavLabel>{currentProject.name}</NavLabel>
                    </Link>
                  </NavButton>
                ) : (
                  <Text
                    as="span"
                    px="2"
                    h="8"
                    display="flex"
                    alignItems="center"
                    textStyle="body-sm"
                  >
                    {rail ? '' : 'No active project'}
                  </Text>
                )}
              </SidebarTooltip>

              {currentProject && !rail && (
                <Stack
                  as="ul"
                  gap="1"
                  listStyleType="none"
                  ms="3.5"
                  ps="2.5"
                  py="0.5"
                  borderStartWidth="1px"
                  borderColor="border"
                >
                  {projectSections.map((label) => (
                    <li key={label}>
                      <Button
                        asChild
                        variant="ghost"
                        colorPalette="gray"
                        size="sm"
                        h="8"
                        w="full"
                        px="3"
                        justifyContent="flex-start"
                        fontWeight="normal"
                        color="fg.muted"
                        css={{
                          '&[data-active=true]': {
                            bg: 'brand.subtle',
                            color: 'brand.fg',
                            fontWeight: 'medium',
                          },
                        }}
                      >
                        <Link
                          to={projectSectionLink(label)}
                          params={{ projectId: currentProject.id }}
                          activeProps={{ 'data-active': 'true' }}
                        >
                          <Text as="span" truncate>
                            {label}
                          </Text>
                        </Link>
                      </Button>
                    </li>
                  ))}
                </Stack>
              )}
            </li>
          </Stack>
        </Box>
      </Box>
    </Sidebar>
  )
}
