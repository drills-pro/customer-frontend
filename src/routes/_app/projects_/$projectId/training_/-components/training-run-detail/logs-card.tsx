import type * as React from 'react'
import { Box, Button, Card, Checkbox, Flex } from '@chakra-ui/react'
import { Download } from 'lucide-react'

import { SimpleSelect } from '@/components/simple-select'
import { useTrainingLogs } from '@/features/training/queries'

import { downloadText } from './helpers'
import { useCurrentTrainingRun } from './use-current-training-run'

export function LogsCard({
  level,
  setLevel,
  autoscroll,
  setAutoscroll,
  logRef,
}: {
  level: string
  setLevel: (value: string) => void
  autoscroll: boolean
  setAutoscroll: (value: boolean) => void
  logRef: React.RefObject<HTMLPreElement | null>
}) {
  const { project, run } = useCurrentTrainingRun()
  const logs = useTrainingLogs(project.id, run.id, run.status === 'Running')
  // `INFO  Loading dataset …`: the level, padded so the messages line up.
  const lines = (logs.data ?? [])
    .map((line) => `${line.level.toUpperCase().padEnd(5)} ${line.message}`)
    .filter((line) => level === 'all' || line.startsWith(level))
  const content = lines.join('\n') || 'No logs at this level.'
  return (
    <Card.Root
      as="section"
      aria-labelledby="training-logs-title"
      variant="outline"
      overflow="hidden"
    >
      <Flex
        wrap="wrap"
        align="center"
        gap="3"
        px="5"
        py="3"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Card.Title
          as="h2"
          id="training-logs-title"
          me="auto"
          textStyle="body"
          fontWeight="semibold"
        >
          Logs
        </Card.Title>
        <Checkbox.Root
          size="sm"
          checked={autoscroll}
          onCheckedChange={(event) => setAutoscroll(event.checked === true)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
          <Checkbox.Label fontSize="xs" fontWeight="normal" color="fg.muted">
            Autoscroll
          </Checkbox.Label>
        </Checkbox.Root>
        <SimpleSelect
          label="Log level"
          hideLabel
          size="sm"
          width="28"
          value={level}
          onChange={setLevel}
          items={[
            { label: 'All levels', value: 'all' },
            { label: 'INFO', value: 'INFO' },
            { label: 'WARN', value: 'WARN' },
            { label: 'ERROR', value: 'ERROR' },
          ]}
        />
        <Button
          variant="outline"
          size="xs"
          onClick={() => downloadText(`${run.name}.log`, content)}
        >
          <Download />
          Download
        </Button>
      </Flex>
      <Box
        as="pre"
        ref={logRef}
        maxH="72"
        overflow="auto"
        bg="night"
        color="on-night"
        p="4"
        fontFamily="mono"
        fontSize="xs"
        lineHeight="relaxed"
      >
        {content}
      </Box>
    </Card.Root>
  )
}
