import * as React from 'react'
import { Button } from '@chakra-ui/react'
import { Check, Copy } from 'lucide-react'
import { toaster } from '@/components/toaster'

/**
 * Copies a value and says so in place. Clipboard access throws in some
 * browsers and contexts, so the failure path tells the user what to do instead.
 */
export function CopyButton({
  value,
  label,
  children,
}: {
  value: string
  label: string
  children?: React.ReactNode
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(timer)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      toaster.create({
        type: 'info',
        title: 'Select the value to copy it manually.',
      })
    }
  }

  return (
    <Button
      variant="ghost"
      colorPalette="gray"
      size="xs"
      aria-label={label}
      onClick={copy}
    >
      {copied ? <Check /> : <Copy />}
      {children ?? (copied ? 'Copied' : 'Copy')}
    </Button>
  )
}
