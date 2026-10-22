import { Button } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { StateScreen } from './StateScreen';

export function NotFound({ page }: { page?: boolean }) {
  const { t } = useTranslation();
  return (
    <StateScreen pose="idle" label={t('notFound.label')} title={t('notFound.title')} body={t('notFound.body')} page={page}>
      <Button asChild>
        <Link to="/">{t('notFound.cta')}</Link>
      </Button>
    </StateScreen>
  );
}
