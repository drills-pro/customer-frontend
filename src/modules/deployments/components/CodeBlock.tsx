import { Box } from '@chakra-ui/react';

interface Props {
  children: string;
  testId?: string;
  maxH?: string;
  /** Extra `data-*` attributes, for tests to read what the block shows. */
  data?: Record<`data-${string}`, string>;
}

/** Read-only code or JSON on the night surface, as the run log shows it. */
export function CodeBlock({ children, testId, maxH = '96', data }: Props) {
  return (
    <Box
      as="pre"
      data-testid={testId}
      {...data}
      m="0"
      p="4"
      maxH={maxH}
      overflow="auto"
      bg="night"
      color="on-night"
      textStyle="mono-sm"
      fontFamily="mono"
      whiteSpace="pre-wrap"
      wordBreak="break-word"
    >
      {children}
    </Box>
  );
}
