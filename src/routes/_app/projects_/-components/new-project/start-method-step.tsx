import { Box, Button, Heading, Stack, Text } from '@chakra-ui/react'

import { EmptyNotice } from '@/components/shared/empty-notice'
import { useDashboardLayout } from '@/features/dashboard/context'
import { ProjectMark } from '@/features/projects/components/project-ui'
import { startMethods } from './types'
import type { NewProjectDraft } from './use-new-project-draft'

/** The dot that marks the chosen option. */
function Chosen() {
  return (
    <Text as="span" color="brand-text" aria-hidden="true">
      ●
    </Text>
  )
}

export function StartMethodStep({ draft }: { draft: NewProjectDraft }) {
  const orgName = useDashboardLayout().org.name
  return (
    <section>
      <Box>
        <Heading as="h2" fontSize="lg" fontWeight="semibold">
          Start method
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Choose how this project&apos;s first dataset gets created.
        </Text>
      </Box>
      <Stack mt="5" gap="2.5">
        {startMethods.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => draft.selectStartMethod(item.id)}
            aria-pressed={draft.startMethod === item.id}
            w="full"
            alignItems="flex-start"
            justifyContent="flex-start"
            gap="3"
          >
            <Box mt="0.5" flexShrink={0} color="brand-text">
              <item.icon size={20} />
            </Box>
            <Box minW="0">
              <Text textStyle="body-sm" fontWeight="medium">
                {item.label}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {item.description}
              </Text>
            </Box>
            {draft.startMethod === item.id && (
              <Box ms="auto">
                <Chosen />
              </Box>
            )}
          </Button>
        ))}
      </Stack>

      {draft.startMethod === 'template' && (
        <Box mt="5">
          {draft.templates.length ? (
            <Stack gap="2.5">
              {draft.templates.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="option"
                  onClick={() => draft.setTemplateId(template.id)}
                  aria-pressed={draft.templateId === template.id}
                  w="full"
                  justifyContent="space-between"
                  gap="4"
                >
                  <Box minW="0">
                    <Text textStyle="body-sm" fontWeight="medium">
                      {template.name}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {template.description}
                    </Text>
                    <Text
                      mt="1"
                      fontSize="11px"
                      fontWeight="medium"
                      color="fg.muted"
                    >
                      {template.items.toLocaleString('en-US')} items ·{' '}
                      {template.size}
                    </Text>
                  </Box>
                  {draft.templateId === template.id && <Chosen />}
                </Button>
              ))}
            </Stack>
          ) : (
            <EmptyNotice
              minH="40"
              rounded="l3"
              borderWidth="1px"
              borderColor="border"
              title="No templates for this task yet"
              description="Choose a different task type or start by uploading your own dataset instead."
            />
          )}
        </Box>
      )}

      {draft.startMethod === 'clone' && (
        <Box mt="5">
          {draft.cloneCandidates.length ? (
            <Stack gap="2.5">
              {draft.cloneCandidates.map((candidate) => (
                <Button
                  key={candidate.id}
                  type="button"
                  variant="option"
                  onClick={() => draft.setSourceProjectId(candidate.id)}
                  aria-pressed={draft.sourceProjectId === candidate.id}
                  w="full"
                  justifyContent="flex-start"
                  gap="3"
                >
                  <ProjectMark project={candidate} boxSize="8" />
                  <Box minW="0" flex="1">
                    <Text truncate textStyle="body-sm" fontWeight="medium">
                      {candidate.name}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {candidate.task}
                    </Text>
                  </Box>
                  {draft.sourceProjectId === candidate.id && <Chosen />}
                </Button>
              ))}
            </Stack>
          ) : (
            <EmptyNotice
              minH="40"
              rounded="l3"
              borderWidth="1px"
              borderColor="border"
              title="No compatible projects to clone"
              description={`There are no other ${draft.taskLabel} projects in ${orgName} yet.`}
            />
          )}
          <Text mt="3" fontSize="xs" color="fg.muted">
            Cloning copies project setup only — datasets, runs, models, and
            deployments are not duplicated.
          </Text>
        </Box>
      )}
    </section>
  )
}
