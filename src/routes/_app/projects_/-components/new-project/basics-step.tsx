import { Box, Field, Heading, Input, SimpleGrid, Stack, Text, Textarea } from '@chakra-ui/react';

import { SimpleSelect } from '@/components/simple-select';
import { useDashboardLayout } from '@/features/dashboard/context';
import type { NewProjectDraft } from './use-new-project-draft';

export function BasicsStep({ draft }: { draft: NewProjectDraft }) {
  const orgName = useDashboardLayout().org.name;
  return (
    <Stack as="section" gap="5">
      <Box>
        <Heading as="h2" fontSize="lg" fontWeight="semibold">
          Basics
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Name your project and choose where it lives.
        </Text>
      </Box>
      <Field.Root invalid={Boolean(draft.nameError)}>
        <Field.Label>Project name</Field.Label>
        <Input
          value={draft.name}
          onChange={(event) => draft.setName(event.target.value)}
          placeholder="e.g. Retail Vision"
          aria-describedby={draft.nameError ? 'new-project-name-error' : undefined}
          autoFocus
        />
        {draft.nameError && (
          <Text id="new-project-name-error" role="alert" fontSize="xs" color="fg.error">
            {draft.nameError}
          </Text>
        )}
      </Field.Root>
      <Field.Root>
        <Field.Label>
          Description{' '}
          <Text as="span" fontWeight="normal" color="fg.muted">
            (optional)
          </Text>
        </Field.Label>
        <Textarea
          value={draft.description}
          onChange={(event) => draft.setDescription(event.target.value)}
          placeholder="What is this project for?"
          rows={3}
        />
      </Field.Root>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
        <Field.Root disabled>
          <Field.Label>Organization</Field.Label>
          <Input value={orgName} readOnly />
        </Field.Root>
        <SimpleSelect
          label="Region"
          width="full"
          value={draft.region}
          onChange={draft.setRegion}
          items={draft.regions.map((item) => ({
            label: item.label,
            value: item.id,
          }))}
        />
      </SimpleGrid>
      <SimpleSelect
        label="Visibility"
        width="full"
        value={draft.visibility}
        onChange={(value) => draft.setVisibility(value as 'Organization' | 'Private')}
        items={[
          {
            label: `Organization — visible to everyone in ${orgName}`,
            value: 'Organization',
          },
          {
            label: 'Private — visible only to invited collaborators',
            value: 'Private',
          },
        ]}
      />
    </Stack>
  );
}
