import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  CircleCheck,
  KeyRound,
  Lock,
  Monitor,
  Smartphone,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { toast } from 'sonner'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
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
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { useDashboardLayout } from '@/features/dashboard/context'
import { Input } from '@/components/ui/input'
import {
  currentUser,
  sessions as seededSessions,
} from './-components/account-data'
import { PageHeader, SettingRow } from './-components/page-header'

export const Route = createFileRoute('/_app/account/security')({
  component: SecurityRoute,
})
function SecurityRoute() {
  return (
    <>
      <PageHeader
        title="Security"
        description="Manage how you sign in and keep your account secure."
      />
      <PasswordCard />
      <SignInMethodsCard />
      <SessionsCard />
      <DeleteAccountCard />
    </>
  )
}

const onBadge = 'border-0 bg-success-muted text-success'
const offBadge = 'border-0 bg-muted text-muted-foreground'

function PasswordCard() {
  const [open, setOpen] = React.useState(false)
  const [lastChanged, setLastChanged] = React.useState('4 months ago')

  return (
    <Card size="flush">
      <CardContent className="p-0">
        <SettingRow
          icon={KeyRound}
          title="Password"
          description={`Last changed ${lastChanged}.`}
        >
          <Button variant="outline" onClick={() => setOpen(true)}>
            Change password
          </Button>
        </SettingRow>
      </CardContent>
      <ChangePasswordDialog
        open={open}
        onOpenChange={setOpen}
        onChanged={() => {
          setLastChanged('just now')
          toast.success('Password changed for this session (demo only).')
        }}
      />
    </Card>
  )
}

type PasswordValues = { current: string; next: string; confirm: string }
const emptyPasswords: PasswordValues = { current: '', next: '', confirm: '' }

function ChangePasswordDialog({
  open,
  onOpenChange,
  onChanged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => void
}) {
  const [values, setValues] = React.useState(emptyPasswords)
  const [errors, setErrors] = React.useState<Partial<PasswordValues>>({})

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setValues(emptyPasswords)
      setErrors({})
    }
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors: Partial<PasswordValues> = {}
    if (!values.current) nextErrors.current = 'Enter your current password.'
    if (values.next.length < 8) nextErrors.next = 'Use at least 8 characters.'
    else if (values.next === values.current)
      nextErrors.next = 'Choose a password you have not used here.'
    if (values.confirm !== values.next)
      nextErrors.confirm = 'Passwords do not match.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    onChanged()
    close(false)
  }

  const fields: Array<{
    key: keyof PasswordValues
    label: string
    autoComplete: string
    hint?: string
  }> = [
    {
      key: 'current',
      label: 'Current password',
      autoComplete: 'current-password',
    },
    {
      key: 'next',
      label: 'New password',
      autoComplete: 'new-password',
      hint: 'At least 8 characters.',
    },
    {
      key: 'confirm',
      label: 'Confirm new password',
      autoComplete: 'new-password',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="contents">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Other sessions stay signed in until you sign them out.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4 py-2">
            {fields.map((field) => {
              const id = `password-${field.key}`
              const error = errors[field.key]
              return (
                <Field
                  key={field.key}
                  data-invalid={Boolean(error) || undefined}
                >
                  <FieldLabel htmlFor={id}>{field.label}</FieldLabel>
                  <Input
                    id={id}
                    type="password"
                    value={values[field.key]}
                    autoComplete={field.autoComplete}
                    aria-invalid={Boolean(error) || undefined}
                    onChange={(event) => {
                      const value = event.target.value
                      setValues((current) => ({
                        ...current,
                        [field.key]: value,
                      }))
                      setErrors((current) => ({
                        ...current,
                        [field.key]: undefined,
                      }))
                    }}
                  />
                  {field.hint && !error && (
                    <FieldDescription>{field.hint}</FieldDescription>
                  )}
                  <FieldError>{error}</FieldError>
                </Field>
              )
            })}
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => close(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Update password</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SignInMethodsCard() {
  const orgName = useDashboardLayout().org.name
  return (
    <Card size="flush">
      <CardContent className="divide-y p-0">
        <SettingRow
          icon={Lock}
          title="Two-factor authentication"
          description="Require a code from your authenticator app at sign-in."
        >
          <Badge variant="secondary" className={offBadge}>
            Off
          </Badge>
          <Button
            variant="outline"
            onClick={() =>
              toast.info(
                'Two-factor authentication is not available in this demo.',
              )
            }
          >
            Enable
          </Button>
        </SettingRow>
        <SettingRow
          icon={CircleCheck}
          title="Google SSO"
          description={`Sign in with your ${orgName} Google Workspace account.`}
        >
          <Badge variant="secondary" className={onBadge}>
            Connected
          </Badge>
        </SettingRow>
      </CardContent>
    </Card>
  )
}

function SessionsCard() {
  const [sessions, setSessions] = React.useState(seededSessions)

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>Active sessions</CardTitle>
        <CardDescription>
          Devices currently signed in to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {sessions.map((session) => (
          <SettingRow
            key={session.id}
            icon={session.kind === 'mobile' ? Smartphone : Monitor}
            title={`${session.device} — ${session.location}`}
            description={session.lastActive}
          >
            {session.current ? (
              <Badge variant="secondary" className={onBadge}>
                This device
              </Badge>
            ) : (
              <Button
                variant="ghost"
                aria-label={`Sign out ${session.device}`}
                onClick={() => {
                  setSessions((current) =>
                    current.filter((item) => item.id !== session.id),
                  )
                  toast.success(`Signed out of ${session.device}.`)
                }}
              >
                Sign out
              </Button>
            )}
          </SettingRow>
        ))}
      </CardContent>
    </Card>
  )
}

function DeleteAccountCard() {
  const [open, setOpen] = React.useState(false)
  const [confirmation, setConfirmation] = React.useState('')
  const confirmWord = currentUser.profile.username
  const confirmed = confirmation === confirmWord

  return (
    <Card size="flush" className="ring-destructive/30">
      <CardHeader className="border-b border-destructive/20 bg-destructive-muted/50 [--card-section:--spacing(3.5)]">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="size-4" />
          Delete account
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4 p-5">
        <p className="mr-auto min-w-0 basis-60 grow text-xs text-muted-foreground">
          Permanently remove your account and all associated data. This can't be
          undone.
        </p>
        <AlertDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next)
            if (!next) setConfirmation('')
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="lg" className="px-3.5">
              <Trash2 />
              Delete account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                You lose access to every organization and project, and your API
                keys stop working. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Field>
              <FieldLabel
                htmlFor="delete-account-confirm"
                className="font-normal"
              >
                <span>
                  Type <b className="font-semibold">{confirmWord}</b> to confirm
                </span>
              </FieldLabel>
              <Input
                id="delete-account-confirm"
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
                onClick={() =>
                  toast.info(
                    'Deleting an account is not available in this demo.',
                  )
                }
              >
                Delete my account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
