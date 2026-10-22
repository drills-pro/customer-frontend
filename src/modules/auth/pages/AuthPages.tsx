import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Center, Heading, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useRouter, useSearch } from '@tanstack/react-router';
import { Bit, Wordmark } from '@/brand/Bit';
import { ColorModeButton } from '@/components/color-mode';
import { LanguageSwitcher } from '@/components/language-switcher';
import { finishLogin } from '@/shared/auth/manager';
import { cfg } from '@/config';
import { useAuth } from '@/modules/auth/context';

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

/** Where to go after sign-in: the `return_to` search param, else home. */
const useReturnTo = () => useSearch({ strict: false }).return_to ?? '/';

export function LoginPage() {
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const returnTo = useReturnTo();
  return (
    <Shell title={t('auth.login.title')} lead={t('auth.login.lead')}>
      <Button variant="solid" disabled={!cfg.clientId} onClick={() => signIn(returnTo)} data-testid="login-signin">
        {t('auth.login.cta')}
      </Button>
      <Text textStyle="body-sm" color="fg.muted">
        {t('auth.login.newHere')}{' '}
        <Link asChild>
          <RouterLink to="/signup">{t('auth.login.createAccount')}</RouterLink>
        </Link>
      </Text>
    </Shell>
  );
}

export function SignupPage() {
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const returnTo = useReturnTo();
  return (
    <Shell title={t('auth.signup.title')} lead={t('auth.signup.lead')}>
      <Button variant="solid" disabled={!cfg.clientId} onClick={() => signUp(returnTo)} data-testid="signup-submit">
        {t('auth.signup.cta')}
      </Button>
      <Text textStyle="body-sm" color="fg.muted">
        {t('auth.signup.haveAccount')}{' '}
        <Link asChild>
          <RouterLink to="/login">{t('auth.signup.signIn')}</RouterLink>
        </Link>
      </Text>
    </Shell>
  );
}

export function CallbackPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [error, setError] = useState(false);
  useEffect(() => {
    finishLogin()
      .then((u) => router.history.replace(typeof u?.state === 'string' && u.state.startsWith('/') ? u.state : '/'))
      .catch((e) => {
        console.error(e);
        setError(true);
      });
  }, [router]);
  return (
    <Shell
      title={error ? t('auth.callback.failed') : t('auth.callback.working')}
      lead={error ? t('auth.callback.error') : t('auth.callback.wait')}
    >
      {error && (
        <Button asChild>
          <RouterLink to="/login">{t('auth.callback.back')}</RouterLink>
        </Button>
      )}
    </Shell>
  );
}
