/**
 * Partial overrides merged onto Chakra's default recipes by createSystem(defaultConfig, config).
 * Only the drills.pro differences live here; everything else (sizes, a11y states, parts) stays Chakra's.
 */
import { defineRecipe, defineSlotRecipe } from '@chakra-ui/react';

const ring = { focusVisibleRing: 'outside' } as const;
const pressed = { transform: 'translateY(3px)', boxShadow: 'pressed' } as const;

// Controls that hold text: a sunken slot with a 2px control border.
const field = {
  bg: 'control-bg',
  borderWidth: '2px',
  borderColor: 'control-border',
  boxShadow: 'pressed',
  ...ring,
  _hover: { borderColor: 'fg' },
  _focusVisible: { borderColor: 'fg' },
  _invalid: { borderColor: 'border.error', _hover: { borderColor: 'border.error' } },
} as const;

// Controls that open something: the button ledge instead of the slot.
const trigger = { ...field, boxShadow: 'raised' } as const;

// Popover panels: 2px border and the hard pop shadow.
const panel = { borderWidth: '2px', borderColor: 'control-border', boxShadow: 'pop' } as const;

export const recipes = {
  button: defineRecipe({
    base: { borderWidth: '2px', fontWeight: 'semibold', ...ring, _active: pressed },
    variants: {
      variant: {
        solid: {
          bg: 'colorPalette.solid',
          color: 'colorPalette.contrast',
          borderColor: 'outline',
          boxShadow: 'raised',
          _hover: { bg: 'colorPalette.solid/90' },
        },
        outline: {
          bg: 'control-bg',
          color: 'fg',
          borderColor: 'control-border',
          boxShadow: 'raised',
          _hover: { bg: 'bg.subtle', borderColor: 'fg' },
          _expanded: { bg: 'bg.subtle' },
        },
        subtle: { bg: 'colorPalette.subtle', color: 'fg', borderColor: 'transparent', _hover: { bg: 'colorPalette.muted' } },
        surface: { bg: 'colorPalette.subtle', color: 'fg', borderColor: 'colorPalette.border', boxShadow: 'raised' },
        ghost: {
          color: 'colorPalette.fg',
          borderColor: 'transparent',
          _hover: { bg: 'bg.subtle' },
          _active: { transform: 'none', boxShadow: 'none' },
        },
        plain: { color: 'colorPalette.fg', borderColor: 'transparent', _active: { transform: 'none', boxShadow: 'none' } },
      },
    },
    // One primary per screen: the default is the secondary (outline) button; ask for variant="solid" explicitly.
    defaultVariants: { variant: 'outline' },
  }),

  input: defineRecipe({ variants: { variant: { outline: field, subtle: { ...field, bg: 'bg.subtle' } } } }),
  textarea: defineRecipe({ variants: { variant: { outline: field, subtle: { ...field, bg: 'bg.subtle' } } } }),

  badge: defineRecipe({ base: { borderRadius: 'full', fontWeight: 'medium', letterSpacing: '0.02em' } }),
  link: defineRecipe({ base: { fontWeight: 'medium', ...ring } }),
  code: defineRecipe({ base: { fontFamily: 'mono', borderRadius: 'l1', colorPalette: 'gray' } }),

  checkmark: defineRecipe({
    base: { borderWidth: '2px', borderRadius: 'l1' },
    variants: {
      variant: {
        solid: {
          borderColor: 'control-border',
          bg: 'control-bg',
          '&:is([data-state=checked], [data-state=indeterminate])': {
            bg: 'colorPalette.solid',
            color: 'colorPalette.contrast',
            borderColor: 'outline',
          },
        },
      },
    },
  }),
  radiomark: defineRecipe({
    base: { borderWidth: '2px', _focusVisible: { outline: '3px solid', outlineColor: 'focus', outlineOffset: '2px' } },
    variants: {
      variant: {
        solid: {
          borderColor: 'control-border',
          bg: 'control-bg',
          _checked: { bg: 'colorPalette.solid', color: 'colorPalette.contrast', borderColor: 'outline' },
        },
      },
    },
  }),
};

