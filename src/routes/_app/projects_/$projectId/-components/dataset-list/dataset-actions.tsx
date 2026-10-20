import { IconButton, Menu, Portal } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'

import type { Dataset } from '@/features/dashboard/data'
import { unavailable } from '@/lib/unavailable'

export function DatasetActions({ dataset }: { dataset: Dataset }) {
  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <IconButton
          variant="ghost"
          colorPalette="gray"
          size="xs"
          aria-label={`Actions for ${dataset.name}`}
        >
          <EllipsisVertical />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="details" asChild>
              <Link
                to="/projects/$projectId/datasets/$datasetId"
                params={{ projectId: dataset.projectId, datasetId: dataset.id }}
              >
                View details
              </Link>
            </Menu.Item>
            <Menu.Item
              value="download"
              onSelect={() => unavailable('Dataset download')}
            >
              Download metadata
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
