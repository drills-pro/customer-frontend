import { CircleAlert } from 'lucide-react'

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder rows shown while a card's data is on its way. */
export function CardLoading({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-4 p-5" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div className="space-y-2" key={index}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

export function CardError({
  title,
  error,
  onRetry,
}: {
  title: string
  error: Error
  onRetry: () => void
}) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <CircleAlert />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </AlertAction>
      </Alert>
    </div>
  )
}

/** The space a page section holds while its data loads. */
export function SectionLoading() {
  return (
    <div className="rounded-xl border bg-card">
      <CardLoading rows={4} />
    </div>
  )
}

/** A page section whose data could not be loaded. */
export function SectionError({
  title,
  error,
  onRetry,
}: {
  title: string
  error: Error
  onRetry: () => void
}) {
  return (
    <div className="rounded-xl border bg-card">
      <CardError title={title} error={error} onRetry={onRetry} />
    </div>
  )
}

/** A whole page waiting for the record it is about. */
export function PageLoading() {
  return (
    <main
      id="dashboard-main"
      className="min-h-96 flex-1"
      aria-busy="true"
      aria-label="Loading"
    />
  )
}

/** A whole page whose record could not be loaded for a reason other than 404. */
export function PageError({
  title,
  error,
  onRetry,
}: {
  title: string
  error: Error
  onRetry: () => void
}) {
  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-2xl flex-1 p-4 sm:p-6"
    >
      <div className="rounded-xl border bg-card">
        <CardError title={title} error={error} onRetry={onRetry} />
      </div>
    </main>
  )
}
