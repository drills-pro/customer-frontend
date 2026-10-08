import * as React from 'react'

import { OrgMark } from '@/features/organizations/components/org-ui'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  orgColors,
  orgPlans,
  planDetails,
  slugify,
  withInitial,
} from '@/features/dashboard/data'
import type { OrgPlan, Organization } from '@/features/dashboard/data'
import {
  ColorSwatches,
  cleanSlugInput,
  orgNameError,
  orgSlugError,
} from './org-form'

const planBlurbs: Record<OrgPlan, string> = {
  Free: 'For trying DRILLS on your own.',
  Team: 'Shared projects and GPU credits for a team.',
  Enterprise: 'SSO, audit logs and dedicated compute.',
}

export function CreateOrganizationDialog({
  open,
  onOpenChange,
  organizations,
  onCreate,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  onCreate: (org: Organization) => void
}) {
  const [name, setName] = React.useState('')
  const [slug, setSlug] = React.useState('')
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [plan, setPlan] = React.useState<OrgPlan>('Team')
  const [color, setColor] = React.useState(orgColors[2])
  const [submitted, setSubmitted] = React.useState(false)

  const effectiveSlug = slugEdited
    ? slug
    : name.trim()
      ? slugify(name).slice(0, 40)
      : ''
  const nameMessage = submitted ? orgNameError(name) : undefined
  const slugMessage =
    submitted || slugEdited
      ? orgSlugError(effectiveSlug, organizations)
      : undefined

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setName('')
      setSlug('')
      setSlugEdited(false)
      setPlan('Team')
      setColor(orgColors[2])
      setSubmitted(false)
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (orgNameError(name) || orgSlugError(effectiveSlug, organizations)) return
    onCreate(
      withInitial({
        id: `org-${Date.now().toString(36)}`,
        name: name.trim(),
        slug: effectiveSlug,
        plan,
        color,
        description: '',
        createdAt: Date.now(),
        yourRole: 'Owner',
      }),
    )
    close(false)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
            <DialogDescription>
              A shared space for projects, datasets, members and billing.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-5 py-2">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <OrgMark
                org={withInitial({ name: name || '?', color })}
                className="size-10 text-base"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {name.trim() || 'New organization'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  drills.ai/{effectiveSlug || 'your-org'}
                </p>
              </div>
            </div>

            <Field data-invalid={Boolean(nameMessage) || undefined}>
              <FieldLabel htmlFor="create-org-name">
                Organization name
              </FieldLabel>
              <Input
                id="create-org-name"
                value={name}
                placeholder="e.g. Contoso Vision"
                autoFocus
                aria-invalid={Boolean(nameMessage) || undefined}
                onChange={(event) => setName(event.target.value)}
              />
              <FieldError>{nameMessage}</FieldError>
            </Field>

            <Field data-invalid={Boolean(slugMessage) || undefined}>
              <FieldLabel htmlFor="create-org-slug">URL</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>drills.ai/</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="create-org-slug"
                  value={effectiveSlug}
                  placeholder="your-org"
                  aria-invalid={Boolean(slugMessage) || undefined}
                  onChange={(event) => {
                    setSlugEdited(true)
                    setSlug(cleanSlugInput(event.target.value))
                  }}
                />
              </InputGroup>
              <FieldError>{slugMessage}</FieldError>
            </Field>

            <Field>
              <span className="text-sm font-medium">Color</span>
              <ColorSwatches
                label="Organization color"
                value={color}
                onChange={setColor}
              />
            </Field>

            <fieldset className="grid gap-3">
              <legend className="mb-3 text-sm font-medium">Plan</legend>
              <RadioGroup
                value={plan}
                onValueChange={(value) => setPlan(value as OrgPlan)}
                className="grid gap-2"
              >
                {orgPlans.map((option) => (
                  <FieldLabel
                    key={option}
                    htmlFor={`create-org-plan-${option}`}
                  >
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>
                          {option}
                          <span className="font-normal text-muted-foreground">
                            · {planDetails[option].price}
                          </span>
                        </FieldTitle>
                        <FieldDescription>
                          {planBlurbs[option]} Up to {planDetails[option].seats}{' '}
                          seats.
                        </FieldDescription>
                      </FieldContent>
                      <RadioGroupItem
                        id={`create-org-plan-${option}`}
                        value={option}
                      />
                    </Field>
                  </FieldLabel>
                ))}
              </RadioGroup>
            </fieldset>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create organization</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
