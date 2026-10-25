import { Alert, Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { step, type StepId } from '@/modules/projects/constants';

/** One reviewed value: its label, value and the step that changes it. */
export interface ReviewRow {
  id: string;
  label: string;
  value: string;
  edit: StepId;
}

/** The chosen values, each with a way back to change it, plus the create error when there is one. */
export function ReviewStep({ rows, onEdit, error }: { rows: ReviewRow[]; onEdit: (index: number) => void; error: string | null }) {
  const { t } = useTranslation();
  return (
    <Stack as="section" gap="5">
      <Box>
        <Heading as="h2" textStyle="h3">
          {t('newProject.review.title')}
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          {t('newProject.review.description')}
        </Text>
      </Box>
      <Stack gap="2.5">
        {rows.map((row) => (
          <Flex key={row.id} align="center" justify="space-between" gap="4" borderRadius="l3" borderWidth="2px" borderColor="border" p="4">
            <Box minW="0">
              <Text textStyle="label" color="fg.muted" textTransform="uppercase">
                {row.label}
              </Text>
              <Text mt="1" textStyle="body-sm" fontWeight="semibold" wordBreak="break-word">
                {row.value}
              </Text>
            </Box>
            <Button
              variant="plain"
              size="xs"
              flexShrink={0}
              color="brand-text"
              onClick={() => onEdit(step(row.edit))}
              aria-label={t('newProject.review.editLabel', { name: row.label })}
            >
              {t('newProject.review.edit')}
            </Button>
          </Flex>
        ))}
      </Stack>
      <Text textStyle="body-sm" color="fg.muted">
        {t('newProject.review.admin')}
      </Text>
      {error && (
        <Alert.Root status="error" colorPalette="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('newProject.error.title')}</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
    </Stack>
  );
}
