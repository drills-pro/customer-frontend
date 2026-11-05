import {
  Accordion,
  Badge,
  Breadcrumb,
  ButtonGroup,
  Collapsible,
  IconButton,
  Button,
  Pagination,
  Stack,
  Steps,
  Tabs,
  Text,
} from '@chakra-ui/react';
import { Glyph, Page, Section } from '@/showcase/parts';

const steps = ['Upload', 'Label', 'Train', 'Deploy'];
const faq = [
  { value: 'advanced', title: 'Advanced settings', body: 'Epochs, learning rate and batch size. The defaults suit most datasets.' },
  { value: 'billing', title: 'Billing', body: '100 GPU-minutes free each month, then $9 per active member.' },
];

export function Navigation() {
  return (
    <Page title="Navigation" lead="Find your place, move between steps, and open or close detail.">
      <Section title="Tabs" wide>
        <Tabs.Root defaultValue="images">
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="images">
              Images{' '}
              <Badge size="sm" variant="subtle">
                128
              </Badge>
            </Tabs.Trigger>
            <Tabs.Trigger value="labels">
              Labels{' '}
              <Badge size="sm" variant="subtle">
                342
              </Badge>
            </Tabs.Trigger>
            <Tabs.Trigger value="runs">Runs</Tabs.Trigger>
            <Tabs.Trigger value="settings" disabled>
              Settings
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="images">128 images in 3 classes.</Tabs.Content>
          <Tabs.Content value="labels">342 boxes across 3 classes.</Tabs.Content>
          <Tabs.Content value="runs">4 runs. Best: mAP 0.91.</Tabs.Content>
        </Tabs.Root>
      </Section>

      <Section title="Nested tabs" wide>
        <Tabs.Root defaultValue="versions" variant="subtle" size="sm">
          <Tabs.List>
            <Tabs.Indicator />
            <Tabs.Trigger value="versions">Versions</Tabs.Trigger>
            <Tabs.Trigger value="imports">Imports</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="versions">Second-level tabs sit under a line tab row, so they read as its children.</Tabs.Content>
          <Tabs.Content value="imports">3 imports, 1 waiting for review.</Tabs.Content>
        </Tabs.Root>
      </Section>

      <Section title="Workflow steps" wide>
        <Steps.Root defaultStep={2} count={steps.length}>
          <Steps.List>
            {steps.map((s, i) => (
              <Steps.Item key={s} index={i}>
                <Steps.Indicator />
                <Steps.Title>{s}</Steps.Title>
                <Steps.Separator />
              </Steps.Item>
            ))}
          </Steps.List>
        </Steps.Root>
      </Section>

      <Section title="Breadcrumb and pagination">
        <Stack gap="4">
          <Breadcrumb.Root>
            <Breadcrumb.List>
              <Breadcrumb.Item>
                <Breadcrumb.Link href="#">Datasets</Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.Link href="#">conveyor-defects</Breadcrumb.Link>
              </Breadcrumb.Item>
              <Breadcrumb.Separator />
              <Breadcrumb.Item>
                <Breadcrumb.CurrentLink>Images</Breadcrumb.CurrentLink>
              </Breadcrumb.Item>
            </Breadcrumb.List>
          </Breadcrumb.Root>
          <Pagination.Root count={128} pageSize={16} defaultPage={2}>
            <ButtonGroup size="sm" gap="1">
              <Pagination.PrevTrigger asChild>
                <IconButton aria-label="Previous page">
                  <Glyph d="M10 3L5 8l5 5" />
                </IconButton>
              </Pagination.PrevTrigger>
              <Pagination.Items
                render={(page) => <IconButton variant={{ base: 'outline', _selected: 'solid' }}>{page.value}</IconButton>}
              />
              <Pagination.NextTrigger asChild>
                <IconButton aria-label="Next page">
                  <Glyph d="M6 3l5 5-5 5" />
                </IconButton>
              </Pagination.NextTrigger>
            </ButtonGroup>
          </Pagination.Root>
        </Stack>
      </Section>

      <Section title="Accordion and collapsible">
        <Stack gap="4">
          <Accordion.Root collapsible defaultValue={['advanced']}>
            {faq.map((f) => (
              <Accordion.Item key={f.value} value={f.value}>
                <Accordion.ItemTrigger>
                  <Text flex="1">{f.title}</Text>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>{f.body}</Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
          <Collapsible.Root>
            <Collapsible.Trigger asChild>
              <Button variant="ghost" alignSelf="start">
                Show export options
              </Button>
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Text color="fg.muted" pt="2">
                COCO JSON, YOLO text and Pascal VOC.
              </Text>
            </Collapsible.Content>
          </Collapsible.Root>
        </Stack>
      </Section>
    </Page>
  );
}
