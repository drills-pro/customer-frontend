import type * as React from 'react';
import { Flex } from '@chakra-ui/react';

import { EmptyNotice } from './empty-notice';

/** A whole page for a record that does not exist, with the way back. */
export function RecordNotFound({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  /** The way back, e.g. a "Return to models" button. */
  children: React.ReactNode;
}) {
  return (
    <Flex as="main" id="dashboard-main" mx="auto" minH="60vh" w="full" maxW="xl" flex="1" align="center" p="6">
      <EmptyNotice w="full" rounded="l3" borderWidth="1px" borderColor="border" bg="surface-raised" title={title} description={description}>
        {children}
      </EmptyNotice>
    </Flex>
  );
}
