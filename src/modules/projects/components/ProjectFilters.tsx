import { Box, Flex, Input, InputGroup } from '@chakra-ui/react';
import type { ComponentType, SVGProps } from 'react';
import { Grid2x22, ListBox, Search } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { RadioButton, RadioButtonGroup } from '@/components/radio-button-group';
import { SimpleSelect } from '@/components/simple-select';
import { ALL, LISTED_STATUSES, LISTED_TASK_TYPES, SORTS, VIEWS, type ProjectFiltersState, type View } from '@/modules/projects/filters';

type PixelIcon = ComponentType<SVGProps<SVGSVGElement>>;
const VIEW_ICONS: Record<View, PixelIcon> = { grid: Grid2x22, list: ListBox };

/** Search, task, status and sort over the loaded projects, and the grid/list switch. */
export function ProjectFilters({
  filters,
  onChange,
}: {
  filters: ProjectFiltersState;
  onChange: (patch: Partial<ProjectFiltersState>) => void;
}) {
  const { t } = useTranslation();
  return (
    <Flex as="section" aria-label={t('projects.filter.label')} wrap="wrap" align="center" gap="2">
      <InputGroup flex="1" minW="56" startElement={<Search width={16} height={16} aria-hidden="true" />}>
        <Input
          size="sm"
          bg="surface-raised"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          placeholder={t('projects.filter.search')}
          aria-label={t('projects.filter.search')}
        />
      </InputGroup>
      <Box flex={{ base: '1', xl: 'none' }} minW="44">
        <SimpleSelect
          label={t('projects.filter.task')}
          hideLabel
          size="sm"
          width="full"
          value={filters.task}
          onChange={(task) => onChange({ task: task as ProjectFiltersState['task'] })}
          items={[
            { label: t('projects.filter.allTasks'), value: ALL },
            ...LISTED_TASK_TYPES.map((v) => ({ label: t(`projects.taskType.${v}.label`), value: v })),
          ]}
        />
      </Box>
      <Box flex={{ base: '1', xl: 'none' }} minW="36">
        <SimpleSelect
          label={t('projects.filter.status')}
          hideLabel
          size="sm"
          width="full"
          value={filters.status}
          onChange={(status) => onChange({ status: status as ProjectFiltersState['status'] })}
          items={[
            { label: t('projects.filter.allStatuses'), value: ALL },
            ...LISTED_STATUSES.map((v) => ({ label: t(`projects.status.${v}`), value: v })),
          ]}
        />
      </Box>
      <Box flex={{ base: '1', xl: 'none' }} minW="40" ms={{ xl: 'auto' }}>
        <SimpleSelect
          label={t('projects.filter.sort')}
          hideLabel
          size="sm"
          width="full"
          value={filters.sort}
          onChange={(sort) => onChange({ sort: sort as ProjectFiltersState['sort'] })}
          items={SORTS.map((v) => ({ label: t(`projects.sort.${v}`), value: v }))}
        />
      </Box>
      <RadioButtonGroup
        attached
        aria-label={t('projects.view.label')}
        value={filters.view}
        onChange={(view) => onChange({ view: view as View })}
      >
        {VIEWS.map((v) => {
          const Icon = VIEW_ICONS[v];
          return (
            <RadioButton key={v} value={v} size="sm" px="2.5" aria-label={t(`projects.view.${v}`)}>
              <Icon />
            </RadioButton>
          );
        })}
      </RadioButtonGroup>
    </Flex>
  );
}
