import type * as React from 'react'
import { CloseButton, Dialog, Portal } from '@chakra-ui/react'
import type { DialogContentProps } from '@chakra-ui/react'

/**
 * A modal with a title, an optional description, a body and a footer of
 * actions. With `onSubmit` the whole dialog is a form, so Enter submits it.
 * Use `role="alertdialog"` for a confirmation the user must answer.
 *
 * A select inside needs `portalled={false}`: the modal hides everything
 * outside itself from assistive technology.
 */
export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  footer,
  onSubmit,
  role = 'dialog',
  size = 'md',
  children,
  ...contentProps
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  role?: 'dialog' | 'alertdialog'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  children?: React.ReactNode
} & Omit<DialogContentProps, 'title' | 'onSubmit' | 'role'>) {
  const parts = (
    <>
      <Dialog.Header flexDirection="column" alignItems="stretch" gap="1">
        <Dialog.Title>{title}</Dialog.Title>
        {description && (
          <Dialog.Description textStyle="body-sm" color="fg.muted">
            {description}
          </Dialog.Description>
        )}
      </Dialog.Header>
      {children && <Dialog.Body>{children}</Dialog.Body>}
      {footer && <Dialog.Footer>{footer}</Dialog.Footer>}
      <Dialog.CloseTrigger asChild>
        <CloseButton size="sm" />
      </Dialog.CloseTrigger>
    </>
  )

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => onOpenChange(event.open)}
      role={role}
      size={size}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          {onSubmit ? (
            <Dialog.Content asChild {...contentProps}>
              <form onSubmit={onSubmit} noValidate>
                {parts}
              </form>
            </Dialog.Content>
          ) : (
            <Dialog.Content {...contentProps}>{parts}</Dialog.Content>
          )}
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
