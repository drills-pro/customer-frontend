import {
  Alert, Badge, Box, Button, Card, Checkbox, CloseButton, Code, Container, Dialog, Field, Flex, Grid, Heading, HStack, IconButton, Input, Link,
  Menu, NativeSelect, Portal, Progress, RadioGroup, SegmentGroup, Select, Stack, Switch, Table, Tabs, Text, Textarea, Tooltip, createListCollection,
} from '@chakra-ui/react';
import { useState } from 'react';
import { AppIcon, Bit, BitAnimated, Wordmark } from '../brand/Bit';
import { ColorModeButton } from '../components/color-mode';
import { toaster } from '../components/toaster';
import { TENANTS } from './tenants';

const models = createListCollection({ items: [
  { label: 'Defect detector v3', value: 'v3', meta: 'mAP 0.91' },
  { label: 'Defect detector v2', value: 'v2', meta: 'mAP 0.84' },
  { label: 'Shelf counter v1', value: 'shelf', meta: 'mAP 0.77' },
  { label: 'Pallet finder (draft)', value: 'pallet', meta: 'not trained', disabled: true },
] });
const q = new URLSearchParams(location.search);
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Box as="section"><Text textStyle="label" color="fg.muted" textTransform="uppercase" mb="3">{title}</Text>{children}</Box>
);
const Check = () => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" /></svg>;
const Tri = () => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden="true"><path d="M8 2.5l6 11H2z" /><path d="M8 7v3" /></svg>;
const X = () => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true"><circle cx="8" cy="8" r="6" /><path d="M5.5 5.5l5 5M10.5 5.5l-5 5" /></svg>;

export function App({ tenantName, onTenant }: { tenantName: string; onTenant: (n: string) => void }) {
  return (
    <Container maxW="6xl" py="8">
      <Flex as="header" align="center" justify="space-between" gap="4" wrap="wrap" mb="8">
        <HStack gap="3"><AppIcon size={64} /><Wordmark scale={3} /></HStack>
        <HStack gap="3">
          <NativeSelect.Root size="sm" width="44">
            <NativeSelect.Field aria-label="Tenant" value={tenantName} onChange={(e) => onTenant(e.currentTarget.value)}>
              {Object.keys(TENANTS).map((n) => <option key={n} value={n}>{n}</option>)}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <ColorModeButton size="sm" />
        </HStack>
      </Flex>

      <Showcase />
    </Container>
  );
}

