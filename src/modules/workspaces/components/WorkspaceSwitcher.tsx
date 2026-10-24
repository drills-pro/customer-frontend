import { Avatar, Badge, Button, HStack, Menu, Portal, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Check, ChevronsVertical, Plus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useMe } from '@/modules/workspaces/api';
import { useWorkspace } from '@/modules/workspaces/context';

/** Lists the user's workspaces (from /v1/me) and a way to create another. */
export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const current = useWorkspace();
  const { tenants } = useMe();
  return (
    <Menu.Root positioning={{ placement: 'bottom-start', sameWidth: true }}>
      <Menu.Trigger asChild>
        <Button
          variant="outline"
          justifyContent="space-between"
          w="full"
          aria-label={t('shell.switchWorkspace')}
          data-testid="workspace-switcher"
        >
          <HStack gap="2" minW="0">
            <Avatar.Root size="2xs" shape="rounded">
              <Avatar.Fallback name={current.name} />
            </Avatar.Root>
            <Text truncate>{current.name}</Text>
          </HStack>
          <ChevronsVertical />
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel>{t('shell.workspaces')}</Menu.ItemGroupLabel>
              {tenants.map((w) => (
                <Menu.Item key={w.id} value={w.id} asChild data-testid={`workspace-option-${w.slug}`}>
                  <Link to="/w/$slug" params={{ slug: w.slug }} onClick={onNavigate}>
                    <Text flex="1" truncate>
                      {w.name}
                    </Text>
                    {w.status === 'pending_delete' && (
                      <Badge colorPalette="warning" variant="subtle">
                        {t('shell.pendingDelete')}
                      </Badge>
                    )}
                    {w.id === current.id && <Check />}
                  </Link>
                </Menu.Item>
              ))}
            </Menu.ItemGroup>
            <Menu.Separator />
            <Menu.Item value="new" asChild data-testid="workspace-create">
              <Link to="/new" onClick={onNavigate}>
                <Plus />
                {t('shell.createWorkspace')}
              </Link>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
