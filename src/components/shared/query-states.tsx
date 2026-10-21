import type { ReactNode } from 'react';
import { Alert, Box, Button, Skeleton, Stack } from '@chakra-ui/react';

/** Placeholder rows shown while a card's data is on its way. */
export function CardLoading({ rows = 3 }: { rows?: number }) {
  return (
    <Stack gap="4" p="5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <Stack gap="2" key={index}>
          <Skeleton h="4" w="2/3" />
          <Skeleton h="3" w="1/3" />
        </Stack>
      ))}
    </Stack>
  );
}

export function CardError({ title, error, onRetry }: { title: string; error: Error; onRetry: () => void }) {
  return (
    <Box p="4">
      <Alert.Root status="error" colorPalette="danger">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{title}</Alert.Title>
          <Alert.Description>{error.message}</Alert.Description>
        </Alert.Content>
        <Button size="xs" variant="outline" alignSelf="center" onClick={onRetry}>
          Retry
        </Button>
      </Alert.Root>
    </Box>
  );
}

/** The frame a page section draws around its loading or error state. */
function SectionFrame({ children }: { children: ReactNode }) {
  return (
    <Box rounded="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
      {children}
    </Box>
  );
}

/** The space a page section holds while its data loads. */
export function SectionLoading() {
  return (
    <SectionFrame>
      <CardLoading rows={4} />
    </SectionFrame>
  );
}

/** A page section whose data could not be loaded. */
export function SectionError({ title, error, onRetry }: { title: string; error: Error; onRetry: () => void }) {
  return (
    <SectionFrame>
      <CardError title={title} error={error} onRetry={onRetry} />
    </SectionFrame>
  );
}

/** A whole page waiting for the record it is about. */
export function PageLoading() {
  return <Box as="main" id="dashboard-main" minH="96" flex="1" aria-busy="true" aria-label="Loading" />;
}

/** A whole page whose record could not be loaded for a reason other than 404. */
export function PageError({ title, error, onRetry }: { title: string; error: Error; onRetry: () => void }) {
  return (
    <Box as="main" id="dashboard-main" mx="auto" w="full" maxW="2xl" flex="1" p={{ base: '4', sm: '6' }}>
      <SectionFrame>
        <CardError title={title} error={error} onRetry={onRetry} />
      </SectionFrame>
    </Box>
  );
}
