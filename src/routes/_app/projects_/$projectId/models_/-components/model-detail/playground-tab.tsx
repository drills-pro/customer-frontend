import { useQuery } from '@tanstack/react-query'
import { ImageUp, Play } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { modelsApi } from '@/features/models/api'
import { modelKeys } from '@/features/models/queries'
import { cn } from 'cn'
import { useCurrentModel } from './use-current-model'

/**
 * A worked example rather than a live endpoint: the demo has no inference
 * backend, so the panel opens showing what a real prediction looks like and
 * labels it as an example.
 */
const SAMPLE_IMAGE = '/dataset-samples/retail/beverages.png'

function Bar({
  label,
  value,
  mono = true,
  tone,
}: {
  label: string
  value: number
  mono?: boolean
  tone?: string
}) {
  return (
    <div className="mt-3 first:mt-0">
      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className={cn('truncate', mono && 'font-mono')}>{label}</span>
        <span className="shrink-0 font-semibold tabular-nums">
          {value.toFixed(1)}%
        </span>
      </div>
      <Progress
        value={value}
        aria-label={label}
        className={cn('mt-1.5 h-1.5', tone)}
      />
    </div>
  )
}

/** The sample image with a saliency overlay painted over it. */
function Saliency({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
      <img
        src={SAMPLE_IMAGE}
        alt="Sample shelf photo with the model's saliency overlay"
        className="block w-full"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 55%, rgb(239 68 68 / 0.55), transparent 45%), radial-gradient(circle at 62% 62%, rgb(245 158 11 / 0.4), transparent 38%)',
        }}
      />
    </div>
  )
}

export function PlaygroundTab() {
  const { project, model } = useCurrentModel()
  // The panel opens on the model's answer for the example image; "Run
  // prediction" asks for it again.
  const prediction = useQuery({
    queryKey: [...modelKeys.one(project.id, model.id), 'example-prediction'],
    queryFn: () => modelsApi.predict(project.id, model.id),
    staleTime: Infinity,
  })
  const predictions = prediction.data?.predictions ?? []
  const contributions = prediction.data?.contributions ?? []
  const top = predictions.at(0)

  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-2">
      <Card size="flush">
        <CardHeader className="border-b [--card-section:--spacing(3.5)]">
          <CardTitle>Test this model</CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex min-h-[210px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground ring-1 ring-border">
              <ImageUp className="size-5" />
            </div>
            <p className="mt-1 text-[13px] font-medium">Drop an image here</p>
            <p className="text-xs text-muted-foreground">
              or click to browse · JPG, PNG up to 10 MB
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg bg-muted p-3">
            <Saliency className="size-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[13px]">
                shelf-sample-0142.jpg
              </p>
              <p className="text-[11px] text-muted-foreground">
                Example image · 1.2 MB · 1440 × 1080
              </p>
            </div>
            <Button
              disabled={prediction.isFetching}
              onClick={() =>
                void prediction.refetch().then((result) => {
                  if (result.error) toast.error(result.error.message)
                  else toast.success('Prediction complete.')
                })
              }
            >
              <Play />
              Run prediction
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card size="flush">
        <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
          <CardTitle className="mr-auto">Prediction</CardTitle>
          <Badge variant="neutral">Example result</Badge>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 rounded-lg bg-success-muted px-4 py-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium tracking-widest text-success uppercase">
                Top prediction
              </p>
              <p className="truncate font-mono text-[15px] font-semibold text-success">
                {top?.label}
              </p>
            </div>
            <p className="shrink-0 text-2xl font-semibold tabular-nums text-success">
              {top ? `${top.confidence}%` : ''}
            </p>
          </div>

          <div className="mt-4">
            {predictions.map((entry) => (
              <Bar
                key={entry.label}
                label={entry.label}
                value={entry.confidence}
              />
            ))}
          </div>

          <div className="mt-5 border-t pt-4">
            <h3>Why this prediction</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              The regions and features that moved the model toward this label.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <div className="w-[132px] shrink-0">
                <Saliency />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Saliency overlay
                </p>
              </div>
              <div className="min-w-[200px] flex-1">
                {contributions.map((entry) => (
                  <Bar
                    key={entry.label}
                    label={entry.label}
                    value={entry.weight}
                    mono={false}
                    tone="[&_[data-slot=progress-indicator]]:bg-highlight"
                  />
                ))}
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Inference {model.latencyP95} · {model.name} v{model.version} ·
            temporary endpoint, not billed
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
