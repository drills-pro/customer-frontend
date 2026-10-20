import * as React from 'react'
import {
  Box,
  CloseButton,
  Drawer,
  Flex,
  IconButton,
  Link,
  Portal,
  Tooltip,
} from '@chakra-ui/react'
import type { FlexProps } from '@chakra-ui/react'
import { useLocation } from '@tanstack/react-router'
import { PanelLeftIcon } from 'lucide-react'

import { useIsMobile } from '@/hooks/use-mobile'

const SIDEBAR_WIDTH = '15rem'
const SIDEBAR_WIDTH_ICON = '3rem'
const SIDEBAR_WIDTH_MOBILE = '18rem'
const SIDEBAR_KEYBOARD_SHORTCUT = 'b'

type SidebarState = {
  /** Desktop only: the sidebar is down to its icon rail. */
  collapsed: boolean
  isMobile: boolean
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  toggle: () => void
}

const SidebarContext = React.createContext<SidebarState | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context)
    throw new Error('useSidebar must be used within SidebarProvider')
  return context
}

/**
 * Owns the sidebar's open state. Session-only by design: a refresh reopens it.
 * To keep the choice across refreshes, read it on the server and seed the
 * state from it rather than writing a cookie nothing reads back.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const toggle = React.useCallback(() => {
    if (isMobile) setMobileOpen((open) => !open)
    else setCollapsed((value) => !value)
  }, [isMobile])

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [toggle])

  // A link chosen in the mobile drawer has done its job once the page changes.
  const pathname = useLocation({ select: (location) => location.pathname })
  React.useEffect(() => setMobileOpen(false), [pathname])

  const value = React.useMemo(
    () => ({ collapsed, isMobile, mobileOpen, setMobileOpen, toggle }),
    [collapsed, isMobile, mobileOpen, toggle],
  )

  return (
    <SidebarContext.Provider value={value}>
      <Flex minH="100svh" w="full">
        {children}
      </Flex>
    </SidebarContext.Provider>
  )
}

/**
 * The sidebar column: fixed beside the page on desktop (a 3rem icon rail when
 * collapsed), a drawer below `md`. `children` renders in both.
 */
export function Sidebar({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  const { collapsed, isMobile, mobileOpen, setMobileOpen } = useSidebar()

  if (isMobile) {
    return (
      <Drawer.Root
        open={mobileOpen}
        onOpenChange={(event) => setMobileOpen(event.open)}
        placement="start"
      >
        <Portal>
          <Drawer.Backdrop />
          <Drawer.Positioner>
            <Drawer.Content
              maxW={SIDEBAR_WIDTH_MOBILE}
              bg="surface"
              data-testid="app-sidebar"
              data-state="expanded"
            >
              <Drawer.Title srOnly>{label}</Drawer.Title>
              <Flex direction="column" h="full" overflowY="auto">
                {children}
              </Flex>
              <Drawer.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Drawer.CloseTrigger>
            </Drawer.Content>
          </Drawer.Positioner>
        </Portal>
      </Drawer.Root>
    )
  }

  const width = collapsed ? SIDEBAR_WIDTH_ICON : SIDEBAR_WIDTH
  return (
    <Box
      data-testid="app-sidebar"
      data-state={collapsed ? 'collapsed' : 'expanded'}
      display={{ base: 'none', md: 'block' }}
      flexShrink={0}
      w={width}
      transition="width 0.2s linear"
    >
      <Flex
        direction="column"
        position="fixed"
        insetY="0"
        insetStart="0"
        zIndex="10"
        w={width}
        h="100svh"
        bg="surface"
        borderEndWidth="1px"
        borderColor="border"
        transition="width 0.2s linear"
        overflowX="hidden"
      >
        {children}
      </Flex>
    </Box>
  )
}

/** The page column beside the sidebar. */
export function SidebarInset(props: FlexProps) {
  return (
    <Flex
      position="relative"
      direction="column"
      flex="1"
      w="full"
      minW="0"
      bg="bg"
      {...props}
    />
  )
}

export function SidebarTrigger({
  'aria-label': label,
}: {
  'aria-label': string
}) {
  const { toggle } = useSidebar()
  return (
    <IconButton
      variant="ghost"
      colorPalette="gray"
      size="xs"
      aria-label={label}
      onClick={toggle}
    >
      <PanelLeftIcon />
    </IconButton>
  )
}

/** Shows `label` beside an item while the sidebar is down to its icon rail. */
export function SidebarTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactElement
}) {
  const { collapsed, isMobile } = useSidebar()
  return (
    <Tooltip.Root
      positioning={{ placement: 'right' }}
      disabled={!collapsed || isMobile}
      openDelay={0}
    >
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Portal>
        <Tooltip.Positioner>
          <Tooltip.Content>{label}</Tooltip.Content>
        </Tooltip.Positioner>
      </Portal>
    </Tooltip.Root>
  )
}

/** Hidden until focused: the first Tab stop jumps past the navigation. */
export function SkipLink() {
  return (
    <Link
      href="#dashboard-main"
      position="fixed"
      insetStart="5"
      top="-60px"
      zIndex="toast"
      p="2.5"
      bg="surface-raised"
      color="brand-text"
      rounded="l2"
      _focus={{ top: '2.5' }}
    >
      Skip to content
    </Link>
  )
}
