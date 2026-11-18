import { Portal, Select, VisuallyHidden, createListCollection } from '@chakra-ui/react';
import { useMemo } from 'react';

interface Props {
  items: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Keep the label for screen readers only. */
  hideLabel?: boolean;
  size?: 'sm' | 'md';
  width?: string;
  disabled?: boolean;
}

/** The themed replacement for a native select: one value, a list of options. */
export function SimpleSelect({ items, value, onChange, label, hideLabel, size, width, disabled }: Props) {
  const collection = useMemo(() => createListCollection({ items }), [items]);
  const text = <Select.Label>{label}</Select.Label>;
  return (
    <Select.Root
      collection={collection}
      value={[value]}
      onValueChange={(e) => e.value[0] && onChange(e.value[0])}
      size={size}
      width={width}
      disabled={disabled}
      positioning={{ sameWidth: true }}
    >
      <Select.HiddenSelect />
      {hideLabel ? <VisuallyHidden asChild>{text}</VisuallyHidden> : text}
      <Select.Control>
        <Select.Trigger>
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((i) => (
              <Select.Item item={i} key={i.value}>
                <Select.ItemText>{i.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}
