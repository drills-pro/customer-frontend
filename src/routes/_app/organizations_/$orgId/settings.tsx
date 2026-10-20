import * as React from 'react'
import {
  Box,
  Button,
  Code,
  Field,
  Fieldset,
  Flex,
  HStack,
  Input,
  InputGroup,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowRightLeft, Building2, Lock, LogOut, Trash2 } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { AppDialog } from '@/components/shared/app-dialog'
import { CopyButton } from '@/components/shared/copy-button'
import {
  DangerCard,
  DangerRow,
  dangerOutlineProps,
} from '@/components/shared/danger-card'
import { FormFooter } from '@/components/shared/form-footer'
import {
  RadioButton,
  RadioButtonGroup,
} from '@/components/shared/radio-button-group'
import { SectionCard } from '@/components/shared/section-card'
import { SECTION_OFFSET, SettingsNav } from '@/components/shared/settings-nav'
import { SwitchButton } from '@/components/shared/switch-button'
import { SimpleSelect } from '@/components/simple-select'
import { OrgMark } from '@/features/organizations/components/org-ui'
import { plural } from '@/features/organizations/utils'
import { ApiError } from '@/api/client'
import { useDashboardLayout } from '@/features/dashboard/context'
import type {
  Organization,
  OrganizationProfile,
} from '@/features/dashboard/domain/types'
import { initialOf, toApiVisibility } from '@/features/organizations/mappers'
import {
  useDeleteOrganization,
  useLeaveOrganization,
  useTransferOwnership,
  useUpdateOrganization,
} from '@/features/organizations/queries'
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
    <Box
      display="grid"
      minW="0"
      gap="6"
      gridTemplateColumns={{ lg: '200px minmax(0, 1fr)' }}
    >
      <SettingsNav sections={sections} />
      <Box display="grid" maxW="4xl" minW="0" gap="6">
        {/* Keyed so a different org, or a saved rename, resets the form. */}
        <GeneralCard key={`${org.id}-${org.name}-${org.slug}`} org={org} />
        <DefaultsCard
          key={`${org.id}-defaults`}
          org={org}
          canManage={canManage}
        />
        <DangerZoneCard org={org} />
      </Box>
    </Box>
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
  const { organizations } = useDashboardLayout()
  const { canManage } = useOrgDetail()
  const saveOrg = useUpdateOrganization(org.id)
  const [values, setValues] = React.useState(() => profileOf(org))
  // A slug taken by an organization the user is not in is only known to the API.
  const [takenSlug, setTakenSlug] = React.useState<string>()
  const saved = profileOf(org)

  const nameMessage = orgNameError(values.name)
  const slugMessage =
    values.slug === takenSlug
      ? 'That URL is already taken.'
      : orgSlugError(values.slug, organizations, org.id)
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
    if (!dirty || nameMessage || slugMessage || saveOrg.isPending) return
    saveOrg.mutate(
      { ...values, name: values.name.trim() },
      {
        onSuccess: () =>
          toaster.create({
            type: 'success',
            title: 'Organization settings saved.',
          }),
        onError: (error) => {
          if (error instanceof ApiError && error.status === 409) {
            setTakenSlug(values.slug)
          }
        },
      },
    )
  }

  return (
    <SectionCard
      id="general"
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title="General"
      description="How your organization appears across DRILLS."
    >
      <form onSubmit={save} noValidate>
        <Fieldset.Root disabled={!canManage} display="contents">
          <Stack gap="5" p="5">
            <Flex
              wrap="wrap"
              align="center"
              gap="4"
              rounded="l2"
              bg="bg.muted"
              p="3"
            >
              <OrgMark
                org={{
                  initial: initialOf(values.name),
                  color: values.color,
                }}
                boxSize="11"
                rounded="l3"
                fontSize="md"
              />
              <Box me="auto" minW="0">
                <Text truncate fontWeight="medium">
                  {values.name || '—'}
                </Text>
                <HStack gap="1.5" fontSize="xs" color="fg.muted">
                  Organization ID
                  <Code size="sm">{org.id}</Code>
                </HStack>
              </Box>
              <CopyButton value={org.id} label="Copy organization ID">
                Copy ID
              </CopyButton>
            </Flex>

            {!canManage && (
              <HStack gap="2" fontSize="xs" color="fg.muted">
                <Lock size={14} />
                You're a {org.yourRole.toLowerCase()} here. Ask an owner or
                admin to change these settings.
              </HStack>
            )}

            <SimpleGrid columns={{ base: 1, sm: 2 }} gap="5">
              <Field.Root invalid={Boolean(nameMessage)}>
                <Field.Label>Organization name</Field.Label>
                <Input
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                />
                <Field.ErrorText>{nameMessage}</Field.ErrorText>
              </Field.Root>
              <Field.Root invalid={Boolean(slugMessage)}>
                <Field.Label>URL</Field.Label>
                <InputGroup startAddon="drills.ai/">
                  <Input
                    value={values.slug}
                    onChange={(event) =>
                      update('slug', cleanSlugInput(event.target.value))
                    }
                  />
                </InputGroup>
                <Field.ErrorText>{slugMessage}</Field.ErrorText>
              </Field.Root>
            </SimpleGrid>

            <Field.Root>
              <Flex w="full" align="baseline" justify="space-between" gap="2">
                <Field.Label>Description</Field.Label>
                <Text
                  as="span"
                  fontSize="xs"
                  color="fg.muted"
                  fontVariantNumeric="tabular-nums"
                >
                  {values.description.length}/{ORG_DESCRIPTION_MAX}
                </Text>
              </Flex>
              <Textarea
                rows={3}
                maxLength={ORG_DESCRIPTION_MAX}
                value={values.description}
                placeholder="What does this organization work on?"
                onChange={(event) => update('description', event.target.value)}
              />
            </Field.Root>

            <Stack gap="2">
              <Text textStyle="body-sm" fontWeight="medium">
                Brand color
              </Text>
              <ColorSwatches
                label="Brand color"
                value={values.color}
                onChange={(color) => canManage && update('color', color)}
              />
              <Text textStyle="body-sm" color="fg.muted">
                Used for the organization mark in the switcher and sidebar.
              </Text>
            </Stack>
          </Stack>

          {canManage && (
            <FormFooter dirty={dirty}>
              <Button
                type="button"
                variant="ghost"
                colorPalette="gray"
                size="sm"
                px="3.5"
                disabled={!dirty}
                onClick={() => setValues(saved)}
              >
                Discard
              </Button>
              <Button
                type="submit"
                variant="solid"
                size="sm"
                px="3.5"
                disabled={
                  !dirty ||
                  Boolean(nameMessage || slugMessage) ||
                  saveOrg.isPending
                }
              >
                Save changes
              </Button>
            </FormFooter>
          )}
        </Fieldset.Root>
      </form>
    </SectionCard>
  )
}

