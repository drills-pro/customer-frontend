import { Badge, Button, Card, DataList, Heading, HStack, Stack } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useWorkspaceDetail } from '@/modules/workspaces/api';
import { useCan, useWorkspace } from '@/modules/workspaces/context';

export function OverviewPage() {
  const { t, i18n } = useTranslation();
  const { id, slug } = useWorkspace();
  const w = useWorkspaceDetail(id);
  const canManage = useCan('tenant.member.manage');
  return (
    <Stack gap="6">
      <Heading as="h1" textStyle="h1">
        {w.name}
      </Heading>
      <Card.Root>
        <Card.Body>
          <DataList.Root orientation="horizontal" divideY="1px">
            <DataList.Item pt="4">
              <DataList.ItemLabel>{t('overview.handle')}</DataList.ItemLabel>
              <DataList.ItemValue fontFamily="mono">{w.slug}</DataList.ItemValue>
            </DataList.Item>
            <DataList.Item pt="4">
              <DataList.ItemLabel>{t('overview.role')}</DataList.ItemLabel>
              <DataList.ItemValue>
                <Badge colorPalette="brand" variant="subtle">
                  {t(`role.${w.role}`)}
                </Badge>
              </DataList.ItemValue>
            </DataList.Item>
            <DataList.Item pt="4">
              <DataList.ItemLabel>{t('overview.created')}</DataList.ItemLabel>
              <DataList.ItemValue>{new Date(w.created_at).toLocaleDateString(i18n.resolvedLanguage)}</DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>
        </Card.Body>
      </Card.Root>
      <HStack gap="3" wrap="wrap">
        {canManage && (
          <Button asChild variant="solid">
            <Link to="/w/$slug/members" params={{ slug }}>
              {t('overview.members')}
            </Link>
          </Button>
        )}
        <Button asChild>
          <Link to="/w/$slug/settings" params={{ slug }}>
            {t('overview.settings')}
          </Link>
        </Button>
      </HStack>
    </Stack>
  );
}
