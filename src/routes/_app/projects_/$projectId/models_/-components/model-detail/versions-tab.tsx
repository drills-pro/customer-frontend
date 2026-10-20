import { Button, Link, Table, Text, VisuallyHidden } from '@chakra-ui/react'
import { Link as RouterLink } from '@tanstack/react-router'
import { toaster } from '@/components/toaster'

import { SectionCard } from '@/components/shared/section-card'
import {
  formatAccuracy,
  formatF1,
  StageBadge,
} from '../../../-components/model-list'
import { useSetModelStage } from '@/features/models/queries'
import { useCurrentModel } from './use-current-model'

export function VersionsTab() {
  const { project, model, versions } = useCurrentModel()
  const setStage = useSetModelStage(project.id)
  return (
    <SectionCard
      title="Versions"
      action={
        <Text fontSize="xs" color="fg.muted">
          Promoting a version repoints every deployment tracking “latest”.
        </Text>
      }
    >
      <Table.ScrollArea>
        <Table.Root variant="data" minW="820px">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader px="5">Version</Table.ColumnHeader>
              <Table.ColumnHeader>Source run</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Accuracy</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Macro F1</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Size</Table.ColumnHeader>
              <Table.ColumnHeader>Stage</Table.ColumnHeader>
              <Table.ColumnHeader>Created</Table.ColumnHeader>
              <Table.ColumnHeader>
                <VisuallyHidden>Actions</VisuallyHidden>
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {[...versions].reverse().map((item) => (
              <Table.Row key={item.id}>
                <Table.Cell px="5">
                  {item.id === model.id ? (
                    <Text
                      as="span"
                      fontFamily="mono"
                      fontWeight="semibold"
                      color="fg"
                    >
                      v{item.version}
                      <Text
                        as="span"
                        ms="2"
                        fontSize="11px"
                        fontWeight="medium"
                        color="brand-text"
                      >
                        viewing
                      </Text>
                    </Text>
                  ) : (
                    <Link
                      asChild
                      fontFamily="mono"
                      fontWeight="medium"
                      color="brand-text"
                    >
                      <RouterLink
                        to="/projects/$projectId/models/$modelId"
                        params={{ projectId: item.projectId, modelId: item.id }}
                      >
                        v{item.version}
                      </RouterLink>
                    </Link>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Link asChild fontWeight="medium" color="fg">
                    <RouterLink
                      to="/projects/$projectId/training/$runId"
                      params={{ projectId: item.projectId, runId: item.runId }}
                    >
                      {item.runId}
                    </RouterLink>
                  </Link>
                </Table.Cell>
                <Table.Cell
                  textAlign="end"
                  fontWeight="semibold"
                  fontVariantNumeric="tabular-nums"
                  color="fg"
                >
                  {formatAccuracy(item.accuracy)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                  {formatF1(item.f1)}
                </Table.Cell>
                <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                  {item.size}
                </Table.Cell>
                <Table.Cell>
                  <StageBadge stage={item.stage} />
                </Table.Cell>
                <Table.Cell>{item.created}</Table.Cell>
                <Table.Cell textAlign="end">
                  <Button
                    variant="ghost"
                    colorPalette="gray"
                    size="xs"
                    disabled={setStage.isPending}
                    onClick={() => {
                      const archiving = item.stage === 'Production'
                      setStage.mutate(
                        {
                          modelId: item.id,
                          stage: archiving ? 'archived' : 'production',
                        },
                        {
                          onSuccess: () =>
                            toaster.create({
                              type: 'success',
                              title: `v${item.version} ${archiving ? 'archived' : 'promoted to production'}.`,
                            }),
                        },
                      )
                    }}
                  >
                    {item.stage === 'Production' ? 'Archive' : 'Promote'}
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
