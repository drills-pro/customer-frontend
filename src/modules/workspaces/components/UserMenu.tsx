import { Avatar, Menu, Portal, Text } from '@chakra-ui/react';
import { ChevronRight, Logout, Monitor, Moon, Sun } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useColorMode } from '@/components/color-mode';
import { useMe } from '@/modules/workspaces/api';
import { useAuth } from '@/modules/auth';

const MODES = [
  { value: 'system', Icon: Monitor },
  { value: 'dark', Icon: Moon },
  { value: 'light', Icon: Sun },
] as const;

export function UserMenu() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const me = useMe();
  const { preference, setColorMode } = useColorMode();
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
            <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
              <Menu.TriggerItem data-testid="user-menu-appearance">
                <Sun />
                {t('shell.appearance.label')}
                <ChevronRight />
              </Menu.TriggerItem>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content minW="40">
                    <Menu.RadioItemGroup value={preference} onValueChange={(e) => setColorMode(e.value)}>
                      {MODES.map(({ value, Icon }) => (
                        <Menu.RadioItem key={value} value={value} data-testid={`appearance-${value}`}>
                          <Icon />
                          {t(`shell.appearance.${value}`)}
                          <Menu.ItemIndicator />
                        </Menu.RadioItem>
                      ))}
                    </Menu.RadioItemGroup>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
            <Menu.Item value="sign-out" onSelect={signOut}>
              <Logout />
              {t('dashboard.signOut')}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
