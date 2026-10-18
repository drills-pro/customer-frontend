import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Center, Heading, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Bit, Wordmark } from '../brand/Bit';
import { ColorModeButton } from '../components/color-mode';
import { LanguageSwitcher } from '../components/language-switcher';
import { finishLogin, useAuth } from './auth';
import { cfg } from './config';
import { navigate } from './router';

function Shell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <Center minH="100vh" p="4">
      <Box position="absolute" top="4" right="4">
        <HStack gap="2">
          <LanguageSwitcher />
          <ColorModeButton size="sm" />
        </HStack>
      </Box>
      <Card.Root w="full" maxW="md">
        <Card.Body gap="6">
          <HStack gap="3">
            <Bit pose="detect" size={64} />
            <Wordmark scale={3} />
          </HStack>
          <Stack gap="2">
            <Heading as="h1" textStyle="h1">
              {title}
            </Heading>
            <Text color="fg.muted">{lead}</Text>
          </Stack>
          {cfg.clientId ? null : (
            <Alert.Root status="warning" colorPalette="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('auth.notConfigured.title')}</Alert.Title>
                <Alert.Description>{t('auth.notConfigured.description')}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          {children}
        </Card.Body>
      </Card.Root>
    </Center>
  );
}

const returnTo = () => new URLSearchParams(location.search).get('return_to') ?? '/';

export function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  return (
    <Shell title={t('auth.login.title')} lead={t('auth.login.lead')}>
      <Button variant="solid" disabled={!cfg.clientId} onClick={() => signIn(returnTo())}>
        {t('auth.login.cta')}
      </Button>
      <Text textStyle="body-sm" color="fg.muted">
        {t('auth.login.newHere')}{' '}
        <Link
          href="/signup"
          onClick={(e) => {
            e.preventDefault();
            navigate('/signup');
          }}
        >
          {t('auth.login.createAccount')}
        </Link>
      </Text>
    </Shell>
  );
}

export function SignupPage() {
  const { signUp } = useAuth();
  const { t } = useTranslation();
  return (
    <Shell title={t('auth.signup.title')} lead={t('auth.signup.lead')}>
      <Button variant="solid" disabled={!cfg.clientId} onClick={() => signUp(returnTo())}>
        {t('auth.signup.cta')}
      </Button>
      <Text textStyle="body-sm" color="fg.muted">
        {t('auth.signup.haveAccount')}{' '}
        <Link
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          {t('auth.signup.signIn')}
        </Link>
      </Text>
    </Shell>
  );
}

export function CallbackPage() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    finishLogin()
      .then((u) => navigate(typeof u?.state === 'string' && u.state.startsWith('/') ? u.state : '/'))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  return (
    <Shell title={error ? t('auth.callback.failed') : t('auth.callback.working')} lead={error ?? t('auth.callback.wait')}>
      {error && <Button onClick={() => navigate('/login')}>{t('auth.callback.back')}</Button>}
    </Shell>
  );
}
