import * as React from 'react'
import {
  Box,
  CloseButton,
  Dialog,
  Flex,
  Heading,
  HStack,
  Input,
  InputGroup,
  Kbd,
  Portal,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Search } from 'lucide-react'

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
    <Dialog.Root
      open={open}
      onOpenChange={(event) => {
        onOpenChange(event.open)
        if (!event.open) setQuery('')
      }}
      size="lg"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxH="78vh" gap="0">
            <Dialog.Header borderBottomWidth="1px" borderColor="border" py="4">
              <Dialog.Title>Keyboard shortcuts</Dialog.Title>
              <Dialog.Description srOnly>
                Shortcuts available anywhere in DRILLS.
              </Dialog.Description>
            </Dialog.Header>

            <Box px="6" pt="4" pb="1">
              <InputGroup startElement={<Search size={16} />}>
                <Input
                  value={query}
                  placeholder="Search shortcuts..."
                  aria-label="Search shortcuts"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </InputGroup>
            </Box>

            <Dialog.Body pt="0" pb="5">
              {groups.length === 0 ? (
                <Text py="6" textStyle="body-sm" color="fg.muted">
                  No shortcuts match your search.
                </Text>
              ) : (
                groups.map((group) => (
                  <section key={group.title}>
                    <Heading
                      as="h3"
                      mt="4"
                      mb="1"
                      fontSize="xs"
                      fontWeight="medium"
                      color="fg.muted"
                    >
                      {group.title}
                    </Heading>
                    <Stack as="ul" gap="0" listStyleType="none">
                      {group.shortcuts.map((shortcut) => (
                        <Flex
                          as="li"
                          key={shortcut.label}
                          align="center"
                          justify="space-between"
                          gap="4"
                          py="1.5"
                        >
                          <span>{shortcut.label}</span>
                          <ShortcutKeys shortcut={shortcut} />
                        </Flex>
                      ))}
                    </Stack>
                  </section>
                ))
              )}
            </Dialog.Body>

            <HStack
              gap="1.5"
              borderTopWidth="1px"
              borderColor="border"
              px="6"
              py="3"
              fontSize="xs"
              color="fg.muted"
            >
              Press <Kbd size="sm">?</Kbd> anywhere to open this panel
            </HStack>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}

function ShortcutKeys({ shortcut }: { shortcut: Shortcut }) {
  return (
    <HStack as="span" gap="1" flexShrink={0}>
      {shortcut.keys.map((key, index) => (
        <React.Fragment key={key}>
          {index > 0 && shortcut.sequence && (
            <Text as="span" fontSize="xs" color="fg.muted">
              then
            </Text>
          )}
          <Kbd minW="6" justifyContent="center">
            {key}
          </Kbd>
        </React.Fragment>
      ))}
    </HStack>
  )
}
