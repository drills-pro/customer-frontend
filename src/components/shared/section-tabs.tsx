import type * as React from 'react';
import { Flex, Link } from '@chakra-ui/react';
import type { FlexProps } from '@chakra-ui/react';

/** A row of line tabs that navigate between a record's sections. */
export function SectionTabs({ 'aria-label': label, children, ...props }: { 'aria-label': string } & FlexProps) {
  return (
    <Flex
      as="nav"
      aria-label={label}
      align="center"
      gap="6"
      overflowX="auto"
      whiteSpace="nowrap"
      borderBottomWidth="1px"
      borderColor="border"
      {...props}
    >
      {children}
    </Flex>
  );
}

/**
 * One tab: wraps a router link marked `data-active` while current, which is
 * underlined in the brand color.
 */
export function SectionTab({ children }: { children: React.ReactElement }) {
  return (
    <Link
      asChild
      flexShrink={0}
      px="1"
      py="3"
      mb="-1px"
      borderBottomWidth="2px"
      borderColor="transparent"
      textStyle="body-sm"
      fontWeight="medium"
      color="fg.muted"
      textDecoration="none"
      _hover={{ color: 'fg', textDecoration: 'none' }}
      css={{
        '&[data-active]': { borderColor: 'brand-text', color: 'brand-text' },
      }}
    >
      {children}
    </Link>
  );
}
