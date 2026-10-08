import * as React from 'react'
import { Building2, Lock } from 'lucide-react'
import { toast } from 'sonner'

import { CopyButton } from '@/components/shared/copy-button'
import { ProjectMark } from '@/features/projects/components/project-ui'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { useProjectDetail } from '@/features/dashboard/context'
import type { ProjectOverview } from '@/features/dashboard/data'

const NAME_MAX = 64
const DESCRIPTION_MAX = 240

type Visibility = ProjectOverview['visibility']
type GeneralValues = {
  name: string
  description: string
  visibility: Visibility
}

const visibilityOptions: Array<{
  value: Visibility
  label: string
  description: string
  icon: typeof Lock
}> = [
  {
    value: 'Organization',
    label: 'Organization',
    description: 'Everyone in the organization can view this project.',
    icon: Building2,
  },
  {
    value: 'Private',
    label: 'Private',
    description: 'Only invited members can see or open this project.',
    icon: Lock,
  },
]

function nameError(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return 'Project name is required.'
  if (trimmed.length > NAME_MAX)
    return `Keep the name under ${NAME_MAX} characters.`
  return undefined
}

export function GeneralCard() {
  const { project, details } = useProjectDetail()
  const [saved, setSaved] = React.useState<GeneralValues>({
    name: project.name,
    description: project.description,
    visibility: details.visibility,
  })
  const [values, setValues] = React.useState(saved)

  const error = nameError(values.name)
  const dirty =
    values.name !== saved.name ||
    values.description !== saved.description ||
    values.visibility !== saved.visibility
  const taskLocked = details.pipeline.runs > 0

  function update<TKey extends keyof GeneralValues>(
    key: TKey,
    value: GeneralValues[TKey],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!dirty || error) return
    const next = { ...values, name: values.name.trim() }
    setValues(next)
    setSaved(next)
    toast.success('Project settings saved for this session (demo only).')
  }

  return (
    <Card id="general" size="flush" className="scroll-mt-22">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>General</CardTitle>
        <CardDescription>
          How this project is named and who can find it.
        </CardDescription>
      </CardHeader>

      <form onSubmit={save} noValidate>
        <CardContent className="grid gap-5 p-5">
          <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/50 p-3">
            <ProjectMark project={project} className="size-11" />
            <div className="mr-auto min-w-0">
              <p className="truncate font-medium">{values.name || '—'}</p>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Project ID
                <code className="rounded bg-card px-1.5 py-0.5 font-mono ring-1 ring-border">
                  {project.id}
                </code>
              </p>
            </div>
            <CopyButton value={project.id} label="Copy project ID">
              Copy ID
            </CopyButton>
          </div>

          <Field data-invalid={Boolean(error) || undefined}>
            <FieldLabel htmlFor="project-name">Project name</FieldLabel>
            <Input
              id="project-name"
              size="lg"
              value={values.name}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={error ? 'project-name-error' : undefined}
              onChange={(event) => update('name', event.target.value)}
            />
            <FieldError id="project-name-error">{error}</FieldError>
          </Field>

          <Field>
            <div className="flex items-baseline justify-between gap-2">
              <FieldLabel htmlFor="project-description">Description</FieldLabel>
              <span
                className={`text-xs tabular-nums ${values.description.length > DESCRIPTION_MAX * 0.9 ? 'text-warning' : 'text-muted-foreground'}`}
              >
                {values.description.length}/{DESCRIPTION_MAX}
              </span>
            </div>
            <Textarea
              id="project-description"
              rows={3}
              maxLength={DESCRIPTION_MAX}
              value={values.description}
              placeholder="What does this project predict, and for whom?"
              onChange={(event) => update('description', event.target.value)}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="project-task">Task type</FieldLabel>
              <Input
                id="project-task"
                size="lg"
                value={project.task}
                disabled
                readOnly
              />
              <FieldDescription>
                {taskLocked
                  ? 'Locked after the first training run.'
                  : 'Chosen when the project was created.'}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="project-region">Region</FieldLabel>
              <Input
                id="project-region"
                size="lg"
                value={details.region}
                disabled
                readOnly
              />
              <FieldDescription>
                Datasets and endpoints stay in this region.
              </FieldDescription>
            </Field>
          </div>

          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">Visibility</legend>
            <RadioGroup
              value={values.visibility}
              onValueChange={(value) =>
                update('visibility', value as Visibility)
              }
              className="grid gap-3 sm:grid-cols-2"
            >
              {visibilityOptions.map((option) => (
                <FieldLabel
                  key={option.value}
                  htmlFor={`visibility-${option.value}`}
                >
                  <Field orientation="horizontal">
                    <option.icon
                      aria-hidden="true"
                      className="size-4 text-muted-foreground"
                    />
                    <FieldContent>
                      <FieldTitle>{option.label}</FieldTitle>
                      <FieldDescription>{option.description}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      id={`visibility-${option.value}`}
                      value={option.value}
                    />
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
          </fieldset>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t pt-5 text-[13px] sm:grid-cols-3">
            {[
              ['Framework', details.framework],
              ['Created', details.created],
              ['Last updated', project.updated],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 truncate font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-4">
          {dirty && (
            <p
              role="status"
              className="mr-auto flex items-center gap-2 text-xs text-muted-foreground"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full bg-warning"
              />
              Unsaved changes
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="px-3.5"
            disabled={!dirty}
            onClick={() => setValues(saved)}
          >
            Reset
          </Button>
          <Button
            type="submit"
            size="lg"
            className="px-3.5"
            disabled={!dirty || Boolean(error)}
          >
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  )
}
