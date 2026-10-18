import * as React from 'react'
import { KeyRound, Plus, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/client'
import { CopyButton } from '@/components/shared/copy-button'
import { CardError, CardLoading } from '@/components/shared/query-states'
import type { ApiKey, ApiKeyScope } from '@/features/account/api'
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from '@/features/account/queries'
import { relativeTime } from '@/lib/format'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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
    <Card id={id} size="flush" className="scroll-mt-22">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>API keys</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Button variant="outline" onClick={() => setGenerateOpen(true)}>
            <Plus />
            Generate key
          </Button>
        </CardAction>
      </CardHeader>

      {keysQuery.error ? (
        <CardError
          title="Could not load API keys"
          error={keysQuery.error}
          onRetry={() => void keysQuery.refetch()}
        />
      ) : keysQuery.isPending ? (
        <CardLoading rows={2} />
      ) : keys.length === 0 ? (
        <Empty className="min-h-48">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <KeyRound />
            </EmptyMedia>
            <EmptyTitle>No API keys</EmptyTitle>
            <EmptyDescription>
              Generate a key to call endpoints or start runs from CI.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-[620px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead className="pr-5">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="pl-5">
                    <p className="font-medium text-foreground">{key.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {createdLabel(key.created_at)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <code className="font-mono text-xs text-muted-foreground">
                      drl_sk_••••••{key.suffix}
                    </code>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {key.scope}
                    </code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.last_used_at
                      ? relativeTime(key.last_used_at)
                      : 'Never'}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive-muted hover:text-destructive"
                      aria-label={`Revoke ${key.name}`}
                      onClick={() => setRevoking(key)}
                    >
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <GenerateKeyDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        existing={keys.map((key) => key.name)}
        projectId={projectId}
      />

      <AlertDialog
        open={Boolean(revoking)}
        onOpenChange={(open) => !open && setRevoking(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke {revoking?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Requests using this key start failing immediately. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (!revoking) return
                revoke.mutate(revoking.id, {
                  onSuccess: () =>
                    toast.success(`${revoking.name} was revoked.`),
                })
              }}
            >
              Revoke key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
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

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        {secret ? (
          <>
            <DialogHeader>
              <DialogTitle>Copy your new key</DialogTitle>
              <DialogDescription>
                Store it somewhere safe, like a secrets manager.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted p-2 pl-3">
                <code
                  data-testid="generated-api-key"
                  className="min-w-0 flex-1 truncate font-mono text-xs"
                >
                  {secret}
                </code>
                <CopyButton value={secret} label="Copy API key" />
              </div>
              <p className="flex items-start gap-2 rounded-lg bg-warning-muted p-3 text-xs text-warning">
                <TriangleAlert className="mt-px size-3.5 shrink-0" />
                You won't be able to see this key again after closing this
                dialog.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => close(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={submit} noValidate className="contents">
            <DialogHeader>
              <DialogTitle>Generate API key</DialogTitle>
              <DialogDescription>
                Give the key a name that says where it's used.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="gap-4 py-2">
              <Field data-invalid={Boolean(error) || undefined}>
                <FieldLabel htmlFor="api-key-name">Key name</FieldLabel>
                <Input
                  id="api-key-name"
                  value={name}
                  placeholder="staging-inference"
                  aria-invalid={Boolean(error) || undefined}
                  onChange={(event) => {
                    setName(event.target.value)
                    setError('')
                  }}
                />
                <FieldError>{error}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="api-key-scope">Scope</FieldLabel>
                <Select
                  value={scope}
                  onValueChange={(value) => setScope(value as Scope)}
                >
                  <SelectTrigger id="api-key-scope" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {scopes.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  Grant the narrowest scope the caller needs.
                </FieldDescription>
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => close(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Generate key</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
