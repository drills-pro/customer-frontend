import { Alert, Box, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { datasetErrorKey } from '@/modules/datasets/errors';

/** A failed load: what failed, why in plain words, and a retry. */
export function LoadError({ title, error, onRetry }: { title: string; error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert.Root status="error" colorPalette="danger" data-testid="datasets-load-error">
      <Alert.Indicator />
      <Alert.Content gap="3">
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>{t(datasetErrorKey(error))}</Alert.Description>
        <Box>
          <Button size="sm" onClick={onRetry}>
            {t('datasets.retry')}
          </Button>
        </Box>
      </Alert.Content>
    </Alert.Root>
  );
}
