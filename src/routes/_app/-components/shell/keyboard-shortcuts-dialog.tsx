import * as React from 'react'
import { Search } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Kbd } from '@/components/ui/kbd'

type Shortcut = {
  label: string
  keywords?: string
  /** A "chord" is pressed together; a "sequence" is pressed one after another. */
  keys: string[]
  sequence?: boolean
}

// Only shortcuts that are wired up belong here; see `useAppShortcuts`.
const shortcutGroups: Array<{ title: string; shortcuts: Shortcut[] }> = [
  {
    title: 'General',
    shortcuts: [
      { label: 'Open search', keys: ['⌘', 'K'] },
      {
        label: 'Open this panel',
        keywords: 'keyboard shortcuts help',
        keys: ['⌘', '/'],
      },
      { label: 'Close dialog / cancel', keywords: 'escape', keys: ['Esc'] },
      { label: 'Toggle sidebar', keys: ['⌘', 'B'] },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { label: 'Go to Home', keys: ['G', 'H'], sequence: true },
      { label: 'Go to Projects', keys: ['G', 'P'], sequence: true },
      {
        label: 'Go to Account settings',
        keywords: 'profile',
        keys: ['G', 'A'],
        sequence: true,
      },
    ],
  },
]

export function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [query, setQuery] = React.useState('')
  const normalized = query.trim().toLowerCase()

  const groups = shortcutGroups
    .map((group) => ({
      ...group,
      shortcuts: group.shortcuts.filter((shortcut) =>
        `${shortcut.label} ${shortcut.keywords ?? ''}`
          .toLowerCase()
          .includes(normalized),
      ),
    }))
    .filter((group) => group.shortcuts.length > 0)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setQuery('')
      }}
    >
      <DialogContent className="flex max-h-[78vh] flex-col gap-0 p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="sr-only">
            Shortcuts available anywhere in DRILLS.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mx-5 mt-4 mb-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            placeholder="Search shortcuts..."
            aria-label="Search shortcuts"
            className="pl-8"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="min-h-0 overflow-y-auto px-5 pb-5">
          {groups.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No shortcuts match your search.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.title}>
                <h3 className="mt-4 mb-1 text-xs font-medium text-muted-foreground">
                  {group.title}
                </h3>
                <ul>
                  {group.shortcuts.map((shortcut) => (
                    <li
                      key={shortcut.label}
                      className="flex items-center justify-between gap-4 py-1.5"
                    >
                      <span>{shortcut.label}</span>
                      <ShortcutKeys shortcut={shortcut} />
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <p className="flex items-center gap-1.5 border-t px-5 py-3 text-xs text-muted-foreground">
          Press <Kbd>?</Kbd> anywhere to open this panel
        </p>
      </DialogContent>
    </Dialog>
  )
}

function ShortcutKeys({ shortcut }: { shortcut: Shortcut }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      {shortcut.keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && shortcut.sequence && (
            <span className="text-xs text-muted-foreground">then</span>
          )}
          <Kbd className="min-w-6 border border-b-2 bg-muted/50">{key}</Kbd>
        </React.Fragment>
      ))}
    </span>
  )
}
