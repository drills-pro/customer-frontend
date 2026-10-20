import * as React from 'react'
import { Box, Card, Center, Flex, Text } from '@chakra-ui/react'
import type { CardRootProps } from '@chakra-ui/react'
import { TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/** A section for destructive actions: red-ruled, with a warning title. */
export function DangerCard({
  title,
  children,
  ...props
}: { title: string } & Omit<CardRootProps, 'title'>) {
  const titleId = React.useId()
  return (
    <Card.Root
      as="section"
      aria-labelledby={titleId}
      variant="outline"
      overflow="hidden"
      borderColor="border.error"
      {...props}
    >
      <Flex
        align="center"
        gap="2"
        px="5"
        py="3.5"
        borderBottomWidth="1px"
        borderColor="border.error"
        bg="bg.error"
        color="fg.error"
      >
        <TriangleAlert size={16} aria-hidden="true" />
        <Card.Title as="h2" id={titleId} textStyle="body" fontWeight="semibold">
          {title}
        </Card.Title>
      </Flex>
      {children}
    </Card.Root>
  )
}

/** One destructive action in a DangerCard: what it does, then its button. */
export function DangerRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Flex
      wrap="wrap"
      align="center"
      gap="4"
      p="5"
      borderTopWidth="1px"
      borderColor="border"
      _first={{ borderTopWidth: '0' }}
    >
      <Center
        aria-hidden="true"
        boxSize="9"
        flexShrink={0}
        rounded="l2"
        bg="bg.error"
        color="fg.error"
      >
        <Icon size={16} />
      </Center>
      <Box me="auto" minW="0" flexBasis="60" flexGrow={1}>
        <Text fontSize="13px" fontWeight="medium">
          {title}
        </Text>
        <Text mt="0.5" fontSize="xs" color="fg.muted">
          {description}
        </Text>
      </Box>
      {children}
    </Flex>
  )
}

/** A destructive action that does not delete: red text on an outline button. */
export const dangerOutlineProps = {
  variant: 'outline',
  size: 'sm',
  px: '3.5',
  color: 'fg.error',
  _hover: { bg: 'bg.error', color: 'fg.error' },
} as const
