import * as React from 'react'
import {
  Box,
  Button,
  Code,
  Field,
  Fieldset,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { Building2, Lock } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { CopyButton } from '@/components/shared/copy-button'
import { FormFooter } from '@/components/shared/form-footer'
import {
  RadioButton,
  RadioButtonGroup,
} from '@/components/shared/radio-button-group'
import { SectionCard } from '@/components/shared/section-card'
import { SECTION_OFFSET } from '@/components/shared/settings-nav'
import { ProjectMark } from '@/features/projects/components/project-ui'
import { ApiError } from '@/api/client'
import { useProjectDetail } from '@/features/dashboard/context'
import type { ProjectOverview } from '@/features/dashboard/data'
import { toApiVisibility } from '@/features/organizations/mappers'
import { useUpdateProject } from '@/features/projects/queries'

const NAME_MAX = 64
const DESCRIPTION_MAX = 240

type Visibility = ProjectOverview['visibility']
type GeneralValues = {
  name: string
  description: string
  visibility: Visibility
}

const visibilityOptions: Array<{
  value: Visibility
  label: string
  description: string
  icon: typeof Lock
}> = [
  {
    value: 'Organization',
    label: 'Organization',
    description: 'Everyone in the organization can view this project.',
    icon: Building2,
  },
  {
    value: 'Private',
    label: 'Private',
    description: 'Only invited members can see or open this project.',
    icon: Lock,
  },
]

function nameError(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return 'Project name is required.'
  if (trimmed.length > NAME_MAX)
    return `Keep the name under ${NAME_MAX} characters.`
  return undefined
}

export function GeneralCard() {
  const { project, details } = useProjectDetail()
  const updateProject = useUpdateProject(project.id)
  const saved: GeneralValues = {
    name: project.name,
    description: project.description,
    visibility: details.visibility,
  }
  const [values, setValues] = React.useState(saved)
  /** A name the API refused because another project already has it. */
  const [takenName, setTakenName] = React.useState<string>()

  const error =
    values.name.trim() === takenName
      ? 'A project with this name already exists.'
      : nameError(values.name)
  const dirty =
    values.name !== saved.name ||
    values.description !== saved.description ||
    values.visibility !== saved.visibility
  const taskLocked = details.pipeline.runs > 0

  function update<TKey extends keyof GeneralValues>(
    key: TKey,
    value: GeneralValues[TKey],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!dirty || error || updateProject.isPending) return
    const next = { ...values, name: values.name.trim() }
    updateProject.mutate(
      {
        // Only what changed: the API has one call for the name and
        // description and another for the visibility.
        ...(next.name !== saved.name ? { name: next.name } : {}),
        ...(next.description !== saved.description
          ? { description: next.description }
          : {}),
        ...(next.visibility !== saved.visibility
          ? { visibility: toApiVisibility(next.visibility) }
          : {}),
      },
      {
        onSuccess: () => {
          setValues(next)
          toaster.create({ type: 'success', title: 'Project settings saved.' })
        },
        onError: (failure) => {
          if (failure instanceof ApiError && failure.status === 409) {
            setTakenName(next.name)
          }
        },
      },
    )
  }

  return (
    <SectionCard
      id="general"
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title="General"
      description="How this project is named and who can find it."
    >
      <form onSubmit={save} noValidate>
        <Stack gap="5" p="5">
          <Flex
            wrap="wrap"
            align="center"
            gap="4"
            rounded="l2"
            bg="bg.muted"
            p="3"
          >
            <ProjectMark project={project} boxSize="11" />
            <Box me="auto" minW="0">
              <Text truncate fontWeight="medium">
                {values.name || '—'}
              </Text>
              <HStack gap="1.5" fontSize="xs" color="fg.muted">
                Project ID
                <Code size="sm">{project.id}</Code>
              </HStack>
            </Box>
            <CopyButton value={project.id} label="Copy project ID">
              Copy ID
            </CopyButton>
          </Flex>

          <Field.Root invalid={Boolean(error)}>
            <Field.Label>Project name</Field.Label>
            <Input
              value={values.name}
              aria-describedby={error ? 'project-name-error' : undefined}
              onChange={(event) => update('name', event.target.value)}
            />
            {error && (
              <Text
                id="project-name-error"
                role="alert"
                textStyle="body-sm"
                color="fg.error"
              >
                {error}
              </Text>
            )}
          </Field.Root>

          <Field.Root>
            <Flex w="full" align="baseline" justify="space-between" gap="2">
              <Field.Label>Description</Field.Label>
              <Text
                as="span"
                fontSize="xs"
                fontVariantNumeric="tabular-nums"
                color={
                  values.description.length > DESCRIPTION_MAX * 0.9
                    ? 'fg.warning'
                    : 'fg.muted'
                }
              >
                {values.description.length}/{DESCRIPTION_MAX}
              </Text>
            </Flex>
            <Textarea
              rows={3}
              maxLength={DESCRIPTION_MAX}
              value={values.description}
              placeholder="What does this project predict, and for whom?"
              onChange={(event) => update('description', event.target.value)}
            />
          </Field.Root>

          <SimpleGrid columns={{ base: 1, sm: 2 }} gap="5">
            <Field.Root disabled>
              <Field.Label>Task type</Field.Label>
              <Input value={project.task} readOnly />
              <Field.HelperText>
                {taskLocked
                  ? 'Locked after the first training run.'
                  : 'Chosen when the project was created.'}
              </Field.HelperText>
            </Field.Root>
            <Field.Root disabled>
              <Field.Label>Region</Field.Label>
              <Input value={details.region} readOnly />
              <Field.HelperText>
                Datasets and endpoints stay in this region.
              </Field.HelperText>
            </Field.Root>
          </SimpleGrid>

          <Fieldset.Root>
            <Fieldset.Legend textStyle="body-sm" fontWeight="medium" mb="3">
              Visibility
            </Fieldset.Legend>
            <RadioButtonGroup
              aria-label="Visibility"
              value={values.visibility}
              onChange={(value) => update('visibility', value as Visibility)}
              display="grid"
              gridTemplateColumns={{ sm: 'repeat(2, minmax(0, 1fr))' }}
              gap="3"
            >
              {visibilityOptions.map((option) => (
                <RadioButton
                  key={option.value}
                  value={option.value}
                  variant="option"
                  alignItems="flex-start"
                  justifyContent="flex-start"
                  gap="3"
                >
                  <Box mt="0.5" color="fg.muted">
                    <option.icon size={16} aria-hidden="true" />
                  </Box>
                  <Box flex="1" minW="0">
                    <Text textStyle="body-sm" fontWeight="medium">
                      {option.label}
                    </Text>
                    <Text textStyle="body-sm" color="fg.muted">
                      {option.description}
                    </Text>
                  </Box>
                </RadioButton>
              ))}
            </RadioButtonGroup>
          </Fieldset.Root>

          <SimpleGrid
            as="dl"
            columns={{ base: 2, sm: 3 }}
            columnGap="6"
            rowGap="3"
            borderTopWidth="1px"
            borderColor="border"
            pt="5"
            fontSize="13px"
          >
            {[
              ['Framework', details.framework],
              ['Created', details.created],
              ['Last updated', project.updated],
            ].map(([label, value]) => (
              <Box key={label} minW="0">
                <Box as="dt" fontSize="xs" color="fg.muted">
                  {label}
                </Box>
                <Box as="dd" mt="0.5" truncate fontWeight="medium">
                  {value}
                </Box>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>

        <FormFooter dirty={dirty}>
          <Button
            type="button"
            variant="ghost"
            colorPalette="gray"
            size="sm"
            px="3.5"
            disabled={!dirty}
            onClick={() => setValues(saved)}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="solid"
            size="sm"
            px="3.5"
            disabled={!dirty || Boolean(error)}
          >
            Save changes
          </Button>
        </FormFooter>
      </form>
    </SectionCard>
  )
}
