import { Box, Flex, Input, InputGroup } from '@chakra-ui/react';
import { Grid2X2, List, Search } from 'lucide-react';

import { RadioButton, RadioButtonGroup } from '@/components/shared/radio-button-group';
import { SimpleSelect } from '@/components/simple-select';

import type { ProjectFiltersState, View } from './types';

const views = [
  { value: 'grid', label: 'Grid view', icon: Grid2X2 },
  { value: 'list', label: 'List view', icon: List },
] as const;

export function ProjectFilters({
  filters,
  onFiltersChange,
  taskTypes,
  statuses,
}: {
  filters: ProjectFiltersState;
  onFiltersChange: (patch: Partial<ProjectFiltersState>) => void;
  taskTypes: Array<string>;
  statuses: Array<string>;
}) {
  return (
    <Flex as="section" aria-label="Project filters" mb="4" wrap="wrap" align="center" gap="2">
      <InputGroup flex="1" minW="220px" startElement={<Search size={16} aria-hidden="true" />}>
        <Input
          size="sm"
          bg="surface-raised"
          value={filters.query}
          onChange={(event) => onFiltersChange({ query: event.target.value })}
          placeholder="Search projects..."
          aria-label="Search projects"
        />
      </InputGroup>

      <Box flex={{ base: '1', xl: 'none' }} minW="40">
        <SimpleSelect
          label="Filter by task type"
          hideLabel
          size="sm"
          width="full"
          value={filters.task}
          onChange={(value) => onFiltersChange({ task: value })}
          items={[{ label: 'All task types', value: 'all' }, ...taskTypes.map((item) => ({ label: item, value: item }))]}
        />
      </Box>

      <Box flex={{ base: '1', xl: 'none' }} minW="36">
        <SimpleSelect
          label="Filter by status"
          hideLabel
          size="sm"
          width="full"
          value={filters.status}
          onChange={(value) => onFiltersChange({ status: value })}
          items={[{ label: 'All statuses', value: 'all' }, ...statuses.map((item) => ({ label: item, value: item }))]}
        />
      </Box>

      <Box flex={{ base: '1', xl: 'none' }} minW="44" ms={{ xl: 'auto' }}>
        <SimpleSelect
          label="Sort projects"
          hideLabel
          size="sm"
          width="full"
          value={filters.sort}
          onChange={(value) => onFiltersChange({ sort: value })}
          items={[
            { label: 'Recently updated', value: 'recent' },
            { label: 'Name A–Z', value: 'name' },
          ]}
        />
      </Box>

      <RadioButtonGroup
        attached
        aria-label="Project view"
        value={filters.view}
        onChange={(value) => onFiltersChange({ view: value as View })}
      >
        {views.map(({ value, label, icon: ViewIcon }) => (
          <RadioButton key={value} value={value} size="sm" px="2.5" aria-label={label}>
            <ViewIcon />
          </RadioButton>
        ))}
      </RadioButtonGroup>
    </Flex>
  );
}
