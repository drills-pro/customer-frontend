import { Box, Grid, Heading, Stack, Text } from '@chakra-ui/react';

export const q = new URLSearchParams(location.search);

export const Section = ({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) => (
  <Box as="section" gridColumn={wide ? '1 / -1' : undefined} minW="0">
    <Text textStyle="label" color="fg.muted" textTransform="uppercase" mb="3">
      {title}
    </Text>
    {children}
  </Box>
);

/** One page of the gallery: a heading, one line of context, and sections in a responsive grid. */
export const Page = ({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) => (
  <Stack gap="8">
    <Box>
      <Heading as="h1" textStyle="h1">
        {title}
      </Heading>
      <Text color="fg.muted" mt="2">
        {lead}
      </Text>
    </Box>
    <Grid templateColumns="repeat(auto-fit, minmax(min(100%, 22rem), 1fr))" gap="8" alignItems="start">
      {children}
    </Grid>
  </Stack>
);

export const Glyph = ({ d }: { d: string }) => (
  <svg
    viewBox="0 0 16 16"
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);
export const Check = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);
export const Tri = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M8 2.5l6 11H2z" />
    <path d="M8 7v3" />
  </svg>
);
export const X = () => (
  <svg
    viewBox="0 0 16 16"
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <circle cx="8" cy="8" r="6" />
    <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" />
  </svg>
);
