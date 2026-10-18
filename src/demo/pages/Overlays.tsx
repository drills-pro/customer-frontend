import { Button, CloseButton, Dialog, Drawer, HoverCard, HStack, Portal, Text, Link, Popover } from '@chakra-ui/react';
import { Page, Section, q } from '../parts';

export function Overlays() {
  return (
    <Page title="Overlays" lead="Panels carry a 2px border and a hard offset shadow, never a blur.">
      <Section title="Dialog">
        <Dialog.Root defaultOpen={q.get('open') === 'dialog'}>
          <Dialog.Trigger asChild>
            <Button variant="solid">Deploy</Button>
          </Dialog.Trigger>
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content>
                <Dialog.Header>
                  <Dialog.Title>Deploy Defect detector v3?</Dialog.Title>
                </Dialog.Header>
                <Dialog.Body>
                  <Text>Your endpoint goes live in about a minute. Inference is billed per compute unit.</Text>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <Button>Cancel</Button>
                  </Dialog.ActionTrigger>
                  <Button variant="solid">Deploy</Button>
                </Dialog.Footer>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Dialog.CloseTrigger>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      </Section>

      <Section title="Drawer">
        <Drawer.Root>
          <Drawer.Trigger asChild>
            <Button>Run details</Button>
          </Drawer.Trigger>
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content>
                <Drawer.Header>
                  <Drawer.Title>run-0042</Drawer.Title>
                </Drawer.Header>
                <Drawer.Body>
                  <Text>Trained on 128 images in 3 classes. Finished in 14 minutes.</Text>
                </Drawer.Body>
                <Drawer.Footer>
                  <Drawer.ActionTrigger asChild>
                    <Button>Close</Button>
                  </Drawer.ActionTrigger>
                  <Button variant="solid">Deploy this run</Button>
                </Drawer.Footer>
                <Drawer.CloseTrigger asChild>
                  <CloseButton size="sm" />
                </Drawer.CloseTrigger>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </Section>

      <Section title="Popover and hover card">
        <HStack gap="3" wrap="wrap">
          <Popover.Root>
            <Popover.Trigger asChild>
              <Button>What is mAP?</Button>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content>
                  <Popover.Arrow>
                    <Popover.ArrowTip />
                  </Popover.Arrow>
                  <Popover.Body>
                    <Popover.Title>Accuracy score</Popover.Title>
                    <Text>How often the boxes are right, from 0 to 1. Higher is better.</Text>
                  </Popover.Body>
                  <Popover.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Popover.CloseTrigger>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
          <HoverCard.Root openDelay={200}>
            <HoverCard.Trigger asChild>
              <Link href="#">run-0042</Link>
            </HoverCard.Trigger>
            <Portal>
              <HoverCard.Positioner>
                <HoverCard.Content>
                  <Text fontWeight="semibold">run-0042</Text>
                  <Text color="fg.muted">mAP 0.91 · 128 images</Text>
                </HoverCard.Content>
              </HoverCard.Positioner>
            </Portal>
          </HoverCard.Root>
        </HStack>
      </Section>
    </Page>
  );
}
