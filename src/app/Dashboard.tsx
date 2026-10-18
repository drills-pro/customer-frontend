import { useEffect, useState } from 'react';
import { Alert, Badge, Box, Button, Card, Container, Flex, Heading, HStack, NativeSelect, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { AppIcon, Wordmark } from '../brand/Bit';
import { ColorModeButton } from '../components/color-mode';
import { Showcase } from '../demo/App';
import { TENANTS } from '../demo/tenants';
import { ApiError, getMe, type Me } from './api';
import { useAuth } from './auth';

function Profile() {
  const { user, expire } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = user?.access_token;

  useEffect(() => {
    if (!token) return;
    getMe(token).then(setMe).catch((e) => {
      if (e instanceof ApiError && e.status === 401) return expire(); // expired or wrong audience: back to login
      setError(e.message);
    });
  }, [token, expire]);

  if (error) return <Alert.Root status="error" colorPalette="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Could not load your profile</Alert.Title><Alert.Description>{error}</Alert.Description></Alert.Content></Alert.Root>;
  return (
    <Card.Root>
      <Card.Header><Text textStyle="label" color="fg.muted" textTransform="uppercase">Your profile · GET /v1/me</Text></Card.Header>
      <Card.Body gap="5">
        {!me ? <Stack><Skeleton h="6" w="48" /><Skeleton h="4" w="64" /></Stack> : (
          <>
            <Box>
              <Heading as="h2" textStyle="h2">{me.name ?? me.email ?? 'Unnamed user'}</Heading>
              <Text color="fg.muted">{me.email ?? 'No email on file'}</Text>
              <Text textStyle="mono-sm" fontFamily="mono" color="fg.muted" mt="1" wordBreak="break-all">sub {me.sub}</Text>
            </Box>
            {me.tenants.length === 0 ? (
              <Alert.Root status="info" colorPalette="info"><Alert.Indicator /><Alert.Content><Alert.Title>No workspace yet</Alert.Title><Alert.Description>You are signed in but belong to no tenant.</Alert.Description></Alert.Content></Alert.Root>
            ) : (
              <Table.Root size="sm" variant="outline">
                <Table.Header><Table.Row><Table.ColumnHeader>Workspace</Table.ColumnHeader><Table.ColumnHeader textAlign="end">Role</Table.ColumnHeader></Table.Row></Table.Header>
                <Table.Body>{me.tenants.map((t) => (
                  <Table.Row key={t.id}><Table.Cell>{t.name}</Table.Cell><Table.Cell textAlign="end"><Badge colorPalette="brand" variant="subtle">{t.role}</Badge></Table.Cell></Table.Row>
                ))}</Table.Body>
              </Table.Root>
            )}
          </>
        )}
      </Card.Body>
    </Card.Root>
  );
}

export function Dashboard({ theme, onTheme }: { theme: string; onTheme: (n: string) => void }) {
  const { signOut } = useAuth();
  return (
    <Container maxW="6xl" py="8">
      <Flex as="header" align="center" justify="space-between" gap="4" wrap="wrap" mb="8">
        <HStack gap="3"><AppIcon size={64} /><Wordmark scale={3} /></HStack>
        <HStack gap="3">
          <NativeSelect.Root size="sm" width="44">
            <NativeSelect.Field aria-label="Theme" value={theme} onChange={(e) => onTheme(e.currentTarget.value)}>
              {Object.keys(TENANTS).map((n) => <option key={n} value={n}>{n}</option>)}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <ColorModeButton size="sm" />
          <Button size="sm" onClick={signOut}>Sign out</Button>
        </HStack>
      </Flex>
      <Stack gap="10"><Profile /><Showcase /></Stack>
    </Container>
  );
}
