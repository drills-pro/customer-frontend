import * as React from 'react'
import { Check, Copy } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

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
      toast.info('Select the value to copy it manually.')
    }
  }

  return (
    <Button variant="ghost" size="sm" aria-label={label} onClick={copy}>
      {copied ? <Check /> : <Copy />}
      {children ?? (copied ? 'Copied' : 'Copy')}
    </Button>
  )
}
