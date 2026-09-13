import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import type { Dataset } from '@/features/dashboard/data'

export function DatasetStatus({ dataset }: { dataset: Dataset }) {
  const failed = dataset.status === 'Error'
  return (
    <Empty className="min-h-72 border bg-white">
      <EmptyHeader>
        <EmptyTitle>
          {failed ? 'Dataset processing failed' : 'Processing dataset'}
        </EmptyTitle>
        <EmptyDescription>
          {failed
            ? 'This import contains invalid labels. Retry to reprocess the demo dataset.'
            : 'Preparing sample statistics and preview. This page will update when processing completes.'}
        </EmptyDescription>
      </EmptyHeader>
      {failed && (
        <EmptyContent>
          <Button
            onClick={() => toast.info('Retry started for this demo dataset.')}
          >
            Retry processing
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
