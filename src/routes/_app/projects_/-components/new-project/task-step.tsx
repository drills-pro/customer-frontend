import { Box, Button, Flex, Heading, SimpleGrid, Text } from '@chakra-ui/react'
import { FolderKanban } from 'lucide-react'

import type { NewProjectDraft } from './use-new-project-draft'

export function TaskStep({ draft }: { draft: NewProjectDraft }) {
  return (
    <section>
      <Box>
        <Heading as="h2" fontSize="lg" fontWeight="semibold">
          Task type
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Choose what this project is trained to do.
        </Text>
      </Box>
      <SimpleGrid mt="5" columns={{ base: 1, sm: 2 }} gap="3">
        {draft.taskTypes.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => draft.selectTask(item.id)}
            aria-pressed={draft.task === item.id}
            flexDirection="column"
            alignItems="stretch"
            justifyContent="flex-start"
            gap="0"
          >
            <Flex align="flex-start" justify="space-between">
              <Box color="brand-text">
                <FolderKanban size={20} />
              </Box>
              {draft.task === item.id && (
                <Text as="span" color="brand-text" aria-hidden="true">
                  ●
                </Text>
              )}
            </Flex>
            <Text mt="2" textStyle="body-sm" fontWeight="medium">
              {item.label}
            </Text>
          </Button>
        ))}
      </SimpleGrid>
    </section>
  )
}
