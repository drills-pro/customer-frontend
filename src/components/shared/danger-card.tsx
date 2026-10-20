import * as React from 'react'
import { Card, Flex } from '@chakra-ui/react'
import type { CardRootProps } from '@chakra-ui/react'
import { TriangleAlert } from 'lucide-react'

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
