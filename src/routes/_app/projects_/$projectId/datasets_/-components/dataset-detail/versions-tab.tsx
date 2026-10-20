import { Badge, IconButton, Table } from '@chakra-ui/react'
import { Download } from 'lucide-react'

import { SectionCard } from '@/components/shared/section-card'
import { ToneBadge } from '@/components/shared/tone-badge'
import { downloadJson } from './helpers'
import { useCurrentDataset } from './use-current-dataset'

export function VersionsTab() {
  const { dataset, detail } = useCurrentDataset()
  return (
    <SectionCard title="Dataset versions">
      <Table.ScrollArea>
        <Table.Root variant="data" minW="560px">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader px="5">Version</Table.ColumnHeader>
              <Table.ColumnHeader>Items</Table.ColumnHeader>
              <Table.ColumnHeader>Status</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Download</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {detail.versions.map((version) => (
              <Table.Row key={version.version}>
                <Table.Cell px="5">
                  <Badge colorPalette="gray" variant="subtle">
                    v{version.version}
                    {version.version === dataset.version ? ' · current' : ''}
                  </Badge>
                </Table.Cell>
                <Table.Cell color="fg">
                  {version.items.toLocaleString('en-US')}
                </Table.Cell>
                <Table.Cell>
                  <ToneBadge tone="success">Ready</ToneBadge>
                </Table.Cell>
                <Table.Cell>{version.created}</Table.Cell>
                <Table.Cell textAlign="end">
                  <IconButton
                    variant="ghost"
                    colorPalette="gray"
                    size="xs"
                    aria-label={`Download version ${version.version}`}
                    onClick={() =>
                      downloadJson(`${dataset.name}-v${version.version}.json`, {
                        ...dataset,
                        version: version.version,
                      })
                    }
                  >
                    <Download />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </SectionCard>
  )
}
