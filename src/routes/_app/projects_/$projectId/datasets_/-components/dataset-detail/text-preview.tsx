import * as React from 'react'
import {
  Badge,
  Card,
  Flex,
  Input,
  InputGroup,
  Table,
  Text,
} from '@chakra-ui/react'
import { Search } from 'lucide-react'

import { EmptyNotice } from '@/components/shared/empty-notice'
import { SimpleSelect } from '@/components/simple-select'
import type { DatasetSample } from '@/features/dashboard/data'
import { useCurrentDataset } from './use-current-dataset'

export function TextPreview() {
  const { dataset, detail } = useCurrentDataset()
  const samples = detail.samples.filter(
    (sample): sample is Extract<DatasetSample, { modality: 'text' }> =>
      sample.modality === 'text',
  )
  const [label, setLabel] = React.useState('all')
  const [split, setSplit] = React.useState('all')
  const [query, setQuery] = React.useState('')
  const labels = Array.from(new Set(samples.map((sample) => sample.label)))
  const visible = samples.filter(
    (sample) =>
      (label === 'all' || sample.label === label) &&
      (split === 'all' || sample.split === split) &&
      sample.text.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <Card.Root variant="outline" overflow="hidden">
      <Flex
        wrap="wrap"
        align="center"
        justify="space-between"
        gap="2"
        px="4"
        py="3"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex wrap="wrap" align="center" gap="2" flex="1">
          <SimpleSelect
            label="Filter by label"
            hideLabel
            size="sm"
            width="36"
            value={label}
            onChange={setLabel}
            items={[
              { label: 'All labels', value: 'all' },
              ...labels.map((item) => ({ label: item, value: item })),
            ]}
          />
          <SimpleSelect
            label="Filter by split"
            hideLabel
            size="sm"
            width="32"
            value={split}
            onChange={setSplit}
            items={[
              { label: 'All splits', value: 'all' },
              { label: 'Train', value: 'Train' },
              { label: 'Validation', value: 'Validation' },
              { label: 'Test', value: 'Test' },
            ]}
          />
          <InputGroup
            flex="1"
            minW="48"
            maxW={{ sm: '60' }}
            startElement={<Search size={16} aria-hidden="true" />}
          >
            <Input
              size="sm"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search sample text"
              placeholder="Search text..."
            />
          </InputGroup>
        </Flex>
        <Text fontSize="xs" color="fg.muted" textAlign={{ sm: 'end' }}>
          Showing {visible.length} of {dataset.items.toLocaleString('en-US')}
        </Text>
      </Flex>
      {visible.length ? (
        <Table.ScrollArea>
          <Table.Root variant="data" minW="720px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Text</Table.ColumnHeader>
                <Table.ColumnHeader>Label</Table.ColumnHeader>
                <Table.ColumnHeader>Words</Table.ColumnHeader>
                <Table.ColumnHeader>Split</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visible.map((sample) => (
                <Table.Row key={sample.id}>
                  <Table.Cell
                    maxW="xl"
                    whiteSpace="normal"
                    color="fg"
                    fontWeight="medium"
                  >
                    {sample.text}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette="gray"
                      variant="subtle"
                      fontWeight="normal"
                    >
                      {sample.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{sample.words}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      colorPalette="gray"
                      variant="outline"
                      fontWeight="normal"
                    >
                      {sample.split === 'Validation' ? 'Val' : sample.split}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      ) : (
        <EmptyNotice
          minH="56"
          title="No matching samples"
          description="Try a different label, split, or search."
        />
      )}
    </Card.Root>
  )
}
