import { Avatar, Menu, Portal, Text } from '@chakra-ui/react';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useMe } from '@/modules/workspaces/api';
import { useAuth } from '@/modules/auth';

export function UserMenu() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const me = useMe();
  const who = me.name ?? me.email ?? t('shell.account');
  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger rounded="full" aria-label={t('shell.account')}>
        <Avatar.Root size="sm">
          <Avatar.Fallback name={who} />
        </Avatar.Root>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="56">
            <Text px="3" py="2" fontWeight="medium" truncate>
              {who}
            </Text>
            {me.email && me.name && (
              <Text px="3" pb="2" textStyle="body-sm" color="fg.muted" truncate>
                {me.email}
              </Text>
            )}
            <Menu.Separator />
            <Menu.Item value="sign-out" onSelect={signOut}>
              <LogOut />
              {t('dashboard.signOut')}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
