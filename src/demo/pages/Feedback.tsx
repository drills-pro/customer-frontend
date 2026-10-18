import {
  Alert,
  Badge,
  Button,
  EmptyState,
  HStack,
  Progress,
  ProgressCircle,
  Skeleton,
  Spinner,
  Stack,
  Status,
  Text,
} from '@chakra-ui/react';
import { Bit } from '../../brand/Bit';
import { toaster } from '../../components/toaster';
import { Check, Page, Section, Tri, X } from '../parts';

const alerts = [
  { status: 'info', palette: 'info', title: 'Tip', text: 'Draw a box around each thing you want found.' },
  { status: 'success', palette: 'success', title: 'Endpoint is live', text: 'Send your first photo to try it.' },
  { status: 'warning', palette: 'warning', title: 'Low credits', text: '12 GPU-minutes left this month.' },
  { status: 'error', palette: 'danger', title: 'Training stopped', text: '3 images could not be read. Remove them or re-upload.' },
] as const;

export function Feedback() {
  return (
    <Page title="Feedback" lead="Say what happened and what to do next. Status always carries a glyph and a word.">
      <Section title="Alerts">
        <Stack gap="3">
          {alerts.map((a) => (
            <Alert.Root key={a.status} status={a.status} colorPalette={a.palette}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{a.title}</Alert.Title>
                <Alert.Description>{a.text}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          ))}
        </Stack>
      </Section>

      <Section title="Toasts">
        <HStack gap="3" wrap="wrap">
          {(['success', 'info', 'warning', 'error'] as const).map((type) => (
            <Button key={type} onClick={() => toaster.create({ title: `Toast: ${type}`, description: 'Closes by itself.', type })}>
              {type}
            </Button>
          ))}
        </HStack>
      </Section>

      <Section title="Status chips">
        <Stack gap="3">
          <HStack gap="2" wrap="wrap">
            <Badge colorPalette="success" variant="subtle">
              <Check />
              Live
            </Badge>
            <Badge colorPalette="warning" variant="subtle">
              <Tri />
              Low credits
            </Badge>
            <Badge colorPalette="danger" variant="subtle">
              <X />
              Failed
            </Badge>
            <Badge colorPalette="gray" variant="subtle">
              Archived
            </Badge>
          </HStack>
          <HStack gap="4" wrap="wrap">
            {(
              [
                ['success', 'Live'],
                ['warning', 'Low credits'],
                ['danger', 'Failed'],
                ['info', 'Queued'],
              ] as const
            ).map(([palette, word]) => (
              <Status.Root key={palette} colorPalette={palette}>
                <Status.Indicator />
                {word}
              </Status.Root>
            ))}
          </HStack>
        </Stack>
      </Section>

      <Section title="Progress">
        <HStack gap="6" align="center">
          <Progress.Root value={62} colorPalette="brand" flex="1">
            <HStack justify="space-between" mb="2">
              <Progress.Label>Epoch 31 of 50</Progress.Label>
              <Progress.ValueText />
            </HStack>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <ProgressCircle.Root value={62} size="lg" colorPalette="brand">
            <ProgressCircle.Circle>
              <ProgressCircle.Track />
              <ProgressCircle.Range />
            </ProgressCircle.Circle>
          </ProgressCircle.Root>
        </HStack>
      </Section>

      <Section title="Loading">
        <Stack gap="4">
          <HStack gap="4">
            <Spinner size="md" color="brand-text" />
            <Text color="fg.muted">Reading 128 images</Text>
          </HStack>
          <Stack gap="2">
            <Skeleton h="4" w="64" />
            <Skeleton h="4" w="48" />
          </Stack>
        </Stack>
      </Section>

      <Section title="Empty state">
        <EmptyState.Root>
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Bit pose="idle" size={128} />
            </EmptyState.Indicator>
            <EmptyState.Title>No datasets yet</EmptyState.Title>
            <EmptyState.Description>Upload a few photos and Bit will help you label them.</EmptyState.Description>
            <Button variant="solid">Create dataset</Button>
          </EmptyState.Content>
        </EmptyState.Root>
      </Section>
    </Page>
  );
}
