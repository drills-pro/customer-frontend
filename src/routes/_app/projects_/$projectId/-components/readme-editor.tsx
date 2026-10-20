import * as React from 'react'
import { Box, Button, Flex, Tabs, Text, Textarea } from '@chakra-ui/react'
import { BookOpen, Pencil, Plus } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { EmptyNotice } from '@/components/shared/empty-notice'
import { Prose } from '@/components/shared/prose'
import { SectionCard } from '@/components/shared/section-card'

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
      <Tabs.Root
        size="sm"
        variant="enclosed"
        value={tab}
        onValueChange={(event) => setTab(event.value as 'edit' | 'preview')}
      >
        <Tabs.List>
          <Tabs.Trigger value="edit">Edit</Tabs.Trigger>
          <Tabs.Trigger value="preview">Preview</Tabs.Trigger>
        </Tabs.List>
      </Tabs.Root>
    )
    body = (
      <Flex w="full" flex="1" direction="column" gap="3">
        {tab === 'edit' ? (
          <Textarea
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={PLACEHOLDER}
            minH="96"
            flex="1"
            resize="none"
            overflowY="auto"
            fontFamily="mono"
            fontSize="xs"
            lineHeight="1.25rem"
          />
        ) : draft.trim() ? (
          <Prose
            minH="96"
            flex="1"
            overflowY="auto"
            rounded="l2"
            borderWidth="1px"
            borderColor="border"
            p="4"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
          </Prose>
        ) : (
          <Flex
            minH="96"
            flex="1"
            align="center"
            justify="center"
            rounded="l2"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="border.emphasized"
            p="4"
            textAlign="center"
          >
            <Text textStyle="body-sm" color="fg.muted">
              Nothing to preview yet.
            </Text>
          </Flex>
        )}
        <Flex justify="flex-end" gap="2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsEditing(false)
              setTab('edit')
            }}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            size="sm"
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
        </Flex>
      </Flex>
    )
  } else if (content.trim()) {
    action = (
      <Button
        variant="outline"
        size="xs"
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
      <Prose>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </Prose>
    )
  } else if (readme) {
    action = (
      <Button
        variant="outline"
        size="xs"
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
      <EmptyNotice
        flex="1"
        icon={<BookOpen />}
        title="Add a README"
        description="Help people interested in this project understand what it does and how to use it."
      >
        <Button
          variant="solid"
          size="sm"
          onClick={() => {
            setDraft('')
            setTab('edit')
            setIsEditing(true)
          }}
        >
          <Plus />
          Add a README
        </Button>
      </EmptyNotice>
    )
  }

  return (
    <SectionCard
      title="README.md"
      action={action}
      display="flex"
      flexDirection="column"
      minH="50rem"
    >
      <Box
        display="flex"
        minH="0"
        flex="1"
        overflowY="auto"
        p="5"
        textStyle="body-sm"
        lineHeight="1.5rem"
      >
        {body}
      </Box>
    </SectionCard>
  )
}
