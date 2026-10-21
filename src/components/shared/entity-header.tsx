import type * as React from 'react';
import { Box, Card, Center, Flex, Heading, HStack, Icon, SimpleGrid, Text } from '@chakra-ui/react';
import type { LucideIcon } from 'lucide-react';

export type EntityStat = {
  label: string;
  value: React.ReactNode;
  /** Optional comparison line, e.g. `▲ 2.5 pts vs v2`. */
  delta?: React.ReactNode;
};

/**
 * The detail-page header shared by datasets, models and deployments: an icon
 * tile, the entity's identity and actions, and a stat strip welded to the
 * bottom of the same card.
 *
 * The strip draws its dividers with a 1px gap over the border color rather than
 * per-cell borders, because the cell that needs a right border changes when the
 * grid reflows from two columns to four.
 */
export function EntityHeader({
  icon: EntityIcon,
  name,
  mono = false,
  badges,
  meta,
  actions,
  stats,
}: {
  icon: LucideIcon;
  name: string;
  /** Identifier-style names (models, deployments) set in the mono face. */
  mono?: boolean;
  badges?: React.ReactNode;
  meta: React.ReactNode;
  actions: React.ReactNode;
  stats: EntityStat[];
}) {
  return (
    <Card.Root variant="outline" mb="6" overflow="hidden">
      <Flex wrap="wrap" align="center" justify="space-between" gap="4" px={{ base: '5', sm: '6' }} py="5">
        <HStack gap="4" minW="0">
          <Center boxSize="12" flexShrink={0} rounded="l3" bg="brand.subtle" color="brand.fg">
            <Icon boxSize="6" asChild>
              <EntityIcon />
            </Icon>
          </Center>
          <Box minW="0">
            <HStack wrap="wrap" gap="2">
              <Heading as="h1" truncate fontSize="md" fontWeight="semibold" letterSpacing="tight" fontFamily={mono ? 'mono' : undefined}>
                {name}
              </Heading>
              {badges}
            </HStack>
            <Box mt="1" fontSize="13px" color="fg.muted">
              {meta}
            </Box>
          </Box>
        </HStack>
        <HStack wrap="wrap" gap="2" flexShrink={0}>
          {actions}
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 2, sm: 4 }} gap="1px" borderTopWidth="1px" borderColor="border" bg="border">
        {stats.map((stat) => (
          <Box key={stat.label} bg="surface-raised" px={{ base: '5', sm: '6' }} py="4">
            <Text fontSize="11px" fontWeight="medium" letterSpacing="widest" color="fg.muted" textTransform="uppercase">
              {stat.label}
            </Text>
            <Text mt="1" fontSize="lg" fontWeight="semibold" fontVariantNumeric="tabular-nums" letterSpacing="tight">
              {stat.value}
            </Text>
            {stat.delta ? (
              <Box mt="0.5" fontSize="11px" fontWeight="medium">
                {stat.delta}
              </Box>
            ) : null}
          </Box>
        ))}
      </SimpleGrid>
    </Card.Root>
  );
}