/** Every component on one page; the app dashboard embeds it. */
export function Showcase() {
  const [view, setView] = useState('grid');
  return (
      <Grid templateColumns={{ base: '1fr', lg: '1.2fr 1fr' }} gap="10">
        <Stack gap="8">
          <Box>
            <Text textStyle="display">Teach it with examples</Text>
            <Heading as="h1" textStyle="h1" mt="2">Datasets</Heading>
            <Text color="fg.muted" mt="2">Upload photos, draw boxes, and press train. <Link href="#">Read the guide</Link>. Endpoint: <Code>POST /v1/models/defect-v3/predict</Code></Text>
          </Box>

          <Section title="Buttons">
            <HStack gap="3" wrap="wrap">
              <Button variant="solid" onClick={() => toaster.create({ title: 'Training started', description: 'We will email you when it finishes.', type: 'success' })}>Start training</Button>
              <Button>Add images</Button>
              <Button variant="ghost">View logs</Button>
              <Button variant="solid" colorPalette="danger">Delete dataset</Button>
              <Button variant="solid" disabled>Disabled</Button>
              <Button variant="solid" loading>Saving</Button>
              <Button variant="solid" colorPalette="secondary">Test model</Button>
            </HStack>
          </Section>

          <Section title="Inputs">
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="5">
              <Field.Root><Field.Label>Dataset name</Field.Label><Input placeholder="e.g. conveyor-defects" /><Field.HelperText>Letters, numbers and dashes.</Field.HelperText></Field.Root>
              <Field.Root invalid><Field.Label>Dataset name</Field.Label><Input defaultValue="conveyor defects" /><Field.ErrorText><X /> Use dashes, not spaces.</Field.ErrorText></Field.Root>
              <Field.Root><Field.Label>ชื่อชุดข้อมูล</Field.Label><Input placeholder="เช่น ตรวจจับรอยแตกบนสายพาน" /><Field.HelperText>ใช้ตัวอักษร ตัวเลข และขีดกลางได้</Field.HelperText></Field.Root>
              <Field.Root disabled><Field.Label>Model version</Field.Label><Input defaultValue="v3 (training)" /><Field.HelperText>Locked while a run is training.</Field.HelperText></Field.Root>
              <Field.Root>
                <Field.Label>Base model</Field.Label>
                <NativeSelect.Root><NativeSelect.Field defaultValue="medium"><option value="small">Small, fastest</option><option value="medium">Medium, balanced</option><option value="large">Large, most accurate</option></NativeSelect.Field><NativeSelect.Indicator /></NativeSelect.Root>
              </Field.Root>
              <Select.Root collection={models} defaultValue={['v3']} defaultOpen={q.get('open') === 'select'} positioning={{ sameWidth: true }}>
                <Select.HiddenSelect />
                <Select.Label>Deploy model</Select.Label>
                <Select.Control><Select.Trigger><Select.ValueText placeholder="Choose a model" /></Select.Trigger><Select.IndicatorGroup><Select.Indicator /></Select.IndicatorGroup></Select.Control>
                <Portal><Select.Positioner><Select.Content>
                  {models.items.map((m) => (
                    <Select.Item item={m} key={m.value}><Select.ItemText>{m.label}</Select.ItemText><Text as="span" fontFamily="mono" textStyle="mono-sm" color="fg.muted" ms="auto">{m.meta}</Text><Select.ItemIndicator /></Select.Item>
                  ))}
                </Select.Content></Select.Positioner></Portal>
              </Select.Root>
              <Field.Root gridColumn={{ md: 'span 2' }}><Field.Label>Notes</Field.Label><Textarea placeholder="What should the model look for?" /></Field.Root>
            </Grid>
          </Section>

          <Section title="Tabs and segmented control">
            <Tabs.Root defaultValue="images">
              <Tabs.List>
                <Tabs.Trigger value="images">Images <Badge size="sm" variant="outline" colorPalette="gray">128</Badge></Tabs.Trigger>
                <Tabs.Trigger value="labels">Labels <Badge size="sm" variant="outline" colorPalette="gray">342</Badge></Tabs.Trigger>
                <Tabs.Trigger value="runs">Runs</Tabs.Trigger>
                <Tabs.Trigger value="settings" disabled>Settings</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="images">128 images in 3 classes.</Tabs.Content>
              <Tabs.Content value="labels">342 boxes across 3 classes.</Tabs.Content>
              <Tabs.Content value="runs">4 runs. Best: mAP 0.91.</Tabs.Content>
            </Tabs.Root>
            <SegmentGroup.Root mt="4" value={view} onValueChange={(e) => setView(e.value ?? 'grid')}>
              <SegmentGroup.Indicator />
              <SegmentGroup.Items items={[{ value: 'grid', label: 'Grid' }, { value: 'list', label: 'List' }, { value: 'boxes', label: 'Boxes' }]} />
            </SegmentGroup.Root>
          </Section>

          <Section title="Choices">
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="6">
              <Stack gap="3">
                <Checkbox.Root defaultChecked><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label>Upload images</Checkbox.Label></Checkbox.Root>
                <Checkbox.Root><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label>See confidence scores</Checkbox.Label></Checkbox.Root>
                <Checkbox.Root checked="indeterminate"><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label>All export formats</Checkbox.Label></Checkbox.Root>
                <Checkbox.Root disabled><Checkbox.HiddenInput /><Checkbox.Control /><Checkbox.Label>Disabled</Checkbox.Label></Checkbox.Root>
              </Stack>
              <RadioGroup.Root defaultValue="medium">
                <Stack gap="3">
                  {['Small', 'Medium', 'Large'].map((s) => (
                    <RadioGroup.Item key={s} value={s.toLowerCase()}><RadioGroup.ItemHiddenInput /><RadioGroup.ItemIndicator /><RadioGroup.ItemText>{s}</RadioGroup.ItemText></RadioGroup.Item>
                  ))}
                </Stack>
              </RadioGroup.Root>
              <Stack gap="3">
                <Switch.Root defaultChecked><Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control><Switch.Label>Live endpoint</Switch.Label></Switch.Root>
                <Switch.Root><Switch.HiddenInput /><Switch.Control><Switch.Thumb /></Switch.Control><Switch.Label>Save customer uploads</Switch.Label></Switch.Root>
              </Stack>
            </Grid>
          </Section>
        </Stack>

        <Stack gap="8">
          <Card.Root variant="elevated">
            <Card.Body>
              <HStack gap="5" align="center">
                <BitAnimated size={128} timeline={q.get('still') ? 'morph' : 'morph'} paused={!!q.get('still')} />
                <Stack gap="2">
                  <Card.Title>Defect detector v3</Card.Title>
                  <Card.Description>Trained on 128 images, 3 classes.</Card.Description>
                  <HStack gap="2" wrap="wrap">
                    <Badge colorPalette="success" variant="subtle"><Check />Live</Badge>
                    <Badge colorPalette="warning" variant="subtle"><Tri />Low credits</Badge>
                    <Badge colorPalette="danger" variant="subtle"><X />Failed</Badge>
                  </HStack>
                </Stack>
              </HStack>
            </Card.Body>
            <Card.Footer gap="3">
              <Dialog.Root defaultOpen={q.get('open') === 'dialog'}>
                <Dialog.Trigger asChild><Button variant="solid">Deploy</Button></Dialog.Trigger>
                <Portal><Dialog.Backdrop /><Dialog.Positioner><Dialog.Content>
                  <Dialog.Header><Dialog.Title>Deploy Defect detector v3?</Dialog.Title></Dialog.Header>
                  <Dialog.Body><Text>Your endpoint goes live in about a minute. Inference is billed per compute unit.</Text></Dialog.Body>
                  <Dialog.Footer><Dialog.ActionTrigger asChild><Button>Cancel</Button></Dialog.ActionTrigger><Button variant="solid">Deploy</Button></Dialog.Footer>
                  <Dialog.CloseTrigger asChild><CloseButton size="sm" /></Dialog.CloseTrigger>
                </Dialog.Content></Dialog.Positioner></Portal>
              </Dialog.Root>
              <Menu.Root defaultOpen={q.get('open') === 'menu'}>
                <Menu.Trigger asChild><Button>More</Button></Menu.Trigger>
                <Portal><Menu.Positioner><Menu.Content>
                  <Menu.Item value="rename">Rename</Menu.Item><Menu.Item value="duplicate">Duplicate</Menu.Item><Menu.Separator /><Menu.Item value="delete" color="fg.error">Delete</Menu.Item>
                </Menu.Content></Menu.Positioner></Portal>
              </Menu.Root>
              <Tooltip.Root openDelay={200} defaultOpen={q.get('open') === 'tooltip'}>
                <Tooltip.Trigger asChild><IconButton aria-label="Copy endpoint URL" size="md"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><rect x="5" y="5" width="8" height="8" rx="1" /><path d="M3 11V3h8" /></svg></IconButton></Tooltip.Trigger>
                <Portal><Tooltip.Positioner><Tooltip.Content>Copy endpoint URL</Tooltip.Content></Tooltip.Positioner></Portal>
              </Tooltip.Root>
            </Card.Footer>
          </Card.Root>

          <Section title="Training">
            <Progress.Root value={62} colorPalette="brand"><HStack justify="space-between" mb="2"><Progress.Label>Epoch 31 of 50</Progress.Label><Progress.ValueText /></HStack><Progress.Track><Progress.Range /></Progress.Track></Progress.Root>
          </Section>

          <Section title="Alerts">
            <Stack gap="3">
              <Alert.Root status="warning" colorPalette="warning"><Alert.Indicator /><Alert.Content><Alert.Title>Low credits</Alert.Title><Alert.Description>12 GPU-minutes left this month.</Alert.Description></Alert.Content></Alert.Root>
              <Alert.Root status="error" colorPalette="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Training stopped</Alert.Title><Alert.Description>3 images could not be read. Remove them or re-upload.</Alert.Description></Alert.Content></Alert.Root>
            </Stack>
          </Section>

          <Section title="Table">
            <Table.Root size="sm" variant="outline">
              <Table.Header><Table.Row><Table.ColumnHeader>Run</Table.ColumnHeader><Table.ColumnHeader>Status</Table.ColumnHeader><Table.ColumnHeader textAlign="end">mAP</Table.ColumnHeader></Table.Row></Table.Header>
              <Table.Body>
                <Table.Row data-selected=""><Table.Cell fontFamily="mono">run-0042</Table.Cell><Table.Cell><Badge colorPalette="success" variant="subtle"><Check />Live</Badge></Table.Cell><Table.Cell textAlign="end" fontFamily="mono">0.91</Table.Cell></Table.Row>
                <Table.Row><Table.Cell fontFamily="mono">run-0041</Table.Cell><Table.Cell><Badge colorPalette="gray" variant="subtle">Archived</Badge></Table.Cell><Table.Cell textAlign="end" fontFamily="mono">0.84</Table.Cell></Table.Row>
              </Table.Body>
            </Table.Root>
          </Section>

          <Section title="Mascot">
            <HStack gap="4" wrap="wrap" bg="night" p="4" borderRadius="l3">
              <Bit pose="detect" size={128} /><Bit pose="ship" size={128} /><BitAnimated timeline="train" size={128} paused={!!q.get('still')} />
              <Text color="on-night" textStyle="body-sm" maxW="40">Bit carries a paper rim, so it reads on any ground.</Text>
            </HStack>
          </Section>
        </Stack>
      </Grid>
  );
}
