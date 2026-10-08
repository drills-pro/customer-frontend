import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowRightLeft,
  Building2,
  Lock,
  LogOut,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'

import { CopyButton } from '@/components/shared/copy-button'
import { SettingsNav } from '@/components/shared/settings-nav'
import { OrgMark } from '@/features/organizations/components/org-ui'
import { plural } from '@/features/organizations/utils'
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  isSeedOrganization,
  organizations as seedOrganizations,
  withInitial,
} from '@/features/dashboard/data'
import type {
  Organization,
  OrganizationProfile,
} from '@/features/dashboard/data'
import { useOrgDetail } from '../-components/org-context'
import {
  ColorSwatches,
  ORG_DESCRIPTION_MAX,
  cleanSlugInput,
  orgNameError,
  orgSlugError,
} from '../-components/org-form'

export const Route = createFileRoute('/_app/organizations_/$orgId/settings')({
  component: OrgSettings,
})

const sections = [
  { id: 'general', label: 'General' },
  { id: 'defaults', label: 'Defaults & security' },
  { id: 'danger-zone', label: 'Danger zone' },
] as const

function OrgSettings() {
  const { org, canManage } = useOrgDetail()

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
      <SettingsNav sections={sections} />
      <div className="grid max-w-4xl min-w-0 gap-6">
        {/* Keyed so a different org, or a saved rename, resets the form. */}
        <GeneralCard key={`${org.id}-${org.name}-${org.slug}`} org={org} />
        <DefaultsCard key={`${org.id}-defaults`} canManage={canManage} />
        <DangerZoneCard org={org} />
      </div>
    </div>
  )
}

function profileOf(org: Organization): OrganizationProfile {
  return {
    name: org.name,
    slug: org.slug,
    description: org.description,
    color: org.color,
  }
}

function GeneralCard({ org }: { org: Organization }) {
  const { preferences, updatePreferences, organizations } = useDashboardLayout()
  const { canManage } = useOrgDetail()
  const [values, setValues] = React.useState(() => profileOf(org))
  const saved = profileOf(org)

  const nameMessage = orgNameError(values.name)
  const slugMessage = orgSlugError(values.slug, organizations, org.id)
  const dirty = (Object.keys(saved) as Array<keyof OrganizationProfile>).some(
    (key) => values[key] !== saved[key],
  )

  function update<TKey extends keyof OrganizationProfile>(
    key: TKey,
    value: OrganizationProfile[TKey],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (!dirty || nameMessage || slugMessage) return
    const next = { ...values, name: values.name.trim() }
    if (isSeedOrganization(org.id)) {
      updatePreferences({
        organizationEdits: { ...preferences.organizationEdits, [org.id]: next },
      })
    } else {
      updatePreferences({
        createdOrganizations: preferences.createdOrganizations.map((item) =>
          item.id === org.id ? withInitial({ ...item, ...next }) : item,
        ),
      })
    }
    toast.success('Organization settings saved.')
  }

  return (
    <Card id="general" size="flush" className="scroll-mt-22">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>General</CardTitle>
        <CardDescription>
          How your organization appears across DRILLS.
        </CardDescription>
      </CardHeader>

      <form onSubmit={save} noValidate>
        <fieldset disabled={!canManage} className="contents">
          <CardContent className="grid gap-5 p-5">
            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-muted/50 p-3">
              <OrgMark
                org={withInitial({
                  name: values.name || '?',
                  color: values.color,
                })}
                className="size-11 rounded-xl text-base"
              />
              <div className="mr-auto min-w-0">
                <p className="truncate font-medium">{values.name || '—'}</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Organization ID
                  <code className="rounded bg-card px-1.5 py-0.5 font-mono ring-1 ring-border">
                    {org.id}
                  </code>
                </p>
              </div>
              <CopyButton value={org.id} label="Copy organization ID">
                Copy ID
              </CopyButton>
            </div>

            {!canManage && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3.5" />
                You're a {org.yourRole.toLowerCase()} here. Ask an owner or
                admin to change these settings.
              </p>
            )}

            <div className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={Boolean(nameMessage) || undefined}>
                <FieldLabel htmlFor="org-name">Organization name</FieldLabel>
                <Input
                  id="org-name"
                  size="lg"
                  value={values.name}
                  aria-invalid={Boolean(nameMessage) || undefined}
                  onChange={(event) => update('name', event.target.value)}
                />
                <FieldError>{nameMessage}</FieldError>
              </Field>
              <Field data-invalid={Boolean(slugMessage) || undefined}>
                <FieldLabel htmlFor="org-slug">URL</FieldLabel>
                <InputGroup className="h-9">
                  <InputGroupAddon>
                    <InputGroupText>drills.ai/</InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="org-slug"
                    value={values.slug}
                    aria-invalid={Boolean(slugMessage) || undefined}
                    onChange={(event) =>
                      update('slug', cleanSlugInput(event.target.value))
                    }
                  />
                </InputGroup>
                <FieldError>{slugMessage}</FieldError>
              </Field>
            </div>

            <Field>
              <div className="flex items-baseline justify-between gap-2">
                <FieldLabel htmlFor="org-description">Description</FieldLabel>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {values.description.length}/{ORG_DESCRIPTION_MAX}
                </span>
              </div>
              <Textarea
                id="org-description"
                rows={3}
                maxLength={ORG_DESCRIPTION_MAX}
                value={values.description}
                placeholder="What does this organization work on?"
                onChange={(event) => update('description', event.target.value)}
              />
            </Field>

            <Field>
              <span className="text-sm font-medium">Brand color</span>
              <ColorSwatches
                label="Brand color"
                value={values.color}
                onChange={(color) => canManage && update('color', color)}
              />
              <FieldDescription>
                Used for the organization mark in the switcher and sidebar.
              </FieldDescription>
            </Field>
          </CardContent>

          {canManage && (
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
                Discard
              </Button>
              <Button
                type="submit"
                size="lg"
                className="px-3.5"
                disabled={!dirty || Boolean(nameMessage || slugMessage)}
              >
                Save changes
              </Button>
            </div>
          )}
        </fieldset>
      </form>
    </Card>
  )
}

