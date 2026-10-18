import { Alert, Badge, Button, Card, Grid, HStack, Progress, Stack, Stat, Table, Text } from '@chakra-ui/react';
import { BitAnimated } from '../../brand/Bit';
import { toaster } from '../../components/toaster';
import { Check, Page, Section, Tri, X, q } from '../parts';

export function Overview() {
  return (
    <Page title="Datasets" lead="Upload photos, draw boxes, and press train.">
      <Card.Root variant="elevated" gridColumn="1 / -1">
        <Card.Body>
          <HStack gap="5" align="center" wrap="wrap">
            <BitAnimated size={128} paused={!!q.get('still')} />
            <Stack gap="2" flex="1" minW="48">
              <Card.Title>Defect detector v3</Card.Title>
              <Card.Description>Trained on 128 images, 3 classes.</Card.Description>
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
              </HStack>
            </Stack>
            <Button
              variant="solid"
              onClick={() =>
                toaster.create({ title: 'Training started', description: 'We will email you when it finishes.', type: 'success' })
              }
            >
              Start training
            </Button>
          </HStack>
        </Card.Body>
      </Card.Root>

      <Section title="Usage">
        <Grid templateColumns="1fr 1fr" gap="4">
          <Card.Root variant="outline">
            <Card.Body>
              <Stat.Root>
                <Stat.Label>GPU-minutes left</Stat.Label>
                <Stat.ValueText fontFamily="mono">88</Stat.ValueText>
                <Stat.HelpText>of 100 this month</Stat.HelpText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
          <Card.Root variant="outline">
            <Card.Body>
              <Stat.Root>
                <Stat.Label>Best mAP</Stat.Label>
                <Stat.ValueText fontFamily="mono">0.91</Stat.ValueText>
                <Stat.HelpText>
                  <Stat.UpIndicator /> 0.07 vs v2
                </Stat.HelpText>
              </Stat.Root>
            </Card.Body>
          </Card.Root>
        </Grid>
      </Section>

      <Section title="Training">
        <Progress.Root value={62} colorPalette="brand">
          <HStack justify="space-between" mb="2">
            <Progress.Label>Epoch 31 of 50</Progress.Label>
            <Progress.ValueText />
          </HStack>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      </Section>

      <Section title="Alerts">
        <Stack gap="3">
          <Alert.Root status="warning" colorPalette="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Low credits</Alert.Title>
              <Alert.Description>12 GPU-minutes left this month.</Alert.Description>
            </Alert.Content>
          </Alert.Root>
          <Alert.Root status="error" colorPalette="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Training stopped</Alert.Title>
              <Alert.Description>3 images could not be read. Remove them or re-upload.</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        </Stack>
      </Section>

      <Section title="Recent runs">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Run</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">mAP</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row data-selected="">
              <Table.Cell fontFamily="mono">run-0042</Table.Cell>
              <Table.Cell>
                <Badge colorPalette="success" variant="subtle">
                  <Check />
                  Live
                </Badge>
              </Table.Cell>
              <Table.Cell textAlign="end" fontFamily="mono">
                0.91
              </Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell fontFamily="mono">run-0041</Table.Cell>
              <Table.Cell>
                <Badge colorPalette="gray" variant="subtle">
                  Archived
                </Badge>
              </Table.Cell>
              <Table.Cell textAlign="end" fontFamily="mono">
                0.84
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
        <Text textStyle="body-sm" color="fg.muted" mt="2">
          Status always has a glyph and a word.
        </Text>
      </Section>
    </Page>
  );
}
