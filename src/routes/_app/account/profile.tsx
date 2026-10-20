import * as React from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  Field,
  Flex,
  HStack,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { createFileRoute } from '@tanstack/react-router'
import { toaster } from '@/components/toaster'

import { FormFooter } from '@/components/shared/form-footer'
import { SimpleSelect } from '@/components/simple-select'
import { useDashboardLayout } from '@/features/dashboard/context'
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
    <Card.Root variant="outline">
      <Flex wrap="wrap" align="center" gap="4" p="5">
        <Avatar.Root
          boxSize="16"
          borderWidth="0"
          color="white"
          // The user's own color, from the API.
          bg={user.color}
        >
          <Avatar.Fallback fontSize="xl" fontWeight="semibold">
            {user.initials}
          </Avatar.Fallback>
        </Avatar.Root>
        <Box me="auto" minW="0">
          <Text fontSize="13px" fontWeight="medium">
            Profile photo
          </Text>
          <Text mt="0.5" fontSize="xs" color="fg.muted">
            PNG or JPG, at least 200×200px.
          </Text>
        </Box>
        <HStack gap="2">
          <Button
            variant="outline"
            size="sm"
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
            colorPalette="gray"
            size="sm"
            onClick={() =>
              toaster.create({
                type: 'info',
                title: 'Removing a photo is not available in this demo.',
              })
            }
          >
            Remove
          </Button>
        </HStack>
      </Flex>
    </Card.Root>
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
    <Card.Root variant="outline">
      <form onSubmit={save} noValidate>
        <Stack gap="5" p="5">
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap="5">
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
            <SimpleSelect
              label={`Role at ${orgName}`}
              width="full"
              value={values.role}
              onChange={(value) => update('role', value as AccountRole)}
              items={accountRoles.map((role) => ({ label: role, value: role }))}
            />
          </SimpleGrid>
          <TextField
            id="profile-bio"
            label="Bio"
            value={values.bio}
            onChange={(value) => update('bio', value)}
          />
        </Stack>

        <FormFooter dirty={dirty}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            px="3.5"
            disabled={!dirty}
            onClick={() => {
              setValues(saved)
              setSubmitted(false)
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="solid"
            size="sm"
            px="3.5"
            disabled={!dirty}
          >
            Save changes
          </Button>
        </FormFooter>
      </form>
    </Card.Root>
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
    <Field.Root invalid={Boolean(error)}>
      <Field.Label>{label}</Field.Label>
      <Input
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && !error && <Field.HelperText>{hint}</Field.HelperText>}
      {error && (
        <Text
          id={`${id}-error`}
          role="alert"
          textStyle="body-sm"
          color="fg.error"
        >
          {error}
        </Text>
      )}
    </Field.Root>
  )
}
