import * as React from 'react'
import { Archive, ArrowRightLeft, Trash2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useProjectDetail } from '@/features/dashboard/context'
import type { Project } from '@/features/dashboard/data'

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export function DangerZoneCard() {
  const { project } = useProjectDetail()
  const archived = project.status === 'Archived'

  return (
    <Card
      id="danger-zone"
      size="flush"
      className="scroll-mt-22 ring-destructive/30"
    >
      <CardHeader className="border-b border-destructive/20 bg-destructive-muted/50 [--card-section:--spacing(3.5)]">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="size-4" />
          Danger zone
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        <DangerRow
          icon={ArrowRightLeft}
          title="Transfer ownership"
          description="Move this project to another member or organization."
        >
          <Button
            variant="outline"
            size="lg"
            className="px-3.5 text-destructive hover:bg-destructive-muted hover:text-destructive"
            onClick={() =>
              toast.info('Transferring projects is not available in this demo.')
            }
          >
            Transfer
          </Button>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="px-3.5 text-destructive hover:bg-destructive-muted hover:text-destructive"
              >
                {archived ? 'Unarchive' : 'Archive'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {archived ? 'Unarchive' : 'Archive'} {project.name}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {archived
                    ? 'Members can edit datasets and start training again.'
                    : `${plural(project.deployed, 'live deployment')} will stop serving traffic. You can unarchive at any time.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    toast.info(
                      `${archived ? 'Unarchiving' : 'Archiving'} is not available in this demo.`,
                    )
                  }
                >
                  {archived ? 'Unarchive project' : 'Archive project'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DangerRow>

        <DangerRow
          icon={Trash2}
          title="Delete project"
          description="Permanently delete all datasets, training runs, models and deployments."
        >
          <DeleteProjectDialog project={project} />
        </DangerRow>
      </CardContent>
    </Card>
  )
}

function DangerRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Trash2
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-5">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive-muted text-destructive"
      >
        <Icon className="size-4" />
      </span>
      <div className="mr-auto min-w-0 basis-60 grow">
        <p className="text-[13px] font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  )
}

function DeleteProjectDialog({ project }: { project: Project }) {
  const [open, setOpen] = React.useState(false)
  const [confirmation, setConfirmation] = React.useState('')
  const confirmed = confirmation === project.name

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setConfirmation('')
      }}
    >
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="lg" className="px-3.5">
          <Trash2 />
          Delete project
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {project.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the project and everything in it. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="grid grid-cols-3 gap-2 text-center">
          {(
            [
              [project.datasets, 'Datasets'],
              [project.models, 'Models'],
              [project.deployed, 'Deployments'],
            ] as const
          ).map(([count, label]) => (
            <li
              key={label}
              className="rounded-lg bg-destructive-muted px-2 py-2.5"
            >
              <p className="text-lg font-semibold text-destructive tabular-nums">
                {count}
              </p>
              <p className="text-xs text-destructive/80">{label}</p>
            </li>
          ))}
        </ul>

        <Field>
          <FieldLabel htmlFor="delete-project-confirm" className="font-normal">
            <span>
              Type <b className="font-semibold">{project.name}</b> to confirm
            </span>
          </FieldLabel>
          <Input
            id="delete-project-confirm"
            value={confirmation}
            autoComplete="off"
            onChange={(event) => setConfirmation(event.target.value)}
          />
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!confirmed}
            onClick={() =>
              toast.info('Deleting a project is not available in this demo.')
            }
          >
            Delete this project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
