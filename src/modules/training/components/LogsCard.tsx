import { useEffect, useRef, useState } from 'react';
import { Box, Button, Card, Checkbox, Flex, Skeleton, Text } from '@chakra-ui/react';
import { Download } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useRunLogs } from '@/modules/training/api';
import { SHORT_ID_LENGTH } from '@/modules/training/constants';
import { downloadText } from '@/shared/ui/download';

/** The end of the run's raw output, for when something went wrong. It follows the run's status (see `useRunLogs`); with Autoscroll
 * on, the newest line stays in view as more arrive. `tall` gives it the room of a tab of its own. */
export function LogsCard({ projectId, runId, status, tall = false }: { projectId: string; runId: string; status: string; tall?: boolean }) {
  const { t } = useTranslation();
  const logs = useRunLogs(projectId, runId, status);
  const [follow, setFollow] = useState(true);
  const box = useRef<HTMLPreElement>(null);
  const text = logs.data?.logs.trim();
  useEffect(() => {
    if (follow && text && box.current) box.current.scrollTop = box.current.scrollHeight;
  }, [follow, text]);

  return (
    <Card.Root variant="outline" overflow="hidden" data-testid="training-logs-card">
      <Flex wrap="wrap" align="center" gap="3" px="5" py="3" borderBottomWidth="1px" borderColor="border">
        <Card.Title as="h3" me="auto" textStyle="body" fontWeight="semibold">
          {t('training.run.logs')}
        </Card.Title>
        <Checkbox.Root size="sm" checked={follow} onCheckedChange={(e) => setFollow(e.checked === true)} data-testid="training-logs-follow">
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label textStyle="body-sm" fontWeight="normal" color="fg.muted">
            {t('training.run.autoscroll')}
          </Checkbox.Label>
        </Checkbox.Root>
        <Button
          size="xs"
          disabled={!text}
          onClick={() => text && downloadText(`training-${runId.slice(0, SHORT_ID_LENGTH)}.log`, text)}
          data-testid="training-logs-download"
        >
          <Download />
          {t('training.run.download')}
        </Button>
      </Flex>
      {logs.isPending && !logs.isError ? (
        <Box p="5">
          <Skeleton h="24" />
        </Box>
      ) : text ? (
        <Box
          as="pre"
          ref={box}
          data-testid="training-logs"
          m="0"
          p="4"
          maxH={tall ? '2xl' : '72'}
          overflow="auto"
          bg="night"
          color="on-night"
          textStyle="mono-sm"
          fontFamily="mono"
          whiteSpace="pre-wrap"
          wordBreak="break-word"
        >
          {text}
        </Box>
      ) : (
        <Text px="5" py="4" color="fg.muted" data-testid="training-logs-empty">
          {t('training.run.noLogs')}
        </Text>
      )}
    </Card.Root>
  );
}
