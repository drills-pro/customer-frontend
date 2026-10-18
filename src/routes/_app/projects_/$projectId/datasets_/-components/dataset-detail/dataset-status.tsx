import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { useReprocessDataset } from '@/features/datasets/queries'
import { useCurrentDataset } from './use-current-dataset'

export function DatasetStatus() {
  const { project, dataset } = useCurrentDataset()
  const reprocess = useReprocessDataset(project.id, dataset.id)
  const failed = dataset.status === 'Error'
  return (
    <Empty className="min-h-72 border bg-card">
      <EmptyHeader>
        <EmptyTitle>
          {failed ? 'Dataset processing failed' : 'Processing dataset'}
        </EmptyTitle>
        <EmptyDescription>
          {failed
            ? 'This import contains invalid labels. Retry to reprocess the dataset.'
            : 'Preparing sample statistics and preview. This page will update when processing completes.'}
        </EmptyDescription>
      </EmptyHeader>
      {failed && (
        <EmptyContent>
          <Button
            disabled={reprocess.isPending}
            onClick={() =>
              reprocess.mutate(undefined, {
                onSuccess: () => toast.info('Reprocessing started.'),
              })
            }
          >
            Retry processing
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
