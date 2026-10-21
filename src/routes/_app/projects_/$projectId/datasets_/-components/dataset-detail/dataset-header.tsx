import { Button, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Download, FileText, Image as ImageIcon, Table2 } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { EntityHeader } from '@/components/shared/entity-header';
import { ToneBadge } from '@/components/shared/tone-badge';
import { projectDatasetsApi } from '@/features/datasets/api';

import { downloadJson, itemNoun } from './helpers';
import { useCurrentDataset } from './use-current-dataset';

const modalityIcon = {
  image: ImageIcon,
  text: FileText,
  tabular: Table2,
} as const;

export function DatasetHeader() {
  const { dataset, project } = useCurrentDataset();
  const isReady = dataset.status === 'Ready';

  return (
    <EntityHeader
      icon={modalityIcon[dataset.modality]}
      name={dataset.name}
      badges={
        <>
          <ToneBadge tone="accent" fontWeight="semibold">
            v{dataset.version}
          </ToneBadge>
          <ToneBadge fontWeight="semibold" tone={isReady ? 'success' : dataset.status === 'Error' ? 'error' : 'warning'}>
            {isReady ? '✓ Ready' : dataset.status}
          </ToneBadge>
        </>
      }
      meta={
        <>
          {dataset.modality} dataset · {dataset.items.toLocaleString('en-US')} {itemNoun(dataset)} · {dataset.classes}{' '}
          {dataset.modality === 'text' ? 'labels' : 'classes'} · {dataset.size}
        </>
      }
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            px="3.5"
            onClick={() =>
              void projectDatasetsApi
                .getManifest(project.id, dataset.id)
                .then((manifest) => downloadJson(`${dataset.name}-manifest.json`, manifest))
                .catch((error: Error) => toaster.create({ type: 'error', title: error.message }))
            }
          >
            <Download />
            Download
          </Button>
          {isReady ? (
            <Button asChild variant="solid" size="sm" px="3.5">
              <Link to="/projects/$projectId/training/new" params={{ projectId: project.id }} search={{ dataset: dataset.id }}>
                Create Training →
              </Link>
            </Button>
          ) : (
            <Button disabled variant="solid" size="sm" px="3.5">
              Create Training →
            </Button>
          )}
        </>
      }
      stats={[
        {
          label: itemNoun(dataset).replace(/^./, (c) => c.toUpperCase()),
          value: dataset.items.toLocaleString('en-US'),
        },
        {
          label: dataset.modality === 'text' ? 'Labels' : 'Classes',
          value: dataset.classes || 'Pending',
        },
        { label: 'Storage', value: dataset.size },
        {
          label: 'Split',
          value: (
            <Text as="span" textTransform="capitalize">
              {dataset.split}
            </Text>
          ),
        },
      ]}
    />
  );
}
