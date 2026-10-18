import { Checkbox, CheckboxCard, RadioCard, RadioGroup, SegmentGroup, Stack, Switch } from '@chakra-ui/react';
import { useState } from 'react';
import { Page, Section } from '../parts';

const exportFormats = [
  { label: 'COCO JSON', value: 'coco', description: 'Works with most training code.' },
  { label: 'YOLO text', value: 'yolo', description: 'One file per image.' },
  { label: 'Pascal VOC', value: 'voc', description: 'XML boxes.' },
];

export function Selection() {
  const [view, setView] = useState('grid');
  return (
    <Page title="Selection" lead="Pick one, pick many, or switch something on. Selected states use the orange fill with an outline.">
      <Section title="Checkboxes">
        <Stack gap="3">
          <Checkbox.Root defaultChecked>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Upload images</Checkbox.Label>
          </Checkbox.Root>
          <Checkbox.Root>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>See confidence scores</Checkbox.Label>
          </Checkbox.Root>
          <Checkbox.Root checked="indeterminate">
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>All export formats</Checkbox.Label>
          </Checkbox.Root>
          <Checkbox.Root disabled>
            <Checkbox.HiddenInput />
            <Checkbox.Control />
            <Checkbox.Label>Disabled</Checkbox.Label>
          </Checkbox.Root>
        </Stack>
      </Section>

      <Section title="Radios">
        <RadioGroup.Root defaultValue="medium">
          <Stack gap="3">
            {['Small', 'Medium', 'Large'].map((s) => (
              <RadioGroup.Item key={s} value={s.toLowerCase()}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator />
                <RadioGroup.ItemText>{s}</RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </Stack>
        </RadioGroup.Root>
      </Section>

      <Section title="Switches">
        <Stack gap="3">
          <Switch.Root defaultChecked>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Live endpoint</Switch.Label>
          </Switch.Root>
          <Switch.Root>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Save customer uploads</Switch.Label>
          </Switch.Root>
          <Switch.Root disabled>
            <Switch.HiddenInput />
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
            <Switch.Label>Disabled</Switch.Label>
          </Switch.Root>
        </Stack>
      </Section>

      <Section title="Segmented control">
        <SegmentGroup.Root value={view} onValueChange={(e) => setView(e.value ?? 'grid')}>
          <SegmentGroup.Indicator />
          <SegmentGroup.Items
            items={[
              { value: 'grid', label: 'Grid' },
              { value: 'list', label: 'List' },
              { value: 'boxes', label: 'Boxes' },
            ]}
          />
        </SegmentGroup.Root>
      </Section>

      <Section title="Radio cards">
        <RadioCard.Root defaultValue="coco">
          <RadioCard.Label>Export format</RadioCard.Label>
          <Stack gap="2">
            {exportFormats.map((e) => (
              <RadioCard.Item key={e.value} value={e.value}>
                <RadioCard.ItemHiddenInput />
                <RadioCard.ItemControl>
                  <RadioCard.ItemContent>
                    <RadioCard.ItemText>{e.label}</RadioCard.ItemText>
                    <RadioCard.ItemDescription>{e.description}</RadioCard.ItemDescription>
                  </RadioCard.ItemContent>
                  <RadioCard.ItemIndicator />
                </RadioCard.ItemControl>
              </RadioCard.Item>
            ))}
          </Stack>
        </RadioCard.Root>
      </Section>

      <Section title="Checkbox card">
        <CheckboxCard.Root defaultChecked>
          <CheckboxCard.HiddenInput />
          <CheckboxCard.Control>
            <CheckboxCard.Content>
              <CheckboxCard.Label>Email me when training finishes</CheckboxCard.Label>
              <CheckboxCard.Description>Usually 10 to 20 minutes.</CheckboxCard.Description>
            </CheckboxCard.Content>
            <CheckboxCard.Indicator />
          </CheckboxCard.Control>
        </CheckboxCard.Root>
      </Section>
    </Page>
  );
}
