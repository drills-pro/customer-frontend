import type * as React from 'react';
import { EmptyState, VStack } from '@chakra-ui/react';
import type { EmptyStateRootProps } from '@chakra-ui/react';

/**
 * The "nothing here yet" state: an icon, a title, a line of explanation and,
 * as children, the actions that fix it.
 */
export function EmptyNotice({
  icon,
  title,
  description,
  children,
  ...props
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
} & Omit<EmptyStateRootProps, 'title'>) {
  return (
    <EmptyState.Root size="sm" py="8" {...props}>
      <EmptyState.Content gap="3">
        {icon && (
          <EmptyState.Indicator boxSize="8" rounded="l2" bg="bg.muted" color="fg" css={{ '& svg': { boxSize: '4' } }}>
            {icon}
          </EmptyState.Indicator>
        )}
        <VStack gap="1" textAlign="center" maxW="sm">
          <EmptyState.Title textStyle="body-sm" fontWeight="medium">
            {title}
          </EmptyState.Title>
          {description && <EmptyState.Description textStyle="body-sm">{description}</EmptyState.Description>}
        </VStack>
        {children}
      </EmptyState.Content>
    </EmptyState.Root>
  );
}
