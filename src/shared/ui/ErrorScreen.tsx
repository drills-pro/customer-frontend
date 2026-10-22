import { Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { errorKey } from '@/shared/api/errors';
import { StateScreen } from './StateScreen';

/** Router error component: a translated message and a retry, never the server's text. */
export function ErrorScreen({ error, reset }: { error: unknown; reset: () => void }) {
  const { t } = useTranslation();
  return (
    <StateScreen pose="oops" label={t('errorScreen.label')} title={t('errorScreen.title')} body={t(errorKey(error))} page>
      <Button onClick={reset}>{t('errorScreen.retry')}</Button>
    </StateScreen>
  );
}
