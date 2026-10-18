import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Center, Heading, HStack, Link, Stack, Text } from '@chakra-ui/react';
import { Bit, Wordmark } from '../brand/Bit';
import { ColorModeButton } from '../components/color-mode';
import { finishLogin, useAuth } from './auth';
import { cfg } from './config';
import { navigate } from './router';

function Shell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <Center minH="100vh" p="4">
      <Box position="absolute" top="4" right="4">
        <ColorModeButton size="sm" />
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
                <Alert.Title>Sign-in is not configured</Alert.Title>
                <Alert.Description>Set VITE_ZITADEL_CLIENT_ID (see .env.example) and restart.</Alert.Description>
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
  return (
    <Shell title="Welcome back" lead="Sign in to keep teaching your models.">
      <Button variant="solid" disabled={!cfg.clientId} onClick={() => signIn(returnTo())}>
        Continue to sign in
      </Button>
      <Text textStyle="body-sm" color="fg.muted">
        New here?{' '}
        <Link
          href="/signup"
          onClick={(e) => {
            e.preventDefault();
            navigate('/signup');
          }}
        >
          Create an account
        </Link>
      </Text>
    </Shell>
  );
}

export function SignupPage() {
  const { signUp } = useAuth();
  return (
    <Shell title="Create your account" lead="Start with a free workspace. You will finish on our secure sign-up page.">
      <Button variant="solid" disabled={!cfg.clientId} onClick={() => signUp(returnTo())}>
        Continue to sign up
      </Button>
      <Text textStyle="body-sm" color="fg.muted">
        Already have an account?{' '}
        <Link
          href="/login"
          onClick={(e) => {
            e.preventDefault();
            navigate('/login');
          }}
        >
          Sign in
        </Link>
      </Text>
    </Shell>
  );
}

export function CallbackPage() {
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    finishLogin()
      .then((u) => navigate(typeof u?.state === 'string' && u.state.startsWith('/') ? u.state : '/'))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);
  return (
    <Shell title={error ? 'Sign-in failed' : 'Signing you in'} lead={error ?? 'One moment.'}>
      {error && <Button onClick={() => navigate('/login')}>Back to sign in</Button>}
    </Shell>
  );
}
