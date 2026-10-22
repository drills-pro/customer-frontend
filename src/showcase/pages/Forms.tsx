import {
  Combobox,
  Editable,
  Field,
  FileUpload,
  Grid,
  HStack,
  Input,
  InputGroup,
  NumberInput,
  PinInput,
  Portal,
  RatingGroup,
  Select,
  Slider,
  TagsInput,
  Text,
  Textarea,
  createListCollection,
  useFilter,
  useListCollection,
} from '@chakra-ui/react';
import { useState } from 'react';
import { SimpleSelect } from '@/components/simple-select';
import { Glyph, Page, Section, X, q } from '@/showcase/parts';

const models = createListCollection({
  items: [
    { label: 'Defect detector v3', value: 'v3', meta: 'mAP 0.91' },
    { label: 'Defect detector v2', value: 'v2', meta: 'mAP 0.84' },
    { label: 'Shelf counter v1', value: 'shelf', meta: 'mAP 0.77' },
    { label: 'Pallet finder (draft)', value: 'pallet', meta: 'not trained', disabled: true },
  ],
});
const baseModels = [
  { label: 'Small, fastest', value: 'small' },
  { label: 'Medium, balanced', value: 'medium' },
  { label: 'Large, most accurate', value: 'large' },
];
const classes = ['car', 'truck', 'bus', 'bike', 'pedestrian', 'forklift'];

function ClassCombobox() {
  const { contains } = useFilter({ sensitivity: 'base' });
  const { collection, filter } = useListCollection({ initialItems: classes.map((c) => ({ label: c, value: c })), filter: contains });
  return (
    <Combobox.Root collection={collection} onInputValueChange={(e) => filter(e.inputValue)} openOnClick>
      <Combobox.Label>Label class</Combobox.Label>
      <Combobox.Control>
        <Combobox.Input placeholder="Type to search" />
        <Combobox.IndicatorGroup>
          <Combobox.ClearTrigger />
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            <Combobox.Empty>No class named that</Combobox.Empty>
            {collection.items.map((i) => (
              <Combobox.Item item={i} key={i.value}>
                {i.label}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            ))}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}

export function Forms() {
  const [base, setBase] = useState('medium');
  return (
    <Page title="Forms" lead="Text, choice and file inputs. Every control keeps its 2px border and 3px focus ring.">
      <Section title="Text inputs" wide>
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap="5">
          <Field.Root>
            <Field.Label>Dataset name</Field.Label>
            <Input placeholder="e.g. conveyor-defects" />
            <Field.HelperText>Letters, numbers and dashes.</Field.HelperText>
          </Field.Root>
          <Field.Root invalid>
            <Field.Label>Dataset name</Field.Label>
            <Input defaultValue="conveyor defects" />
            <Field.ErrorText>
              <X /> Use dashes, not spaces.
            </Field.ErrorText>
          </Field.Root>
          <Field.Root>
            <Field.Label>ชื่อชุดข้อมูล</Field.Label>
            <Input placeholder="เช่น ตรวจจับรอยแตกบนสายพาน" />
            <Field.HelperText>ใช้ตัวอักษร ตัวเลข และขีดกลางได้</Field.HelperText>
          </Field.Root>
          <Field.Root disabled>
            <Field.Label>Model version</Field.Label>
            <Input defaultValue="v3 (training)" />
            <Field.HelperText>Locked while a run is training.</Field.HelperText>
          </Field.Root>
          <Field.Root>
            <Field.Label>Search</Field.Label>
            <InputGroup startElement={<Glyph d="M7 12A5 5 0 107 2a5 5 0 000 10zM14 14l-3.5-3.5" />}>
              <Input placeholder="Find a dataset" />
            </InputGroup>
          </Field.Root>
          <Field.Root>
            <Field.Label>Endpoint</Field.Label>
            <InputGroup startAddon="https://" endAddon=".drills.pro">
              <Input placeholder="my-model" />
            </InputGroup>
          </Field.Root>
          <Field.Root gridColumn={{ md: 'span 2' }}>
            <Field.Label>Notes</Field.Label>
            <Textarea placeholder="What should the model look for?" />
          </Field.Root>
        </Grid>
      </Section>

      <Section title="Selects and search">
        <Grid gap="5">
          <SimpleSelect label="Base model" items={baseModels} value={base} onChange={setBase} />
          <Select.Root collection={models} defaultValue={['v3']} defaultOpen={q.get('open') === 'select'} positioning={{ sameWidth: true }}>
            <Select.HiddenSelect />
            <Select.Label>Deploy model</Select.Label>
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Choose a model" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {models.items.map((m) => (
                    <Select.Item item={m} key={m.value}>
                      <Select.ItemText>{m.label}</Select.ItemText>
                      <Text as="span" fontFamily="mono" textStyle="mono-sm" color="fg.muted" ms="auto">
                        {m.meta}
                      </Text>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
          <ClassCombobox />
        </Grid>
      </Section>

      <Section title="Numbers and codes">
        <Grid gap="5">
          <NumberInput.Root defaultValue="50" min={1} max={500}>
            <NumberInput.Label>Epochs</NumberInput.Label>
            <NumberInput.Control />
            <NumberInput.Input />
          </NumberInput.Root>
          <Slider.Root defaultValue={[0.5]} min={0} max={1} step={0.05}>
            <HStack justify="space-between">
              <Slider.Label>Confidence threshold</Slider.Label>
              <Slider.ValueText />
            </HStack>
            <Slider.Control>
              <Slider.Track>
                <Slider.Range />
              </Slider.Track>
              <Slider.Thumbs />
            </Slider.Control>
          </Slider.Root>
          <PinInput.Root flexDirection="column" alignItems="start" count={4} defaultValue={['4', '2']}>
            <PinInput.Label>Invite code</PinInput.Label>
            <PinInput.HiddenInput />
            <PinInput.Control>
              {[0, 1, 2, 3].map((i) => (
                <PinInput.Input key={i} index={i} />
              ))}
            </PinInput.Control>
          </PinInput.Root>
          <RatingGroup.Root flexDirection="column" alignItems="start" count={5} defaultValue={4} colorPalette="brand">
            <RatingGroup.Label>How was this prediction?</RatingGroup.Label>
            <RatingGroup.HiddenInput />
            <RatingGroup.Control />
          </RatingGroup.Root>
        </Grid>
      </Section>

      <Section title="Tags and inline edit">
        <Grid gap="5">
          <TagsInput.Root defaultValue={['car', 'truck']}>
            <TagsInput.Label>Classes</TagsInput.Label>
            <TagsInput.Control>
              <TagsInput.Items />
              <TagsInput.Input placeholder="Add a class" />
            </TagsInput.Control>
            <TagsInput.HiddenInput />
          </TagsInput.Root>
          <Editable.Root flexDirection="column" alignItems="start" defaultValue="conveyor-defects">
            <Editable.Label>Dataset name (click to edit)</Editable.Label>
            <Editable.Preview />
            <Editable.Input />
          </Editable.Root>
        </Grid>
      </Section>

      <Section title="Upload">
        <FileUpload.Root maxFiles={5} accept={['image/*']}>
          <FileUpload.HiddenInput />
          <FileUpload.Dropzone w="full">
            <FileUpload.DropzoneContent>
              <Text fontWeight="medium">Drop photos here</Text>
              <Text color="fg.muted" textStyle="body-sm">
                JPG or PNG, up to 10 MB each
              </Text>
            </FileUpload.DropzoneContent>
          </FileUpload.Dropzone>
          <FileUpload.List showSize clearable />
        </FileUpload.Root>
      </Section>
    </Page>
  );
}
