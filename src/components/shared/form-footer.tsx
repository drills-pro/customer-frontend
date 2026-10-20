import type * as React from 'react'
import { Box, Flex, HStack } from '@chakra-ui/react'

/**
 * The action row under a settings form: says when there are unsaved
 * changes, then the buttons (Reset/Cancel and Save).
 */
export function FormFooter({
  dirty,
  children,
}: {
  dirty: boolean
  children: React.ReactNode
}) {
  return (
    <Flex
      wrap="wrap"
      align="center"
      justify="flex-end"
      gap="2"
      borderTopWidth="1px"
      borderColor="border"
      px="5"
      py="4"
    >
      {dirty && (
        <HStack role="status" me="auto" gap="2" fontSize="xs" color="fg.muted">
          <Box aria-hidden="true" boxSize="1.5" rounded="full" bg="warning" />
          Unsaved changes
        </HStack>
      )}
      {children}
    </Flex>
  )
}
