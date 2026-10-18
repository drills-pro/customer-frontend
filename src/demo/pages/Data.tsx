import {
  Avatar,
  AvatarGroup,
  Badge,
  Card,
  Code,
  DataList,
  HStack,
  Kbd,
  List,
  Separator,
  Stack,
  Table,
  Tag,
  Text,
  Timeline,
} from '@chakra-ui/react';
import { Check, Page, Section } from '../parts';

const runs = [
  { id: 'run-0042', status: 'Live', map: '0.91' },
  { id: 'run-0041', status: 'Archived', map: '0.84' },
  { id: 'run-0040', status: 'Archived', map: '0.77' },
];

export function Data() {
  return (
    <Page title="Data display" lead="Tables, chips, people and history. Label-class chips keep fixed colors on purpose.">
      <Section title="Table" wide>
        <Table.Root size="sm" variant="outline" interactive>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Run</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">mAP</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {runs.map((r, i) => (
              <Table.Row key={r.id} data-selected={i === 0 ? '' : undefined}>
                <Table.Cell fontFamily="mono">{r.id}</Table.Cell>
                <Table.Cell>
                  {r.status === 'Live' ? (
                    <Badge colorPalette="success" variant="subtle">
                      <Check />
                      Live
                    </Badge>
                  ) : (
                    <Badge colorPalette="gray" variant="subtle">
                      Archived
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell textAlign="end" fontFamily="mono">
                  {r.map}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Section>

      <Section title="Chips">
        <Stack gap="3">
          <HStack gap="2" wrap="wrap">
            <Badge variant="solid">Brand</Badge>
            <Badge variant="subtle">Brand</Badge>
            <Badge variant="outline">Brand</Badge>
            <Badge variant="subtle" colorPalette="secondary">
              Secondary
            </Badge>
            <Badge variant="outline" colorPalette="secondary">
              Secondary
            </Badge>
          </HStack>
          <HStack gap="2" wrap="wrap">
            <Badge bg="class-1" color="on-class">
              car
            </Badge>
            <Badge bg="class-2" color="on-class">
              truck
            </Badge>
            <Badge bg="class-3" color="on-class">
              van
            </Badge>
            <Badge bg="class-4" color="on-class-4">
              bus
            </Badge>
            <Badge bg="class-5" color="on-class">
              bike
            </Badge>
            <Badge bg="class-6" color="on-class">
              person
            </Badge>
          </HStack>
          <HStack gap="2" wrap="wrap">
            {['car', 'truck', 'bus'].map((t) => (
              <Tag.Root key={t}>
                <Tag.Label>{t}</Tag.Label>
                <Tag.EndElement>
                  <Tag.CloseTrigger aria-label={`Remove ${t}`} />
                </Tag.EndElement>
              </Tag.Root>
            ))}
          </HStack>
        </Stack>
      </Section>

      <Section title="People and keys">
        <Stack gap="4">
          <HStack gap="4">
            <AvatarGroup>
              <Avatar.Root>
                <Avatar.Fallback name="Nok Chotipun" />
              </Avatar.Root>
              <Avatar.Root colorPalette="secondary">
                <Avatar.Fallback name="Acme Logistics" />
              </Avatar.Root>
              <Avatar.Root colorPalette="gray">
                <Avatar.Fallback name="Green Farm" />
              </Avatar.Root>
            </AvatarGroup>
            <Text color="fg.muted">3 members</Text>
          </HStack>
          <Text color="fg.muted">
            Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search datasets.
          </Text>
        </Stack>
      </Section>

      <Section title="Cards">
        <Stack gap="3">
          {(['outline', 'elevated', 'subtle'] as const).map((v) => (
            <Card.Root key={v} variant={v}>
              <Card.Body>
                <Card.Title>{v}</Card.Title>
                <Card.Description>Defect detector v3 · 128 images</Card.Description>
              </Card.Body>
            </Card.Root>
          ))}
        </Stack>
      </Section>

      <Section title="Details and list">
        <Stack gap="4">
          <DataList.Root orientation="horizontal">
            {[
              ['Model', 'Defect detector v3'],
              ['Images', '128'],
              ['Endpoint', 'POST /v1/models/defect-v3/predict'],
            ].map(([k, v]) => (
              <DataList.Item key={k}>
                <DataList.ItemLabel>{k}</DataList.ItemLabel>
                <DataList.ItemValue>{k === 'Endpoint' ? <Code>{v}</Code> : v}</DataList.ItemValue>
              </DataList.Item>
            ))}
          </DataList.Root>
          <Separator />
          <List.Root gap="1" ps="5">
            <List.Item>Upload photos</List.Item>
            <List.Item>Draw boxes or tag them</List.Item>
            <List.Item>Press train</List.Item>
          </List.Root>
        </Stack>
      </Section>

      <Section title="History">
        <Timeline.Root>
          {[
            ['Training finished', 'run-0042 · mAP 0.91'],
            ['Images added', '24 photos by Nok'],
            ['Dataset created', 'conveyor-defects'],
          ].map(([t, d]) => (
            <Timeline.Item key={t}>
              <Timeline.Connector>
                <Timeline.Separator />
                <Timeline.Indicator />
              </Timeline.Connector>
              <Timeline.Content>
                <Timeline.Title>{t}</Timeline.Title>
                <Timeline.Description>{d}</Timeline.Description>
              </Timeline.Content>
            </Timeline.Item>
          ))}
        </Timeline.Root>
      </Section>
    </Page>
  );
}
