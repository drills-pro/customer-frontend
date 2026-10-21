import * as React from 'react';
import { Box, Link } from '@chakra-ui/react';
import { Link as RouterLink, useLocation } from '@tanstack/react-router';

import { SECTION_OFFSET } from '@/components/shared/settings-nav';

export const accountSections = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/security', label: 'Security' },
  { to: '/account/notifications', label: 'Notifications' },
  { to: '/account/billing', label: 'Billing & usage' },
  { to: '/account/api-keys', label: 'API keys' },
  { to: '/account/team', label: 'Team' },
  { to: '/account/appearance', label: 'Appearance' },
] as const;

export function AccountNav() {
  const navRef = React.useRef<HTMLElement>(null);
  const pathname = useLocation({ select: (location) => location.pathname });

  // On narrow screens the nav is a horizontal strip; keep the current tab in
  // view. Only the strip scrolls, never the page.
  React.useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [pathname]);

  return (
    <Box
      as="nav"
      ref={navRef}
      aria-label="Account settings"
      display="flex"
      gap="1"
      mx={{ base: '-1', lg: '0' }}
      px={{ base: '1', lg: '0' }}
      pb="1"
      overflowX={{ base: 'auto', lg: 'visible' }}
      flexDirection={{ lg: 'column' }}
      position={{ lg: 'sticky' }}
      top={{ lg: `${SECTION_OFFSET}px` }}
      alignSelf={{ lg: 'flex-start' }}
    >
      {accountSections.map((section) => (
        <Link
          key={section.to}
          asChild
          flexShrink={0}
          rounded="l2"
          px="3"
          py="2"
          textStyle="body-sm"
          whiteSpace="nowrap"
          color="fg.muted"
          textDecoration="none"
          _hover={{ bg: 'bg.muted', textDecoration: 'none' }}
          _currentPage={{
            bg: 'brand.subtle',
            fontWeight: 'medium',
            color: 'brand.fg',
          }}
        >
          <RouterLink to={section.to} activeProps={{ 'aria-current': 'page' }}>
            {section.label}
          </RouterLink>
        </Link>
      ))}
    </Box>
  );
}