function DefaultsCard({
  org,
  canManage,
}: {
  org: Organization
  canManage: boolean
}) {
  const update = useUpdateOrganization(org.id)
  const { visibility } = org.defaults
  const require2fa = org.defaults.requireTwoFactor
  const { domainJoin } = org.defaults

  /** Each control saves on its own; the card has no submit button. */
  function save(changes: Parameters<typeof update.mutate>[0], message: string) {
    update.mutate(changes, {
      onSuccess: () =>
        toaster.create({ type: 'success', title: `${message}.` }),
    })
  }

  const toggles = [
    {
      id: 'org-require-2fa',
      title: 'Require two-factor authentication',
      description:
        'Members without 2FA are asked to set it up on their next sign-in.',
      checked: require2fa,
      onChange: (checked: boolean) =>
        save(
          { require_two_factor: checked },
          checked ? '2FA is now required' : '2FA is optional',
        ),
    },
    {
      id: 'org-domain-join',
      title: 'Allow joining by email domain',
      description: 'Anyone with a verified company email can request to join.',
      checked: domainJoin,
      onChange: (checked: boolean) =>
        save(
          { allow_domain_join: checked },
          checked ? 'Domain joining enabled' : 'Domain joining disabled',
        ),
    },
  ]

  return (
    <SectionCard
      id="defaults"
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title="Defaults & security"
      description="Applied to new projects and everyone who joins."
    >
      <Stack gap="5" p="5">
        <Fieldset.Root disabled={!canManage}>
          <Fieldset.Legend textStyle="body-sm" fontWeight="medium" mb="3">
            Default project visibility
          </Fieldset.Legend>
          <RadioButtonGroup
            aria-label="Default project visibility"
            value={visibility}
            onChange={(value) =>
              save(
                {
                  default_project_visibility: toApiVisibility(
                    value as Organization['defaults']['visibility'],
                  ),
                },
                `New projects default to ${value.toLowerCase()}`,
              )
            }
            display="grid"
            gridTemplateColumns={{ sm: 'repeat(2, minmax(0, 1fr))' }}
            gap="3"
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
              <RadioButton
                key={option.value}
                value={option.value}
                variant="option"
                disabled={!canManage}
                alignItems="flex-start"
                justifyContent="flex-start"
                gap="3"
              >
                <Box mt="0.5" color="fg.muted">
                  <option.icon size={16} aria-hidden="true" />
                </Box>
                <Box flex="1" minW="0">
                  <Text textStyle="body-sm" fontWeight="medium">
                    {option.value}
                  </Text>
                  <Text textStyle="body-sm" color="fg.muted">
                    {option.description}
                  </Text>
                </Box>
              </RadioButton>
            ))}
          </RadioButtonGroup>
        </Fieldset.Root>

        <Box rounded="l2" borderWidth="1px" borderColor="border">
          {toggles.map((toggle) => (
            <Flex
              key={toggle.id}
              align="center"
              justify="space-between"
              gap="4"
              p="4"
              borderTopWidth="1px"
              borderColor="border"
              _first={{ borderTopWidth: '0' }}
            >
              <Box minW="0">
                <Text asChild textStyle="body-sm" fontWeight="medium">
                  <label htmlFor={toggle.id}>{toggle.title}</label>
                </Text>
                <Text textStyle="body-sm" color="fg.muted">
                  {toggle.description}
                </Text>
              </Box>
              <SwitchButton
                id={toggle.id}
                checked={toggle.checked}
                disabled={!canManage}
                onCheckedChange={toggle.onChange}
              />
            </Flex>
          ))}
        </Box>
      </Stack>
    </SectionCard>
  )
}

