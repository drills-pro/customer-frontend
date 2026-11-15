import { Box } from '@chakra-ui/react';

/** Read-only code or JSON on the night surface, as the run log shows it. */
export function CodeBlock({ children, testId, maxH = '96' }: { children: string; testId?: string; maxH?: string }) {
  return (
    <Box
      as="pre"
      data-testid={testId}
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
