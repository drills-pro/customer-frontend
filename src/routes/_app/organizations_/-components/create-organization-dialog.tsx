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
import { ApiError } from '@/api/client'
import { usePlans } from '@/features/catalog/queries'
import { orgPlans } from '@/features/dashboard/domain/types'
import type { OrgPlan, Organization } from '@/features/dashboard/domain/types'
import { orgColors } from '@/features/organizations/constants'
import { initialOf, toApiPlan } from '@/features/organizations/mappers'
import { useCreateOrganization } from '@/features/organizations/queries'
import { slugify } from '@/features/organizations/utils'
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
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizations: Organization[]
  onCreated: (org: Organization) => void
}) {
  const plans = usePlans().data
  const create = useCreateOrganization()
  // A slug taken by an organization the user is not in is only known to the API.
  const [takenSlug, setTakenSlug] = React.useState<string>()
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
    effectiveSlug === takenSlug
      ? 'That URL is already taken.'
      : submitted || slugEdited
        ? orgSlugError(effectiveSlug, organizations)
        : undefined

  const limitsOf = (option: OrgPlan) =>
    plans?.find((item) => item.id === toApiPlan(option))

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setName('')
      setSlug('')
      setSlugEdited(false)
      setPlan('Team')
      setColor(orgColors[2])
      setSubmitted(false)
      setTakenSlug(undefined)
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (
      create.isPending ||
      orgNameError(name) ||
      orgSlugError(effectiveSlug, organizations)
    )
      return
    create.mutate(
      { name: name.trim(), slug: effectiveSlug, plan: toApiPlan(plan), color },
      {
        onSuccess: (created) => {
          close(false)
          onCreated(created)
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setTakenSlug(effectiveSlug)
          }
        },
      },
    )
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
                org={{ initial: initialOf(name), color }}
                boxSize="10"
                fontSize="md"
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
                            · {limitsOf(option)?.price}
                          </span>
                        </FieldTitle>
                        <FieldDescription>
                          {planBlurbs[option]} Up to {limitsOf(option)?.seats}{' '}
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
            <Button type="submit" disabled={create.isPending}>
              Create organization
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