function DangerZoneCard({ org }: { org: Organization }) {
  const { preferences, updatePreferences, organizations } = useDashboardLayout()
  const { summary } = useOrgDetail()
  const navigate = useNavigate()
  const leave = useLeaveOrganization(org.id)
  const remove = useDeleteOrganization(org.id)
  const isOwner = org.yourRole === 'Owner'
  const [leaveOpen, setLeaveOpen] = React.useState(false)

  /** Leaves or deletes the organization, then moves on to another one. */
  function removeOrganization(
    action: typeof leave | typeof remove,
    message: string,
  ) {
    const fallback =
      preferences.organizationId === org.id
        ? organizations.find((item) => item.id !== org.id)?.id
        : preferences.organizationId
    // Leave this page before its organization disappears from under it. That
    // unmounts this card, so the result is read from the promise: a callback
    // passed to `mutate` would be dropped with the component.
    void navigate({ to: '/organizations' })
      .then(() => action.mutateAsync())
      .then(() => {
        if (fallback) updatePreferences({ organizationId: fallback })
        toaster.create({ type: 'success', title: message })
      })
      // The failure is already reported by the global mutation handler.
      .catch(() => undefined)
  }

  return (
    <DangerCard
      id="danger-zone"
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title="Danger zone"
    >
      <DangerRow
        icon={LogOut}
        title="Leave organization"
        description={
          isOwner
            ? 'Owners must transfer ownership before they can leave.'
            : `You lose access to ${plural(summary.projects, 'project')} in ${org.name}.`
        }
      >
        <Button
          {...dangerOutlineProps}
          disabled={isOwner}
          onClick={() => setLeaveOpen(true)}
        >
          Leave
        </Button>
        <AppDialog
          role="alertdialog"
          open={leaveOpen}
          onOpenChange={setLeaveOpen}
          title={`Leave ${org.name}?`}
          description="You'll need a new invitation to rejoin."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeaveOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="solid"
                colorPalette="danger"
                size="sm"
                onClick={() => {
                  setLeaveOpen(false)
                  removeOrganization(leave, `You left ${org.name}.`)
                }}
              >
                Leave organization
              </Button>
            </>
          }
        />
      </DangerRow>

      <DangerRow
        icon={ArrowRightLeft}
        title="Transfer ownership"
        description="Hand full control and billing to another admin."
      >
        <TransferOwnershipDialog org={org} disabled={!isOwner} />
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
            removeOrganization(remove, `${org.name} was deleted.`)
          }
        />
      </DangerRow>
    </DangerCard>
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
  const [open, setOpen] = React.useState(false)
  const [confirmation, setConfirmation] = React.useState('')
  const confirmed = confirmation.trim() === org.name

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
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Delete
      </Button>
      <AppDialog
        role="alertdialog"
        open={open}
        onOpenChange={close}
        title={`Delete ${org.name}?`}
        description="This removes the organization, its members' access and everything inside it. It cannot be undone."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button
              variant="solid"
              colorPalette="danger"
              size="sm"
              disabled={!confirmed}
              onClick={() => {
                close(false)
                onDelete()
              }}
            >
              Delete organization
            </Button>
          </>
        }
      >
        <Field.Root>
          <Field.Label>
            <span>
              Type{' '}
              <Text as="strong" fontWeight="semibold">
                {org.name}
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
      </AppDialog>
    </>
  )
}

/** Hands the owner role to another active member; the caller becomes admin. */
function TransferOwnershipDialog({
  org,
  disabled,
}: {
  org: Organization
  disabled: boolean
}) {
  const { members } = useOrgDetail()
  const transfer = useTransferOwnership(org.id)
  const [open, setOpen] = React.useState(false)
  const [memberId, setMemberId] = React.useState('')
  const candidates = members.filter(
    (member) => member.status === 'active' && !member.you,
  )
  const chosen = candidates.find((member) => member.id === memberId)

  function close(next: boolean) {
    setOpen(next)
    if (!next) setMemberId('')
  }

  return (
    <>
      <Button
        {...dangerOutlineProps}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Transfer
      </Button>
      <AppDialog
        role="alertdialog"
        open={open}
        onOpenChange={close}
        title={`Transfer ${org.name}?`}
        description="The new owner gets full control and billing. You stay on as an admin."
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
                  onSuccess: () =>
                    toaster.create({
                      type: 'success',
                      title: `${chosen.name} now owns ${org.name}.`,
                    }),
                })
              }}
            >
              Transfer ownership
            </Button>
          </>
        }
      >
        <SimpleSelect
          label="New owner"
          width="full"
          portalled={false}
          value={memberId}
          onChange={setMemberId}
          placeholder={
            candidates.length ? 'Choose a member' : 'No other active members'
          }
          items={candidates.map((member) => ({
            label: `${member.name} · ${member.email}`,
            value: member.id,
          }))}
        />
      </AppDialog>
    </>
  )
}
