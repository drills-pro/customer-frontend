import { Input } from '@/components/ui/input'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDashboardLayout } from '@/features/dashboard/context'
import { projectRegions } from '@/features/dashboard/data'
import type { NewProjectDraft } from './use-new-project-draft'

export function BasicsStep({ draft }: { draft: NewProjectDraft }) {
  const orgName = useDashboardLayout().org.name
  return (
    <section className="grid gap-5">
      <div>
        <h2 className="text-lg font-semibold">Basics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Name your project and choose where it lives.
        </p>
      </div>
      <Field className="gap-0">
        <FieldLabel
          htmlFor="new-project-name"
          className="min-h-[1.5em] leading-normal font-normal"
        >
          <span className="text-sm font-medium">Project name</span>
        </FieldLabel>
        <Input
          id="new-project-name"
          className="mt-1.5"
          value={draft.name}
          onChange={(event) => draft.setName(event.target.value)}
          placeholder="e.g. Retail Vision"
          aria-invalid={Boolean(draft.nameError)}
          aria-describedby={
            draft.nameError ? 'new-project-name-error' : undefined
          }
          autoFocus
        />
        {draft.nameError && (
          <FieldError id="new-project-name-error" className="mt-1.5 text-xs">
            {draft.nameError}
          </FieldError>
        )}
      </Field>
      <Field className="gap-0">
        <FieldLabel
          htmlFor="new-project-description"
          className="min-h-[1.5em] leading-normal font-normal"
        >
          <span className="text-sm font-medium">
            Description{' '}
            <span className="font-normal text-muted-foreground/80">
              (optional)
            </span>
          </span>
        </FieldLabel>
        <Textarea
          id="new-project-description"
          className="mt-1.5"
          value={draft.description}
          onChange={(event) => draft.setDescription(event.target.value)}
          placeholder="What is this project for?"
          rows={3}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="gap-0">
          <FieldLabel
            htmlFor="new-project-organization"
            className="min-h-[1.5em] leading-normal font-normal"
          >
            <span className="text-sm font-medium">Organization</span>
          </FieldLabel>
          <Input
            id="new-project-organization"
            className="mt-1.5"
            value={orgName}
            disabled
            readOnly
          />
        </Field>
        <Field className="gap-0">
          <FieldLabel
            htmlFor="new-project-region"
            className="min-h-[1.5em] leading-normal font-normal"
          >
            <span className="text-sm font-medium">Region</span>
          </FieldLabel>
          <Select value={draft.region} onValueChange={draft.setRegion}>
            <SelectTrigger
              id="new-project-region"
              className="mt-1.5 w-full"
              aria-label="Region"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projectRegions.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field className="gap-0">
        <FieldLabel
          htmlFor="new-project-visibility"
          className="min-h-[1.5em] leading-normal font-normal"
        >
          <span className="text-sm font-medium">Visibility</span>
        </FieldLabel>
        <Select
          value={draft.visibility}
          onValueChange={(value) =>
            draft.setVisibility(value as 'Organization' | 'Private')
          }
        >
          <SelectTrigger
            id="new-project-visibility"
            className="mt-1.5 w-full"
            aria-label="Visibility"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Organization">
              Organization — visible to everyone in {orgName}
            </SelectItem>
            <SelectItem value="Private">
              Private — visible only to invited collaborators
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </section>
  )
}
