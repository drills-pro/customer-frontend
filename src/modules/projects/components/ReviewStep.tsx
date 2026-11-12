import { Alert, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { step, type StepId } from '@/modules/projects/constants';
import { ReviewRows, StepHeading } from '@/shared/ui/wizard';

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
      <StepHeading title={t('newProject.review.title')} description={t('newProject.review.description')} />
      <ReviewRows
        rows={rows.map((row) => ({ ...row, edit: step(row.edit) }))}
        onEdit={onEdit}
        editText={t('newProject.review.edit')}
        editLabel={(name) => t('newProject.review.editLabel', { name })}
      />
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
