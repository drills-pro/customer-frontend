import * as React from 'react'
import { Box, Button, Card, Flex } from '@chakra-ui/react'
import type { ButtonProps, CardRootProps } from '@chakra-ui/react'

/**
 * A page section: an outlined card whose header (title, optional description
 * and action) is ruled off from the body. The body has no padding of its own,
 * so lists and tables can run edge to edge; pad it with `Card.Body` or a `Box`.
 * It is a `section` named by its title, so it is a landmark region.
 */
export function SectionCard({
  title,
  description,
  action,
  headingLevel = 'h2',
  children,
  ...props
}: {
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  headingLevel?: 'h2' | 'h3'
  children?: React.ReactNode
} & Omit<CardRootProps, 'title'>) {
  const titleId = React.useId()
  return (
    <Card.Root
      as="section"
      aria-labelledby={titleId}
      variant="outline"
      overflow="hidden"
      {...props}
    >
      <Flex
        align="center"
        justify="space-between"
        gap="3"
        px="5"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Box minW="0">
          <Card.Title
            as={headingLevel}
            id={titleId}
            textStyle="body"
            fontWeight="semibold"
          >
            {title}
          </Card.Title>
          {description && (
            <Card.Description mt="1" textStyle="body-sm">
              {description}
            </Card.Description>
          )}
        </Box>
        {action && <Box flexShrink={0}>{action}</Box>}
      </Flex>
      {children}
    </Card.Root>
  )
}

/** The text action in a section header ("View all", "Dismiss"). */
export function SectionAction(props: ButtonProps) {
  return (
    <Button
      variant="plain"
      size="sm"
      h="auto"
      px="0"
      fontWeight="medium"
      color="brand-text"
      _hover={{ textDecoration: 'underline' }}
      {...props}
    />
  )
}
