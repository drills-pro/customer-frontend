import type { ReactNode } from 'react';
import { Center, EmptyState } from '@chakra-ui/react';
import { Bit } from '@/brand/Bit';
import type { BitPose } from '@/brand/bit-sprites.js';

interface Props {
  pose: BitPose;
  /** Names the state, not the character. */
  label: string;
  title: string;
  body?: string;
  size?: 128 | 192 | 256;
  /** Fill the viewport; off when the screen sits inside the app shell. */
  page?: boolean;
  children?: ReactNode;
}

/** One Bit with a title, a line of context and actions: empty lists, 404, errors, success. */
export function StateScreen({ pose, label, title, body, size = 128, page, children }: Props) {
  const state = (
    <EmptyState.Root size="lg" data-testid="state-screen" data-pose={pose}>
      <EmptyState.Content>
        <EmptyState.Indicator>
          <Bit pose={pose} size={size} label={label} />
        </EmptyState.Indicator>
        <EmptyState.Title textStyle="h2">{title}</EmptyState.Title>
        {body && <EmptyState.Description textAlign="center">{body}</EmptyState.Description>}
        {children}
      </EmptyState.Content>
    </EmptyState.Root>
  );
  return page ? (
    <Center minH="100vh" p="4">
      {state}
    </Center>
  ) : (
    state
  );
}
