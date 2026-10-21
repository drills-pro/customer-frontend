import { Badge, Box } from '@chakra-ui/react';
import type { BadgeProps } from '@chakra-ui/react';

/** What a status means, independent of the palette that shows it. */
export type Tone = 'success' | 'warning' | 'info' | 'neutral' | 'error' | 'accent';

const palettes: Record<Tone, string> = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  neutral: 'gray',
  error: 'danger',
  accent: 'brand',
};

/**
 * A status badge. `dot` adds the glyph that keeps the status readable without
 * color; `pulse` animates it for something in progress.
 */
export function ToneBadge({
  tone,
  dot = false,
  pulse = false,
  children,
  ...props
}: {
  tone: Tone;
  dot?: boolean;
  pulse?: boolean;
} & BadgeProps) {
  return (
    <Badge colorPalette={palettes[tone]} variant="subtle" gap="1.5" {...props}>
      {dot && (
        <Box
          as="span"
          aria-hidden="true"
          boxSize="1.5"
          rounded="full"
          bg="currentColor"
          animation={pulse ? 'pulse 2s ease-in-out infinite' : undefined}
        />
      )}
      {children}
    </Badge>
  );
}
