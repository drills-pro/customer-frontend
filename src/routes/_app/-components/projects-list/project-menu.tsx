import { IconButton, Menu, Portal } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import { EllipsisVertical } from 'lucide-react'
import { toaster } from '@/components/toaster'

import type { Project } from '@/features/dashboard/data'
import { useArchiveProject } from '@/features/projects/queries'

export function ProjectMenu({ project }: { project: Project }) {
  const archive = useArchiveProject(project.id)
  const archived = project.status === 'Archived'

  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <IconButton
          variant="ghost"
          colorPalette="gray"
          size="xs"
          flexShrink={0}
          color="fg.muted"
          aria-label={`Actions for ${project.name}`}
        >
          <EllipsisVertical />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.Item value="open" asChild>
              <Link
                to="/projects/$projectId/overview"
                params={{ projectId: project.id }}
              >
                Open project
              </Link>
            </Menu.Item>
            <Menu.Item value="settings" asChild>
              <Link
                to="/projects/$projectId/settings"
                params={{ projectId: project.id }}
              >
                Project settings
              </Link>
            </Menu.Item>
            <Menu.Item
              value="archive"
              disabled={archive.isPending}
              onSelect={() =>
                archive.mutate(!archived, {
                  onSuccess: () =>
                    toaster.create({
                      type: 'success',
                      title: `${project.name} ${archived ? 'unarchived' : 'archived'}.`,
                    }),
                })
              }
            >
              {archived ? 'Unarchive project' : 'Archive project'}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  )
}
