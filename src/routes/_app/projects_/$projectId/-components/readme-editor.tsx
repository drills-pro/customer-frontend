import * as React from 'react'
import { BookOpen, Pencil, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const PLACEHOLDER = `# Project name

Describe what this project does, who it's for, and how to get started.

## Usage

\`\`\`
curl -X POST https://api.example.com/predict -d '{"input": "..."}'
\`\`\`
`

export function ReadmeCard({
  readme,
  initialMarkdown,
  markdown,
  onSave,
}: {
  /** The generated summary, shown until a README has been written. */
  readme?: React.ReactNode
  initialMarkdown?: string
  /** The saved README. */
  markdown?: string
  onSave: (markdown: string) => void
}) {
  // What was just saved, shown until the saved README comes back from the API.
  const [justSaved, setJustSaved] = React.useState<string>()
  const content = justSaved ?? markdown ?? ''
  const [isEditing, setIsEditing] = React.useState(false)
  const [draft, setDraft] = React.useState('')
  const [tab, setTab] = React.useState<'edit' | 'preview'>('edit')

  let action: React.ReactNode = null
  let body: React.ReactNode

  if (isEditing) {
    action = (
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as 'edit' | 'preview')}
      >
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    body = (
      <div className="flex w-full flex-1 flex-col gap-3">
        {tab === 'edit' ? (
          <Textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={PLACEHOLDER}
            className="field-sizing-fixed min-h-96 flex-1 resize-none overflow-y-auto font-mono text-xs leading-5"
          />
        ) : draft.trim() ? (
          <div className="prose prose-sm min-h-96 max-w-none flex-1 overflow-y-auto rounded-lg border p-4">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
          </div>
        ) : (
          <p className="flex min-h-96 flex-1 items-center justify-center rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Nothing to preview yet.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsEditing(false)
              setTab('edit')
            }}
          >
            Cancel
          </Button>
          <Button
            disabled={!draft.trim()}
            onClick={() => {
              setJustSaved(draft)
              onSave(draft)
              setIsEditing(false)
              setTab('edit')
            }}
          >
            Save README
          </Button>
        </div>
      </div>
    )
  } else if (content.trim()) {
    action = (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDraft(content)
          setTab('edit')
          setIsEditing(true)
        }}
      >
        <Pencil />
        Edit
      </Button>
    )
    body = (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  } else if (readme) {
    action = (
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setDraft(initialMarkdown ?? '')
          setTab('edit')
          setIsEditing(true)
        }}
      >
        <Pencil />
        Edit
      </Button>
    )
    body = readme
  } else {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpen />
          </EmptyMedia>
          <EmptyTitle>Add a README</EmptyTitle>
          <EmptyDescription>
            Help people interested in this project understand what it does and
            how to use it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={() => {
              setDraft('')
              setTab('edit')
              setIsEditing(true)
            }}
          >
            <Plus />
            Add a README
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <Card size="flush" className="flex min-h-200">
      <CardHeader className="border-b">
        <CardTitle>README.md</CardTitle>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 overflow-y-auto p-5 text-sm leading-6">
        {body}
      </CardContent>
    </Card>
  )
}
