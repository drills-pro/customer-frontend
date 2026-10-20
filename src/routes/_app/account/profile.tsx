import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { toaster } from '@/components/toaster'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useDashboardLayout } from '@/features/dashboard/context'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageError } from '@/components/shared/query-states'
import type { CurrentUser } from '@/features/account/mappers'
import { useCurrentUser, useUpdateUser } from '@/features/account/queries'
import { isEmail } from '@/lib/validation'
import { accountRoles } from './-components/account-data'
import type { AccountProfile, AccountRole } from './-components/account-data'
import { PageHeader } from './-components/page-header'

export const Route = createFileRoute('/_app/account/profile')({
  component: ProfileRoute,
})
function ProfileRoute() {
  const { org } = useDashboardLayout()
  const { data: user, error, refetch } = useCurrentUser()
  return (
    <>
      <PageHeader
        title="Profile"
        description={`This information is visible to other members of ${org.name}.`}
      />
      {error ? (
        <PageError
          title="Could not load your profile"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        user && (
          <>
            <ProfilePhotoCard user={user} />
            <ProfileFormCard user={user} />
          </>
        )
      )}
    </>
  )
}

function ProfilePhotoCard({ user }: { user: CurrentUser }) {
  return (
    <Card size="flush">
      <CardContent className="flex flex-wrap items-center gap-4 p-5">
        <Avatar className="size-16">
          <AvatarFallback
            className="text-xl font-semibold text-white"
            style={{ backgroundColor: user.color }}
          >
            {user.initials}
          </AvatarFallback>
        </Avatar>
        <div className="mr-auto min-w-0">
          <p className="text-[13px] font-medium">Profile photo</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            PNG or JPG, at least 200×200px.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toaster.create({
                type: 'info',
                title: 'Uploading a photo is not available in this demo.',
              })
            }
          >
            Upload
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              toaster.create({
                type: 'info',
                title: 'Removing a photo is not available in this demo.',
              })
            }
          >
            Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

type Errors = Partial<Record<keyof AccountProfile, string>>

function validate(values: AccountProfile): Errors {
  const errors: Errors = {}
  if (!values.fullName.trim()) errors.fullName = 'Full name is required.'
  if (!/^[a-z0-9_-]{3,32}$/.test(values.username.trim()))
    errors.username = 'Use 3–32 lowercase letters, numbers, dashes or _.'
  if (!isEmail(values.email.trim()))
    errors.email = 'Enter a valid email address.'
  return errors
}

function ProfileFormCard({ user }: { user: CurrentUser }) {
  const orgName = useDashboardLayout().org.name
  const updateUser = useUpdateUser()
  const saved: AccountProfile = {
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role as AccountRole,
    bio: user.bio,
  }
  const [values, setValues] = React.useState(saved)
  const [submitted, setSubmitted] = React.useState(false)

  const errors = submitted ? validate(values) : {}
  const dirty = (Object.keys(saved) as Array<keyof AccountProfile>).some(
    (key) => values[key] !== saved[key],
  )

  function update<TKey extends keyof AccountProfile>(
    key: TKey,
    value: AccountProfile[TKey],
  ) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function save(event: React.FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!dirty || updateUser.isPending || Object.keys(validate(values)).length)
      return
    const next = {
      ...values,
      fullName: values.fullName.trim(),
      username: values.username.trim(),
      email: values.email.trim(),
      bio: values.bio.trim(),
    }
    updateUser.mutate(
      {
        full_name: next.fullName,
        username: next.username,
        email: next.email,
        job_role: next.role,
        bio: next.bio,
      },
      {
        onSuccess: () => {
          setValues(next)
          setSubmitted(false)
          toaster.create({ type: 'success', title: 'Profile saved.' })
        },
      },
    )
  }

  return (
    <Card size="flush">
      <form onSubmit={save} noValidate>
        <CardContent className="grid gap-5 p-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="profile-name"
              label="Full name"
              value={values.fullName}
              error={errors.fullName}
              autoComplete="name"
              onChange={(value) => update('fullName', value)}
            />
            <TextField
              id="profile-username"
              label="Username"
              value={values.username}
              error={errors.username}
              autoComplete="username"
              onChange={(value) => update('username', value)}
            />
            <TextField
              id="profile-email"
              label="Email"
              type="email"
              value={values.email}
              error={errors.email}
              hint="Used for sign-in and notifications."
              autoComplete="email"
              onChange={(value) => update('email', value)}
            />
            <Field>
              <FieldLabel htmlFor="profile-role">Role at {orgName}</FieldLabel>
              <Select
                value={values.role}
                onValueChange={(value) => update('role', value as AccountRole)}
              >
                <SelectTrigger id="profile-role" size="lg" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <TextField
            id="profile-bio"
            label="Bio"
            value={values.bio}
            onChange={(value) => update('bio', value)}
          />
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
            variant="outline"
            size="lg"
            className="px-3.5"
            disabled={!dirty}
            onClick={() => {
              setValues(saved)
              setSubmitted(false)
            }}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg" className="px-3.5" disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  )
}

function TextField({
  id,
  label,
  value,
  error,
  hint,
  type = 'text',
  autoComplete,
  onChange,
}: {
  id: string
  label: string
  value: string
  error?: string
  hint?: string
  type?: string
  autoComplete?: string
  onChange: (value: string) => void
}) {
  return (
    <Field data-invalid={Boolean(error) || undefined}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        size="lg"
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && !error && <FieldDescription>{hint}</FieldDescription>}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  )
}
