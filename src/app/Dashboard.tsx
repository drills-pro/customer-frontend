import { Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import { Alert, Badge, Box, Button, Card, Container, Flex, Heading, HStack, Link, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import { AppIcon, Wordmark } from '../brand/Bit';
import { SimpleSelect } from '../components/simple-select';
import { ColorModeButton } from '../components/color-mode';
import { PAGES } from '../demo/App';
import { TENANTS } from '../demo/tenants';
import { ApiError, getMe, type Me } from './api';
import { useAuth } from './auth';

const themes = Object.keys(TENANTS).map((n) => ({ label: n, value: n }));

function Profile() {
  const { user, expire } = useAuth();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = user?.access_token;

  useEffect(() => {
    if (!token) return;
    getMe(token)
      .then(setMe)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) return expire(); // expired or wrong audience: back to login
        setError(e.message);
      });
  }, [token, expire]);

  if (error)
    return (
      <Alert.Root status="error" colorPalette="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Could not load your profile</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  return (
    <Card.Root>
      <Card.Header>
        <Text textStyle="label" color="fg.muted" textTransform="uppercase">
          Your profile · GET /v1/me
        </Text>
      </Card.Header>
      <Card.Body gap="5">
        {!me ? (
          <Stack>
            <Skeleton h="6" w="48" />
            <Skeleton h="4" w="64" />
          </Stack>
        ) : (
          <>
            <Box>
              <Heading as="h2" textStyle="h2">
                {me.name ?? me.email ?? 'Unnamed user'}
              </Heading>
              <Text color="fg.muted">{me.email ?? 'No email on file'}</Text>
              <Text textStyle="mono-sm" fontFamily="mono" color="fg.muted" mt="1" wordBreak="break-all">
                sub {me.sub}
              </Text>
            </Box>
            {me.tenants.length === 0 ? (
              <Alert.Root status="info" colorPalette="info">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>No workspace yet</Alert.Title>
                  <Alert.Description>You are signed in but belong to no tenant.</Alert.Description>
                </Alert.Content>
              </Alert.Root>
            ) : (
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Workspace</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Role</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {me.tenants.map((t) => (
                    <Table.Row key={t.id}>
                      <Table.Cell>{t.name}</Table.Cell>
                      <Table.Cell textAlign="end">
                        <Badge colorPalette="brand" variant="subtle">
                          {t.role}
                        </Badge>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </>
        )}
      </Card.Body>
    </Card.Root>
  );
}

const subscribe = (cb: () => void) => {
  addEventListener('hashchange', cb);
  return () => removeEventListener('hashchange', cb);
};
const useHash = () => useSyncExternalStore(subscribe, () => location.hash.slice(1));

/** App shell: sticky header, a sidebar on md+ (a scrolling row on phones), and the selected page. The page id lives in the URL hash. */
export function Dashboard({ theme, onTheme }: { theme: string; onTheme: (n: string) => void }) {
  const { signOut } = useAuth();
  const hash = useHash();
  const current = PAGES.find((p) => p.id === hash) ?? PAGES[0];
  return (
    <Flex direction="column" minH="100vh">
      <Flex
        as="header"
        align="center"
        justify="space-between"
        gap="4"
        wrap="wrap"
        px="6"
        py="3"
        bg="surface-raised"
        borderBottomWidth="2px"
        borderColor="border"
      >
        <HStack gap="3">
          <AppIcon size={48} />
          <Wordmark scale={2} />
        </HStack>
        <HStack gap="3">
          <SimpleSelect label="Theme" hideLabel size="sm" width="44" items={themes} value={theme} onChange={onTheme} />
          <ColorModeButton size="sm" />
          <Button size="sm" onClick={signOut}>
            Sign out
          </Button>
        </HStack>
      </Flex>
      <Flex flex="1" direction={{ base: 'column', md: 'row' }}>
        <Stack
          as="nav"
          aria-label="Pages"
          direction={{ base: 'row', md: 'column' }}
          gap="1"
          p="3"
          w={{ md: '56' }}
          flexShrink="0"
          overflowX={{ base: 'auto', md: 'visible' }}
          bg="surface-sunken"
          borderEndWidth={{ md: '2px' }}
          borderBottomWidth={{ base: '2px', md: '0' }}
          borderColor="border"
        >
          {PAGES.map((p) => {
            const active = p.id === current.id;
            return (
              <Link
                key={p.id}
                href={`#${p.id}`}
                aria-current={active ? 'page' : undefined}
                px="3"
                py="2"
                borderRadius="l2"
                whiteSpace="nowrap"
                textDecoration="none"
                color={active ? 'fg' : 'fg.muted'}
                bg={active ? 'selected-bg' : undefined}
                fontWeight={active ? 'semibold' : 'medium'}
                _hover={{ bg: active ? 'selected-bg' : 'bg.subtle', color: 'fg' }}
              >
                {p.label}
              </Link>
            );
          })}
        </Stack>
        <Container as="main" maxW="5xl" py="8" flex="1" minW="0">
          <Stack gap="10">
            {current.id === 'overview' && <Profile />}
            <Suspense fallback={<Skeleton h="64" />}>
              <current.Page />
            </Suspense>
          </Stack>
        </Container>
      </Flex>
    </Flex>
  );
}
