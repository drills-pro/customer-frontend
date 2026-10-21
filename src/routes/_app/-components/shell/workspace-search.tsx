import * as React from 'react';
import { Dialog, Icon, Input, InputGroup, Listbox, Portal, createListCollection } from '@chakra-ui/react';
import { useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import type { Organization } from '@/features/dashboard/domain/types';
import type { ApiSearchHit } from '@/features/organizations/api';
import { unavailable } from '@/lib/unavailable';

type SearchItem = {
  id: string;
  label: string;
  group: string;
  /** Present for training runs and deployments, which live under a project. */
  projectId?: string;
};

const groups = ['Projects', 'Training runs', 'Deployments', 'Organizations'];

const hitGroups: Record<ApiSearchHit['kind'], string> = {
  project: 'Projects',
  training_run: 'Training runs',
  deployment: 'Deployments',
};

/** Search hits from the API, plus the organizations the user can jump to. */
export function buildSearchItems({ organizations, hits }: { organizations: Organization[]; hits: ApiSearchHit[] }): SearchItem[] {
  return [
    ...hits.map((hit) => ({
      id: hit.id,
      label: hit.name,
      group: hitGroups[hit.kind],
      projectId: hit.kind === 'project' ? undefined : hit.project_id,
    })),
    ...organizations.map((item) => ({
      id: item.id,
      label: item.name,
      group: 'Organizations',
    })),
  ];
}

export function WorkspaceSearch({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SearchItem[];
}) {
  const navigate = useNavigate();
  const [query, setQuery] = React.useState('');
  const [highlighted, setHighlighted] = React.useState<string | null>(null);

  const collection = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return createListCollection({
      items: items.filter((item) => item.label.toLowerCase().includes(needle)),
      itemToValue: (item) => `${item.group}:${item.id}`,
      itemToString: (item) => item.label,
      groupBy: (item) => item.group,
      groupSort: groups,
    });
  }, [items, query]);

  // The first match is ready for Enter, as in any command palette.
  React.useEffect(() => {
    setHighlighted(collection.firstValue);
  }, [collection]);

  function close(next: boolean) {
    onOpenChange(next);
    if (!next) setQuery('');
  }

  function select(item: SearchItem) {
    close(false);
    if (item.group === 'Organizations') {
      void navigate({
        to: '/organizations/$orgId/overview',
        params: { orgId: item.id },
      });
    } else if (item.group === 'Projects') {
      void navigate({
        to: '/projects/$projectId/overview',
        params: { projectId: item.id },
      });
    } else if (item.group === 'Deployments' && item.projectId) {
      void navigate({
        to: '/projects/$projectId/deployments/$deploymentId',
        params: { projectId: item.projectId, deploymentId: item.id },
      });
    } else if (item.projectId) {
      void navigate({
        to: '/projects/$projectId/training/$runId',
        params: { projectId: item.projectId, runId: item.id },
      });
    } else {
      unavailable(item.label);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={(event) => close(event.open)} placement="top" size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content p="0" overflow="hidden">
            <Dialog.Title srOnly>Search workspace</Dialog.Title>
            <Dialog.Description srOnly>Search projects, training runs, deployments, and organizations.</Dialog.Description>
            <Listbox.Root
              collection={collection}
              highlightedValue={highlighted}
              onHighlightChange={(details) => setHighlighted(details.highlightedValue)}
              onSelect={(details) => {
                const item = collection.find(details.value);
                if (item) select(item);
              }}
              gap="0"
            >
              <InputGroup startElement={<Search size={16} />} borderBottomWidth="1px" borderColor="border">
                <Listbox.Input asChild value={query} onChange={(event) => setQuery(event.currentTarget.value)}>
                  <Input variant="flushed" h="12" placeholder="Search projects, models, runs..." />
                </Listbox.Input>
              </InputGroup>
              <Listbox.Content maxH="80" overflowY="auto" p="1.5" borderWidth="0" boxShadow="none">
                {collection.group().map(([group, groupItems]) => (
                  <Listbox.ItemGroup key={group}>
                    <Listbox.ItemGroupLabel>{group}</Listbox.ItemGroupLabel>
                    {groupItems.map((item) => (
                      <Listbox.Item key={`${item.group}:${item.id}`} item={item} gap="2">
                        <Icon boxSize="4" color="fg.muted" asChild>
                          <Search />
                        </Icon>
                        <Listbox.ItemText>{item.label}</Listbox.ItemText>
                      </Listbox.Item>
                    ))}
                  </Listbox.ItemGroup>
                ))}
                <Listbox.Empty py="6" textAlign="center" textStyle="body-sm">
                  No results found.
                </Listbox.Empty>
              </Listbox.Content>
            </Listbox.Root>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
