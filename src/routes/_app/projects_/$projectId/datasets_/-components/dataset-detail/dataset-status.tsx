import { Button } from '@chakra-ui/react';
import { toaster } from '@/components/toaster';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { useReprocessDataset } from '@/features/datasets/queries';
import { useCurrentDataset } from './use-current-dataset';

export function DatasetStatus() {
  const { project, dataset } = useCurrentDataset();
  const reprocess = useReprocessDataset(project.id, dataset.id);
  const failed = dataset.status === 'Error';
  return (
    <EmptyNotice
      minH="72"
      rounded="l3"
      borderWidth="1px"
      borderColor="border"
      bg="surface-raised"
      title={failed ? 'Dataset processing failed' : 'Processing dataset'}
      description={
        failed
          ? 'This import contains invalid labels. Retry to reprocess the dataset.'
          : 'Preparing sample statistics and preview. This page will update when processing completes.'
      }
    >
      {failed && (
        <Button
          variant="solid"
          size="sm"
          disabled={reprocess.isPending}
          onClick={() =>
            reprocess.mutate(undefined, {
              onSuccess: () =>
                toaster.create({
                  type: 'info',
                  title: 'Reprocessing started.',
                }),
            })
          }
        >
          Retry processing
        </Button>
      )}
    </EmptyNotice>
  );
}