function DefaultsCard({ canManage }: { canManage: boolean }) {
  const [visibility, setVisibility] = React.useState('Organization')
  const [require2fa, setRequire2fa] = React.useState(false)
  const [domainJoin, setDomainJoin] = React.useState(true)

  function notify(message: string) {
    toast.success(`${message} (saved for this session).`)
  }

  return (
    <Card id="defaults" size="flush" className="scroll-mt-22">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>Defaults & security</CardTitle>
        <CardDescription>
          Applied to new projects and everyone who joins.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 p-5">
        <fieldset disabled={!canManage} className="grid gap-3">
          <legend className="mb-3 text-sm font-medium">
            Default project visibility
          </legend>
          <RadioGroup
            value={visibility}
            onValueChange={(value) => {
              setVisibility(value)
              notify(`New projects default to ${value.toLowerCase()}`)
            }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {[
              {
                value: 'Organization',
                icon: Building2,
                description: 'Every member can view new projects.',
              },
              {
                value: 'Private',
                icon: Lock,
                description: 'Only invited members see new projects.',
              },
            ].map((option) => (
              <FieldLabel
                key={option.value}
                htmlFor={`org-visibility-${option.value}`}
              >
                <Field orientation="horizontal">
                  <option.icon
                    aria-hidden="true"
                    className="size-4 text-muted-foreground"
                  />
                  <FieldContent>
                    <FieldTitle>{option.value}</FieldTitle>
                    <FieldDescription>{option.description}</FieldDescription>
                  </FieldContent>
                  <RadioGroupItem
                    id={`org-visibility-${option.value}`}
                    value={option.value}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </fieldset>

        <div className="divide-y rounded-lg border">
          <Field orientation="horizontal" className="p-4">
            <FieldContent>
              <FieldLabel htmlFor="org-require-2fa">
                Require two-factor authentication
              </FieldLabel>
              <FieldDescription>
                Members without 2FA are asked to set it up on their next
                sign-in.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="org-require-2fa"
              checked={require2fa}
              disabled={!canManage}
              onCheckedChange={(checked) => {
                setRequire2fa(checked)
                notify(checked ? '2FA is now required' : '2FA is optional')
              }}
            />
          </Field>
          <Field orientation="horizontal" className="p-4">
            <FieldContent>
              <FieldLabel htmlFor="org-domain-join">
                Allow joining by email domain
              </FieldLabel>
              <FieldDescription>
                Anyone with a verified company email can request to join.
              </FieldDescription>
            </FieldContent>
            <Switch
              id="org-domain-join"
              checked={domainJoin}
              disabled={!canManage}
              onCheckedChange={(checked) => {
                setDomainJoin(checked)
                notify(
                  checked
                    ? 'Domain joining enabled'
                    : 'Domain joining disabled',
                )
              }}
            />
          </Field>
        </div>
      </CardContent>
    </Card>
  )
}

function DangerZoneCard({ org }: { org: Organization }) {
  const { preferences, updatePreferences } = useDashboardLayout()
  const { summary } = useOrgDetail()
  const navigate = useNavigate()
  const isOwner = org.yourRole === 'Owner'
  const seeded = isSeedOrganization(org.id)

  /** Drops a created or joined org and anything created inside it. */
  function removeOrganization(message: string) {
    const fallback =
      preferences.organizationId === org.id
        ? seedOrganizations[0].id
        : preferences.organizationId
    void navigate({ to: '/organizations' }).then(() => {
      updatePreferences({
        organizationId: fallback,
        createdOrganizations: preferences.createdOrganizations.filter(
          (item) => item.id !== org.id,
        ),
        createdProjects: preferences.createdProjects.filter(
          (item) => item.project.orgId !== org.id,
        ),
      })
      toast.success(message)
    })
  }

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
          icon={LogOut}
          title="Leave organization"
          description={
            isOwner
              ? 'Owners must transfer ownership before they can leave.'
              : `You lose access to ${plural(summary.projects, 'project')} in ${org.name}.`
          }
        >
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className="px-3.5 text-destructive hover:bg-destructive-muted hover:text-destructive"
                disabled={isOwner}
              >
                Leave
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave {org.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll need a new invitation to rejoin.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() =>
                    seeded
                      ? toast.info(
                          'Leaving this demo organization is not available.',
                        )
                      : removeOrganization(`You left ${org.name}.`)
                  }
                >
                  Leave organization
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DangerRow>

        <DangerRow
          icon={ArrowRightLeft}
          title="Transfer ownership"
          description="Hand full control and billing to another admin."
        >
          <Button
            variant="outline"
            size="lg"
            className="px-3.5 text-destructive hover:bg-destructive-muted hover:text-destructive"
            disabled={!isOwner}
            onClick={() =>
              toast.info(
                'Transferring ownership is not available in this demo.',
              )
            }
          >
            Transfer
          </Button>
        </DangerRow>

        <DangerRow
          icon={Trash2}
          title="Delete organization"
          description={
            isOwner
              ? 'Permanently delete every project, dataset, model and deployment.'
              : 'Only the owner can delete this organization.'
          }
        >
          <DeleteOrganizationDialog
            org={org}
            disabled={!isOwner}
            onDelete={() =>
              seeded
                ? toast.info(
                    'Deleting this demo organization is not available.',
                  )
                : removeOrganization(`${org.name} was deleted.`)
            }
          />
        </DangerRow>
      </CardContent>
    </Card>
  )
}

function DeleteOrganizationDialog({
  org,
  disabled,
  onDelete,
}: {
  org: Organization
  disabled: boolean
  onDelete: () => void
}) {
  const [confirmation, setConfirmation] = React.useState('')
  const confirmed = confirmation.trim() === org.name

  return (
    <AlertDialog onOpenChange={(open) => !open && setConfirmation('')}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="lg"
          className="px-3.5"
          disabled={disabled}
        >
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {org.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the organization, its members' access and everything
            inside it. It cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="delete-org-confirm">
            Type <strong className="font-semibold">{org.name}</strong> to
            confirm
          </FieldLabel>
          <Input
            id="delete-org-confirm"
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
            onClick={onDelete}
          >
            Delete organization
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
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
