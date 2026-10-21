import { chakra, useSlotRecipe } from '@chakra-ui/react';
import type { HTMLChakraProps } from '@chakra-ui/react';

/**
 * An on/off switch drawn by the theme's switch recipe, as a `button` with
 * `role="switch"`. Chakra's own Switch keeps the role on a visually hidden
 * input, so the visible control is not the element a click or a query
 * targets. Name it with `aria-label` or a `<label htmlFor>`.
 */
export function SwitchButton({
  checked,
  onCheckedChange,
  size = 'md',
  ...props
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
} & Omit<HTMLChakraProps<'button'>, 'onChange'>) {
  const recipe = useSlotRecipe({ key: 'switch' });
  const styles = recipe({ size });
  const state = checked ? 'checked' : 'unchecked';

  return (
    <chakra.button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={state}
      css={[styles.root, styles.control]}
      flexShrink={0}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <chakra.span data-part="thumb" data-state={state} css={styles.thumb} />
    </chakra.button>
  );
}
