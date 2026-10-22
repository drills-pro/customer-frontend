import { Suspense } from 'react';
import { Box, Button, Container, Flex, HStack, Link, Skeleton, Stack } from '@chakra-ui/react';
import { Link as RouterLink } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AppIcon, Wordmark } from '@/brand/Bit';
import { ColorModeButton } from '@/components/color-mode';
import { LanguageSwitcher } from '@/components/language-switcher';
import { SimpleSelect } from '@/components/simple-select';
import { usePreviewTheme } from '@/showcase/preview-theme';
import { PAGES } from './App';
import { TENANTS } from './tenants';

const themes = Object.keys(TENANTS).map((n) => ({ label: n, value: n }));

/** The component gallery at /showcase: a header with the tenant preview switch, a sidebar of pages, and the selected page. */
export function Showcase({ page }: { page: string }) {
  const { t } = useTranslation();
  const { theme, setTheme } = usePreviewTheme();
  const current = PAGES.find((p) => p.id === page) ?? PAGES[0];
  return (
    <Flex direction="column" minH="100vh" data-testid="showcase">
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
        <HStack gap="3" wrap="wrap">
          <SimpleSelect label={t('dashboard.theme')} hideLabel size="sm" width="44" items={themes} value={theme} onChange={setTheme} />
          <LanguageSwitcher />
          <ColorModeButton size="sm" />
          <Button asChild size="sm">
            <RouterLink to="/">{t('showcase.back')}</RouterLink>
          </Button>
        </HStack>
      </Flex>
      <Flex flex="1" direction={{ base: 'column', md: 'row' }}>
        <Stack
          as="nav"
          aria-label={t('dashboard.pagesLabel')}
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
                asChild
                data-testid={`showcase-nav-${p.id}`}
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
                <RouterLink to="/showcase/$page" params={{ page: p.id }}>
                  {t(`nav.${p.id}`)}
                </RouterLink>
              </Link>
            );
          })}
        </Stack>
        <Container as="main" maxW="5xl" py="8" flex="1" minW="0">
          <Box>
            <Suspense fallback={<Skeleton h="64" />}>
              <current.Page />
            </Suspense>
          </Box>
        </Container>
      </Flex>
    </Flex>
  );
}
