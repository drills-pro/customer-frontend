import type * as React from 'react';
import { Box, Center, Flex, Heading, Text } from '@chakra-ui/react';

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <Box>
      <Heading as="h1" fontSize="2xl" fontWeight="bold" letterSpacing="tight">
        {title}
      </Heading>
      <Text mt="1" textStyle="body-sm" color="fg.muted">
        {description}
      </Text>
    </Box>
  );
}

/** A card row: optional icon tile, title and description, then actions. */
export function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: React.ComponentType<{ size?: number }>;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Flex wrap="wrap" align="center" columnGap="4" rowGap="3" px="5" py="4">
      {Icon && (
        <Center aria-hidden="true" boxSize="9" flexShrink={0} rounded="l2" bg="brand.subtle" color="brand.fg">
          <Icon size={16} />
        </Center>
      )}
      <Box me="auto" minW="0" flexBasis="52" flexGrow={1}>
        <Text fontSize="13px" fontWeight="medium">
          {title}
        </Text>
        {description && (
          <Box mt="0.5" fontSize="xs" color="fg.muted">
            {description}
          </Box>
        )}
      </Box>
      {children}
    </Flex>
  );
}
