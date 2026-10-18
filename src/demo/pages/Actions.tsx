import { Box, Button, ButtonGroup, Code, HStack, IconButton, Link, Menu, Portal, Stack, Text, Tooltip } from '@chakra-ui/react';
import { toaster } from '../../components/toaster';
import { Glyph, Page, Section, q } from '../parts';

const Copy = () => <Glyph d="M5 5h8v8H5zM3 11V3h8" />;
const Plus = () => <Glyph d="M8 3v10M3 8h10" />;

export function Actions() {
  return (
    <Page title="Actions" lead="One solid button per screen; everything else is outline or ghost.">
      <Section title="Variants" wide>
        <HStack gap="3" wrap="wrap">
          <Button variant="solid">Start training</Button>
          <Button>Add images</Button>
          <Button variant="subtle">Subtle</Button>
          <Button variant="surface">Surface</Button>
          <Button variant="ghost">View logs</Button>
          <Button variant="plain">Plain</Button>
          <Button variant="solid" colorPalette="secondary">
            Test model
          </Button>
          <Button variant="solid" colorPalette="danger">
            Delete dataset
          </Button>
        </HStack>
      </Section>

      <Section title="States">
        <HStack gap="3" wrap="wrap">
          <Button variant="solid" disabled>
            Disabled
          </Button>
          <Button variant="solid" loading>
            Saving
          </Button>
          <Button disabled>Disabled</Button>
        </HStack>
      </Section>

      <Section title="Sizes">
        <HStack gap="3" wrap="wrap" align="center">
          {(['xs', 'sm', 'md', 'lg'] as const).map((s) => (
            <Button key={s} size={s} variant="solid">
              {s}
            </Button>
          ))}
        </HStack>
      </Section>

      <Section title="Icon buttons and groups">
        <HStack gap="4" wrap="wrap">
          <Tooltip.Root openDelay={200} defaultOpen={q.get('open') === 'tooltip'}>
            <Tooltip.Trigger asChild>
              <IconButton aria-label="Copy endpoint URL">
                <Copy />
              </IconButton>
            </Tooltip.Trigger>
            <Portal>
              <Tooltip.Positioner>
                <Tooltip.Content>Copy endpoint URL</Tooltip.Content>
              </Tooltip.Positioner>
            </Portal>
          </Tooltip.Root>
          <IconButton aria-label="Add image" variant="solid">
            <Plus />
          </IconButton>
          <ButtonGroup attached>
            <Button>Left</Button>
            <Button>Middle</Button>
            <Button>Right</Button>
          </ButtonGroup>
        </HStack>
      </Section>

      <Section title="Menus">
        <Stack gap="4">
          <Menu.Root defaultOpen={q.get('open') === 'menu'}>
            <Menu.Trigger asChild>
              <Button>More</Button>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="rename">Rename</Menu.Item>
                  <Menu.Item value="duplicate">Duplicate</Menu.Item>
                  <Menu.Separator />
                  <Menu.Item value="delete" color="fg.error">
                    Delete
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
          <Menu.Root>
            <Menu.ContextTrigger asChild>
              <Box borderWidth="1px" borderColor="border" borderRadius="l3" p="6" textAlign="center" color="fg.muted" tabIndex={0}>
                Right-click anywhere in this box (or press the menu key).
              </Box>
            </Menu.ContextTrigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="open" onSelect={() => toaster.create({ title: 'Opened', type: 'info' })}>
                    Open
                  </Menu.Item>
                  <Menu.Item value="copy" onSelect={() => toaster.create({ title: 'ID copied', type: 'success' })}>
                    Copy ID
                  </Menu.Item>
                  <Menu.Separator />
                  <Menu.Item value="delete" color="fg.error" onSelect={() => toaster.create({ title: 'Deleted', type: 'error' })}>
                    Delete
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </Stack>
      </Section>

      <Section title="Links and code">
        <Text color="fg.muted">
          <Link href="#">Read the guide</Link>. Endpoint: <Code>POST /v1/models/defect-v3/predict</Code>
        </Text>
      </Section>
    </Page>
  );
}
