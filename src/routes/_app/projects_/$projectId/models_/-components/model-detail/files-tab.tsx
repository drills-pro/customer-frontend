import { Button, Code, Flex, Table, VisuallyHidden } from '@chakra-ui/react'
import { Download, FileText } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { SectionCard } from '@/components/shared/section-card'
import { useCurrentModel } from './use-current-model'

export function FilesTab() {
  const { model, detail } = useCurrentModel()
  return (
    <SectionCard
      title="Artifacts"
      action={<Code size="sm">drills://models/{model.id}</Code>}
    >
      <Table.ScrollArea>
        <Table.Root variant="data" minW="560px">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader px="5">Name</Table.ColumnHeader>
              <Table.ColumnHeader>Type</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Size</Table.ColumnHeader>
              <Table.ColumnHeader>Modified</Table.ColumnHeader>
              <Table.ColumnHeader>
                <VisuallyHidden>Actions</VisuallyHidden>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {detail.files.map((file) => (
              <Table.Row key={file.name}>
                <Table.Cell px="5">
                  <Flex
                    as="span"
                    align="center"
                    gap="2"
                    fontFamily="mono"
                    fontSize="13px"
                    color="fg"
                  >
                    <FileText size={16} aria-hidden="true" />
                    {file.name}
                  </Flex>
                </Table.Cell>
                <Table.Cell>{file.type}</Table.Cell>
                <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                  {file.size}
                </Table.Cell>
                <Table.Cell>{model.created}</Table.Cell>
                <Table.Cell textAlign="end">
                  <Button
                    variant="ghost"
                    colorPalette="gray"
                    size="xs"
                    onClick={() =>
                      toaster.create({
                        type: 'info',
                        title: `Downloading ${file.name} is not available in this demo.`,
                      })
                    }
                  >
                    <Download />
                    Download
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </SectionCard>
  )
}
