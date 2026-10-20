import * as React from 'react'
import {
  Box,
  Button,
  Field,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useNavigate } from '@tanstack/react-router'
import { Archive, ArrowRightLeft, Trash2 } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { AppDialog } from '@/components/shared/app-dialog'
import {
  DangerCard,
  DangerRow,
  dangerOutlineProps,
} from '@/components/shared/danger-card'
import { SECTION_OFFSET } from '@/components/shared/settings-nav'
import { SimpleSelect } from '@/components/simple-select'
import {
  useDashboardLayout,
  useProjectDetail,
} from '@/features/dashboard/context'
import type { Project } from '@/features/dashboard/data'
import {
  useArchiveProject,
  useDeleteProject,
  useTransferProject,
} from '@/features/projects/queries'

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function DangerZoneCard() {
  const { project } = useProjectDetail()
  const archive = useArchiveProject(project.id)
  const archived = project.status === 'Archived'
  const [archiveOpen, setArchiveOpen] = React.useState(false)

  return (
    <DangerCard
      id="danger-zone"
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title="Danger zone"
    >
      <Stack gap="0">
        <DangerRow
          icon={ArrowRightLeft}
          title="Transfer ownership"
          description="Move this project to another member or organization."
        >
          <TransferProjectDialog project={project} />
        </DangerRow>

        <DangerRow
          icon={Archive}
          title={archived ? 'Unarchive project' : 'Archive project'}
          description={
            archived
              ? 'Restore editing. Deployments stay paused until you resume them.'
              : 'Make the project read-only. Live deployments will be stopped.'
          }
        >
          <Button {...dangerOutlineProps} onClick={() => setArchiveOpen(true)}>
            {archived ? 'Unarchive' : 'Archive'}
          </Button>
          <AppDialog
            role="alertdialog"
            open={archiveOpen}
            onOpenChange={setArchiveOpen}
            title={`${archived ? 'Unarchive' : 'Archive'} ${project.name}?`}
            description={
              archived
                ? 'Members can edit datasets and start training again.'
                : `${plural(project.deployed, 'live deployment')} will stop serving traffic. You can unarchive at any time.`
            }
            footer={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setArchiveOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  colorPalette="danger"
                  size="sm"
                  onClick={() => {
                    setArchiveOpen(false)
                    archive.mutate(!archived, {
                      onSuccess: () =>
                        toaster.create({
                          type: 'success',
                          title: `${project.name} ${archived ? 'unarchived' : 'archived'}.`,
                        }),
                    })
                  }}
                >
                  {archived ? 'Unarchive project' : 'Archive project'}
                </Button>
              </>
            }
          />
        </DangerRow>

        <DangerRow
          icon={Trash2}
          title="Delete project"
          description="Permanently delete all datasets, training runs, models and deployments."
        >
          <DeleteProjectDialog project={project} />
        </DangerRow>
      </Stack>
    </DangerCard>
  )
}

function DeleteProjectDialog({ project }: { project: Project }) {
  const navigate = useNavigate()
  const remove = useDeleteProject(project.id)
  const [open, setOpen] = React.useState(false)
  const [confirmation, setConfirmation] = React.useState('')
  const confirmed = confirmation === project.name

  function close(next: boolean) {
    setOpen(next)
    if (!next) setConfirmation('')
  }

  return (
    <>
      <Button
        variant="solid"
        colorPalette="danger"
        size="sm"
        px="3.5"
        onClick={() => setOpen(true)}
      >
        <Trash2 />
        Delete project
      </Button>
      <AppDialog
        role="alertdialog"
        open={open}
        onOpenChange={close}
        title={`Delete ${project.name}?`}
        description="This permanently deletes the project and everything in it. This cannot be undone."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorPalette="danger"
              size="sm"
              disabled={!confirmed || remove.isPending}
              onClick={() =>
                // Leave the project's pages before it disappears from under
                // them. That unmounts this dialog, so the result is read from
                // the promise; a failure is reported by the global handler.
                void navigate({ to: '/projects' })
                  .then(() => remove.mutateAsync())
                  .then(() =>
                    toaster.create({
                      type: 'success',
                      title: `${project.name} was deleted.`,
                    }),
                  )
                  .catch(() => undefined)
              }
            >
              Delete this project
            </Button>
          </>
        }
      >
        <Stack gap="4">
          <SimpleGrid as="ul" columns={3} gap="2" textAlign="center">
            {(
              [
                [project.datasets, 'Datasets'],
                [project.models, 'Models'],
                [project.deployed, 'Deployments'],
              ] as const
            ).map(([count, label]) => (
              <Box
                as="li"
                key={label}
                rounded="l2"
                bg="bg.error"
                px="2"
                py="2.5"
              >
                <Text
                  fontSize="lg"
                  fontWeight="semibold"
                  color="fg.error"
                  fontVariantNumeric="tabular-nums"
                >
                  {count}
                </Text>
                <Text fontSize="xs" color="fg.error">
                  {label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>

          <Field.Root>
            <Field.Label fontWeight="normal">
              <span>
                Type{' '}
                <Text as="b" fontWeight="semibold">
                  {project.name}
                </Text>{' '}
                to confirm
              </span>
            </Field.Label>
            <Input
              value={confirmation}
              autoComplete="off"
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Field.Root>
        </Stack>
      </AppDialog>
    </>
  )
}

/** Moves the project to another organization the user belongs to. */
function TransferProjectDialog({ project }: { project: Project }) {
  const { organizations, updatePreferences } = useDashboardLayout()
  const transfer = useTransferProject(project.id)
  const [open, setOpen] = React.useState(false)
  const [orgId, setOrgId] = React.useState('')
  const targets = organizations.filter((item) => item.id !== project.orgId)
  const chosen = targets.find((item) => item.id === orgId)

  function close(next: boolean) {
    setOpen(next)
    if (!next) setOrgId('')
  }

  return (
    <>
      <Button {...dangerOutlineProps} onClick={() => setOpen(true)}>
        Transfer
      </Button>
      <AppDialog
        role="alertdialog"
        open={open}
        onOpenChange={close}
        title={`Transfer ${project.name}?`}
        description="The project, its datasets, models and deployments move to the organization you choose."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorPalette="danger"
              size="sm"
              disabled={!chosen || transfer.isPending}
              onClick={() => {
                if (!chosen) return
                close(false)
                transfer.mutate(chosen.id, {
                  onSuccess: () => {
                    // Follow the project, so its page stays the current one.
                    updatePreferences({ organizationId: chosen.id })
                    toaster.create({
                      type: 'success',
                      title: `${project.name} moved to ${chosen.name}.`,
                    })
                  },
                })
              }}
            >
              Transfer project
            </Button>
          </>
        }
      >
        <SimpleSelect
          label="New organization"
          width="full"
          portalled={false}
          value={orgId}
          onChange={setOrgId}
          placeholder={
            targets.length
              ? 'Choose an organization'
              : 'You belong to no other organization'
          }
          items={targets.map((item) => ({ label: item.name, value: item.id }))}
        />
      </AppDialog>
    </>
  )
}
