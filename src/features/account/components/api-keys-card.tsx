import * as React from 'react'
import {
  Box,
  Button,
  Code,
  Field,
  Flex,
  Input,
  Stack,
  Table,
  Text,
  VisuallyHidden,
} from '@chakra-ui/react'
import { KeyRound, Plus, TriangleAlert } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { ApiError } from '@/api/client'
import { AppDialog } from '@/components/shared/app-dialog'
import { CopyButton } from '@/components/shared/copy-button'
import { EmptyNotice } from '@/components/shared/empty-notice'
import { CardError, CardLoading } from '@/components/shared/query-states'
import { SectionCard } from '@/components/shared/section-card'
import { SECTION_OFFSET } from '@/components/shared/settings-nav'
import { SimpleSelect } from '@/components/simple-select'
import type { ApiKey, ApiKeyScope } from '@/features/account/api'
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from '@/features/account/queries'
import { relativeTime } from '@/lib/format'

const scopes = [
  'inference:read',
  'train:write',
  'datasets:write',
  'admin',
] as const
type Scope = ApiKeyScope

function createdLabel(iso: string) {
  const age = Date.now() - new Date(iso).getTime()
  return age < 7 * 24 * 60 * 60 * 1000
    ? relativeTime(iso)
    : new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
}

export function ApiKeysCard({
  id = 'api-keys',
  description = 'Authenticate scripts and services against this project.',
  projectId,
}: {
  id?: string
  description?: string
  /** Lists the keys usable in this project, and limits new keys to it. */
  projectId?: string
}) {
  const keysQuery = useApiKeys(projectId)
  const revoke = useRevokeApiKey()
  const keys = keysQuery.data ?? []
  const [generateOpen, setGenerateOpen] = React.useState(false)
  const [revoking, setRevoking] = React.useState<ApiKey>()

  return (
    <SectionCard
      id={id}
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title="API keys"
      description={description}
      action={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setGenerateOpen(true)}
        >
          <Plus />
          Generate key
        </Button>
      }
    >
      {keysQuery.error ? (
        <CardError
          title="Could not load API keys"
          error={keysQuery.error}
          onRetry={() => void keysQuery.refetch()}
        />
      ) : keysQuery.isPending ? (
        <CardLoading rows={2} />
      ) : keys.length === 0 ? (
        <EmptyNotice
          minH="48"
          icon={<KeyRound />}
          title="No API keys"
          description="Generate a key to call endpoints or start runs from CI."
        />
      ) : (
        <Table.ScrollArea>
          <Table.Root variant="data" minW="620px">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader ps="5">Name</Table.ColumnHeader>
                <Table.ColumnHeader>Key</Table.ColumnHeader>
                <Table.ColumnHeader>Scope</Table.ColumnHeader>
                <Table.ColumnHeader>Last used</Table.ColumnHeader>
                <Table.ColumnHeader pe="5">
                  <VisuallyHidden>Actions</VisuallyHidden>
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {keys.map((key) => (
                <Table.Row key={key.id}>
                  <Table.Cell ps="5">
                    <Text fontWeight="medium">{key.name}</Text>
                    <Text fontSize="xs" color="fg.muted">
                      Created {createdLabel(key.created_at)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text
                      as="code"
                      fontFamily="mono"
                      fontSize="xs"
                      color="fg.muted"
                    >
                      drl_sk_••••••{key.suffix}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Code size="sm">{key.scope}</Code>
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {key.last_used_at
                      ? relativeTime(key.last_used_at)
                      : 'Never'}
                  </Table.Cell>
                  <Table.Cell pe="5" textAlign="end">
                    <Button
                      variant="ghost"
                      size="xs"
                      color="fg.error"
                      _hover={{ bg: 'bg.error' }}
                      aria-label={`Revoke ${key.name}`}
                      onClick={() => setRevoking(key)}
                    >
                      Revoke
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}

      <GenerateKeyDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        existing={keys.map((key) => key.name)}
        projectId={projectId}
      />

      <AppDialog
        role="alertdialog"
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(undefined)}
        title={`Revoke ${revoking?.name}?`}
        description="Requests using this key start failing immediately. This cannot be undone."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRevoking(undefined)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              colorPalette="danger"
              size="sm"
              onClick={() => {
                if (!revoking) return
                setRevoking(undefined)
                revoke.mutate(revoking.id, {
                  onSuccess: () =>
                    toaster.create({
                      type: 'success',
                      title: `${revoking.name} was revoked.`,
                    }),
                })
              }}
            >
              Revoke key
            </Button>
          </>
        }
      />
    </SectionCard>
  )
}

function GenerateKeyDialog({
  open,
  onOpenChange,
  existing,
  projectId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: string[]
  projectId?: string
}) {
  const create = useCreateApiKey()
  const [name, setName] = React.useState('')
  const [scope, setScope] = React.useState<Scope>('inference:read')
  const [error, setError] = React.useState('')
  const [secret, setSecret] = React.useState<string>()

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setName('')
      setScope('inference:read')
      setError('')
      setSecret(undefined)
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = name.trim()
    if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(value)) {
      setError('Use 2–40 lowercase letters, numbers or dashes.')
      return
    }
    if (existing.includes(value)) {
      setError('A key with this name already exists.')
      return
    }
    if (create.isPending) return
    create.mutate(
      { name: value, scope, project_id: projectId },
      {
        // The secret is only readable in this answer; it is shown once.
        onSuccess: (created) => setSecret(created.secret),
        onError: (failure) => {
          if (failure instanceof ApiError && failure.status === 409) {
            setError('A key with this name already exists.')
          }
        },
      },
    )
  }

  if (secret) {
    return (
      <AppDialog
        open={open}
        onOpenChange={close}
        title="Copy your new key"
        description="Store it somewhere safe, like a secrets manager."
        footer={
          <Button variant="solid" size="sm" onClick={() => close(false)}>
            Done
          </Button>
        }
      >
        <Stack gap="3">
          <Flex align="center" gap="2" rounded="l2" bg="bg.muted" p="2" ps="3">
            <Text
              as="code"
              data-testid="generated-api-key"
              minW="0"
              flex="1"
              truncate
              fontFamily="mono"
              fontSize="xs"
            >
              {secret}
            </Text>
            <CopyButton value={secret} label="Copy API key" />
          </Flex>
          <Flex
            align="flex-start"
            gap="2"
            rounded="l2"
            bg="bg.warning"
            p="3"
            fontSize="xs"
            color="fg.warning"
          >
            <Box mt="1px" flexShrink={0}>
              <TriangleAlert size={14} />
            </Box>
            You won't be able to see this key again after closing this dialog.
          </Flex>
        </Stack>
      </AppDialog>
    )
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={close}
      onSubmit={submit}
      title="Generate API key"
      description="Give the key a name that says where it's used."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => close(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="solid" size="sm">
            Generate key
          </Button>
        </>
      }
    >
      <Stack gap="4">
        <Field.Root invalid={Boolean(error)}>
          <Field.Label>Key name</Field.Label>
          <Input
            value={name}
            placeholder="staging-inference"
            onChange={(event) => {
              setName(event.target.value)
              setError('')
            }}
          />
          <Field.ErrorText>{error}</Field.ErrorText>
        </Field.Root>
        <Stack gap="1.5">
          <SimpleSelect
            label="Scope"
            width="full"
            portalled={false}
            value={scope}
            onChange={(value) => setScope(value as Scope)}
            items={scopes.map((item) => ({ label: item, value: item }))}
          />
          <Text textStyle="body-sm" color="fg.muted">
            Grant the narrowest scope the caller needs.
          </Text>
        </Stack>
      </Stack>
    </AppDialog>
  )
}
