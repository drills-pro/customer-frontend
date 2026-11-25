import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ApiKeysTable } from '@/modules/workspaces/components/ApiKeysTable';
import { CreateKeyDialog } from '@/modules/workspaces/components/CreateKeyDialog';
import { useCan, useWorkspace } from '@/modules/workspaces/context';
import { NotFound } from '@/shared/ui/NotFound';

/** The workspace's API keys, under the sidebar tab. Only tenant admins and owners manage them. */
export function ApiKeysPage() {
  const { t } = useTranslation();
  const { id } = useWorkspace();
  const canManage = useCan('tenant.admin');
  if (!canManage) return <NotFound page />;
  return (
    <Stack gap="6">
      <Flex justify="space-between" align="start" gap="4" wrap="wrap">
        <Box>
          <Heading as="h1" textStyle="h1">
            {t('apiKeys.title')}
          </Heading>
          <Text mt="1" color="fg.muted">
            {t('apiKeys.subtitle')}
          </Text>
        </Box>
        <CreateKeyDialog workspaceId={id} />
      </Flex>
      <ApiKeysTable workspaceId={id} />
    </Stack>
  );
}
