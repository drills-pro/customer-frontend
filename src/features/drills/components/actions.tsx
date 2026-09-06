import { Copy, Download } from 'lucide-react'
import { useDemo } from '../store'
import { Button } from './forms'

export function download(
  name: string,
  content: unknown,
  mime = 'application/json',
) {
  const text =
    typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function DownloadButton({
  name,
  content,
  label = 'Download',
}: {
  name: string
  content: unknown
  label?: string
}) {
  const { notify } = useDemo()
  return (
    <Button
      variant="ghost"
      onClick={() => {
        download(name, content)
        notify('Sample download prepared.')
      }}
    >
      <Download data-icon="inline-start" />
      {label}
    </Button>
  )
}

export function CopyButton({
  value,
  label = 'Copy',
}: {
  value: string
  label?: string
}) {
  const { notify } = useDemo()
  return (
    <Button
      variant="ghost"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value)
          notify('Copied to clipboard.')
        } catch {
          notify('Clipboard unavailable. Select and copy the text manually.')
        }
      }}
    >
      <Copy data-icon="inline-start" />
      {label}
    </Button>
  )
}
