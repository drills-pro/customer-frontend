import { IconButton, Menu, Portal } from '@chakra-ui/react';
import { Sliders } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { PROJECT_COLUMNS, type ProjectColumn } from '@/modules/projects/columns';

/** Show or hide the list view's columns. The name cannot be hidden, so it is listed checked and disabled. */
export function ProjectColumnsMenu({
  hidden,
  isDefault,
  onToggle,
  onReset,
}: {
  hidden: ProjectColumn[];
  isDefault: boolean;
  onToggle: (column: ProjectColumn) => void;
  onReset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }} closeOnSelect={false}>
      <Menu.Trigger asChild>
        <IconButton variant="ghost" size="xs" color="fg.muted" aria-label={t('projects.column.menu')} data-testid="projects-columns">
          <Sliders />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="48">
            <Menu.CheckboxItem value="name" checked disabled>
              {t('projects.column.name')}
              <Menu.ItemIndicator />
            </Menu.CheckboxItem>
            {PROJECT_COLUMNS.map((c) => (
              <Menu.CheckboxItem
                key={c}
                value={c}
                checked={!hidden.includes(c)}
                onCheckedChange={() => onToggle(c)}
                data-testid={`projects-column-${c}`}
              >
                {t(`projects.column.${c}`)}
                <Menu.ItemIndicator />
              </Menu.CheckboxItem>
            ))}
            <Menu.Separator />
            <Menu.Item value="reset" disabled={isDefault} onSelect={onReset} data-testid="projects-columns-reset">
              {t('projects.column.reset')}
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