export const slotRecipes = {
  checkbox: defineSlotRecipe({
    slots: ['root', 'label', 'control', 'indicator', 'group'],
    base: { control: { borderWidth: '2px', borderRadius: 'l1', _hover: { borderColor: 'fg' } }, label: { fontWeight: 'medium' } },
    variants: {
      variant: {
        solid: {
          control: {
            borderColor: 'control-border',
            bg: 'control-bg',
            '&:is([data-state=checked], [data-state=indeterminate])': {
              bg: 'colorPalette.solid',
              color: 'colorPalette.contrast',
              borderColor: 'outline',
            },
          },
        },
      },
    },
  }),
  checkboxCard: defineSlotRecipe({
    slots: ['root', 'control', 'label', 'description', 'addon', 'indicator', 'content'],
    base: { root: { borderWidth: '2px', borderRadius: 'l2', _checked: { bg: 'selected-bg', borderColor: 'selected-edge' } } },
  }),
  radioGroup: defineSlotRecipe({
    slots: ['root', 'label', 'item', 'itemText', 'itemControl', 'indicator', 'itemAddon', 'itemIndicator'],
    base: {
      itemControl: { borderWidth: '2px', _focusVisible: { outline: '3px solid', outlineColor: 'focus', outlineOffset: '2px' } },
      itemText: { fontWeight: 'medium' },
    },
    variants: {
      variant: {
        solid: {
          itemControl: {
            borderColor: 'control-border',
            bg: 'control-bg',
            _hover: { borderColor: 'fg' },
            _checked: { bg: 'colorPalette.solid', color: 'colorPalette.contrast', borderColor: 'outline' },
          },
        },
      },
    },
  }),
  radioCard: defineSlotRecipe({
    slots: [
      'root',
      'item',
      'label',
      'itemText',
      'itemDescription',
      'itemControl',
      'itemContent',
      'itemIndicator',
      'itemAddon',
      'indicator',
    ],
    base: { item: { borderWidth: '2px', borderRadius: 'l2', _checked: { bg: 'selected-bg', borderColor: 'selected-edge' } } },
  }),
  switch: defineSlotRecipe({
    slots: ['root', 'label', 'control', 'thumb', 'indicator'],
    base: {
      control: { borderRadius: 'l1', borderWidth: '2px', _invalid: { outline: '3px solid', outlineColor: 'border.error' } },
      // Square thumb that jumps one step (pixel-timing) instead of sliding.
      thumb: { borderRadius: '0', transitionTimingFunction: 'steps(1, end)', transitionDuration: 'pixel' },
      label: { fontWeight: 'medium' },
    },
    variants: {
      variant: {
        solid: {
          control: {
            borderRadius: 'l1',
            bg: 'control-bg',
            borderColor: 'control-border',
            ...ring,
            _hover: { borderColor: 'fg' },
            _checked: { bg: 'colorPalette.solid', borderColor: 'outline' },
          },
          thumb: {
            bg: 'control-border',
            boxShadow: 'none',
            scale: '0.8',
            width: 'calc(var(--switch-height) - 4px)',
            height: 'calc(var(--switch-height) - 4px)',
            _checked: { bg: 'colorPalette.contrast' },
          },
        },
      },
      size: {
        sm: { root: { '--switch-width': '36px', '--switch-height': '20px' } },
        md: { root: { '--switch-width': '44px', '--switch-height': '24px' } },
        lg: { root: { '--switch-width': '52px', '--switch-height': '28px' } },
      },
    },
  }),
  tabs: defineSlotRecipe({
    slots: ['root', 'trigger', 'list', 'content', 'contentGroup', 'indicator'],
    base: { trigger: { _focusVisible: { outline: '3px solid', outlineColor: 'focus', outlineOffset: '2px' } } },
    variants: {
      variant: {
        line: {
          list: { borderColor: 'border', _horizontal: { borderBottomWidth: '2px' } },
          trigger: {
            color: 'fg.muted',
            borderTopRadius: 'l2',
            _hover: { bg: 'bg.subtle', color: 'fg' },
            _selected: {
              color: 'fg',
              bg: 'selected-bg',
              fontWeight: 'semibold',
              _horizontal: { '--indicator-thickness': '4px', '--indicator-offset-y': '-2px', '--indicator-color': 'colors.selected-edge' },
            },
          },
        },
      },
    },
  }),
  segmentGroup: defineSlotRecipe({
    slots: ['root', 'label', 'item', 'itemText', 'itemControl', 'indicator'],
    base: {
      root: {
        '--segment-indicator-bg': 'colors.selected-bg',
        '--segment-indicator-shadow': 'inset 0 0 0 2px var(--chakra-colors-selected-edge)',
        bg: 'bg.subtle',
        borderWidth: '2px',
        borderColor: 'control-border',
        boxShadow: 'pressed',
        p: '0.5',
      },
      item: { color: 'fg.muted', fontWeight: 'medium', _checked: { color: 'fg', fontWeight: 'semibold' } },
    },
  }),
  nativeSelect: defineSlotRecipe({
    slots: ['root', 'field', 'indicator'],
    variants: {
      variant: { outline: { field: { ...trigger, _expanded: { borderColor: 'fg' } } }, subtle: { field: { ...trigger, bg: 'bg.subtle' } } },
    },
  }),
  select: defineSlotRecipe({
    slots: [
      'label',
      'positioner',
      'trigger',
      'indicator',
      'clearTrigger',
      'item',
      'itemText',
      'itemIndicator',
      'itemGroup',
      'itemGroupLabel',
      'list',
      'content',
      'root',
      'control',
      'valueText',
      'indicatorGroup',
    ],
    base: {
      content: panel,
      item: {
        _highlighted: { bg: 'bg.subtle' },
        _checked: { bg: 'selected-bg', fontWeight: 'semibold', boxShadow: 'inset 4px 0 0 0 var(--chakra-colors-selected-edge)' },
      },
      itemIndicator: { color: 'brand-text' },
    },
    variants: {
      variant: {
        outline: { trigger: { ...trigger, _expanded: { borderColor: 'fg' } } },
        subtle: { trigger: { ...trigger, bg: 'bg.subtle' } },
      },
    },
  }),
  combobox: defineSlotRecipe({
    slots: [
      'root',
      'clearTrigger',
      'content',
      'control',
      'input',
      'item',
      'itemGroup',
      'itemGroupLabel',
      'itemIndicator',
      'itemText',
      'label',
      'list',
      'positioner',
      'trigger',
      'empty',
      'indicatorGroup',
    ],
    base: { content: panel, item: { _highlighted: { bg: 'bg.subtle' } }, itemIndicator: { color: 'brand-text' } },
  }),
  menu: defineSlotRecipe({
    slots: [
      'arrow',
      'arrowTip',
      'content',
      'contextTrigger',
      'indicator',
      'item',
      'itemGroup',
      'itemGroupLabel',
      'itemIndicator',
      'itemText',
      'positioner',
      'separator',
      'trigger',
      'triggerItem',
      'itemCommand',
    ],
    base: { content: panel, item: { _highlighted: { bg: 'bg.subtle' } } },
  }),
  popover: defineSlotRecipe({
    slots: [
      'arrow',
      'arrowTip',
      'anchor',
      'trigger',
      'indicator',
      'positioner',
      'content',
      'title',
      'description',
      'closeTrigger',
      'header',
      'body',
      'footer',
    ],
    base: { content: panel },
  }),
  dialog: defineSlotRecipe({
    slots: ['trigger', 'backdrop', 'positioner', 'content', 'title', 'description', 'closeTrigger', 'header', 'body', 'footer'],
    base: { content: { ...panel, borderRadius: 'l3' }, title: { textStyle: 'h3' }, backdrop: { bg: 'black/50' } },
  }),
  drawer: defineSlotRecipe({
    slots: ['trigger', 'backdrop', 'positioner', 'content', 'title', 'description', 'closeTrigger', 'header', 'body', 'footer'],
    base: { content: { borderColor: 'control-border', boxShadow: 'pop' }, title: { textStyle: 'h3' } },
  }),
  tooltip: defineSlotRecipe({
    slots: ['trigger', 'arrow', 'arrowTip', 'positioner', 'content'],
    base: { content: { '--tooltip-bg': 'colors.night', color: 'on-night', borderRadius: 'l1', boxShadow: 'none', fontWeight: 'medium' } },
  }),
  card: defineSlotRecipe({
    slots: ['root', 'header', 'body', 'footer', 'title', 'description'],
    base: { title: { textStyle: 'h3' }, description: { color: 'fg.muted' } },
    variants: {
      variant: {
        outline: { root: { bg: 'surface-raised', borderWidth: '1px', borderColor: 'border' } },
        elevated: { root: { bg: 'surface-raised', borderWidth: '1px', borderColor: 'border', boxShadow: 'raised' } },
        subtle: { root: { bg: 'bg.subtle' } },
      },
    },
  }),
  field: defineSlotRecipe({
    slots: ['root', 'errorText', 'helperText', 'input', 'label', 'select', 'textarea', 'requiredIndicator'],
    base: {
      label: { textStyle: 'body-sm', fontWeight: 'medium' },
      helperText: { color: 'fg.muted', textStyle: 'body-sm' },
      errorText: { color: 'fg.error', textStyle: 'body-sm' },
    },
  }),
  alert: defineSlotRecipe({
    slots: ['title', 'description', 'root', 'indicator', 'content'],
    base: { root: { borderRadius: 'l2', borderWidth: '2px', borderColor: 'colorPalette.border' }, title: { fontWeight: 'semibold' } },
  }),
  toast: defineSlotRecipe({
    slots: ['root', 'title', 'description', 'indicator', 'closeTrigger', 'actionTrigger'],
    base: { root: { borderWidth: '2px', borderColor: 'outline', boxShadow: 'pop', borderRadius: 'l2' } },
  }),
  table: defineSlotRecipe({
    slots: ['root', 'header', 'body', 'row', 'columnHeader', 'cell', 'footer', 'caption'],
    base: { columnHeader: { fontWeight: 'semibold', color: 'fg.muted', textStyle: 'body-sm' }, row: { _selected: { bg: 'selected-bg' } } },
  }),
  progress: defineSlotRecipe({
    slots: ['root', 'label', 'track', 'range', 'valueText', 'view', 'circle', 'circleTrack', 'circleRange'],
    base: { track: { borderRadius: 'l1' }, range: { borderRadius: '0' } },
  }),
};
