import { Center } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { BitAnimated } from '@/brand/Bit';

/** Full-screen loading: the icon morphs into Bit. */
export function Splash() {
  const { t } = useTranslation();
  return (
    <Center minH="100vh">
      <BitAnimated timeline="morph" size={192} label={t('splash.label')} />
    </Center>
  );
}
