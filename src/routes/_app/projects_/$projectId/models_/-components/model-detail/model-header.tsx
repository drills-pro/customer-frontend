import { Link, useNavigate } from '@tanstack/react-router'
import { Box, Download, Rocket } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EntityHeader } from '@/components/shared/entity-header'
import { cn } from 'cn'
import {
  formatAccuracy,
  formatF1,
  StageBadge,
} from '../../../-components/model-list'
import { versionDeltas } from './helpers'
import type { Delta } from './helpers'
import { useCurrentModel } from './use-current-model'

/** Green when the change is an improvement, which depends on the metric. */
function DeltaLine({ delta, lower }: { delta: Delta; lower?: boolean }) {
  const improved = lower ? delta.tone === 'down' : delta.tone === 'up'
  const regressed = lower ? delta.tone === 'up' : delta.tone === 'down'
  return (
    <span
      className={cn(
        improved && 'text-success',
        regressed && 'text-destructive',
        delta.tone === 'flat' && 'text-muted-foreground',
      )}
    >
      {delta.text}
    </span>
  )
}

export function ModelHeader() {
  const { model, versions, deployment } = useCurrentModel()
  const navigate = useNavigate()
  const index = versions.findIndex((item) => item.id === model.id)
  const deltas = versionDeltas(
    model,
    index > 0 ? versions[index - 1] : undefined,
  )
  const latest = versions.at(-1)

  return (
    <EntityHeader
      icon={Box}
      name={model.name}
      mono
      badges={
        <>
          <Badge variant="secondary" className="font-mono font-medium">
            v{model.version}
          </Badge>
          <StageBadge stage={model.stage} />
        </>
      }
      meta={
        <>
          {model.architecture} · {model.framework} · from{' '}
          <Link
            to="/projects/$projectId/training/$runId"
            params={{ projectId: model.projectId, runId: model.runId }}
            className="h-auto border-none p-0 font-medium"
          >
            run {model.runId}
          </Link>{' '}
          · {model.size} · created {model.created} by {model.author}
        </>
      }
      actions={
        <>
          {versions.length > 1 ? (
            <Select
              value={model.id}
              onValueChange={(value) =>
                navigate({
                  to: '/projects/$projectId/models/$modelId',
                  params: { projectId: model.projectId, modelId: value },
                })
              }
            >
              <SelectTrigger
                size="lg"
                aria-label="Model version"
                className="w-[136px] font-mono"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...versions].reverse().map((item) => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                    className="font-mono"
                  >
                    v{item.version}
                    {item.id === latest?.id ? ' (latest)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          <Button
            variant="outline"
            size="lg"
            className="px-3.5 shadow-xs"
            onClick={() =>
              toast.info('Model downloads are not available in this demo.')
            }
          >
            <Download className="size-4" />
            Download
          </Button>
          {deployment ? (
            <Button asChild size="lg" className="px-3.5 shadow-xs">
              <Link
                to="/projects/$projectId/deployments/$deploymentId"
                params={{
                  projectId: deployment.projectId,
                  deploymentId: deployment.id,
                }}
              >
                <Rocket className="size-4" />
                View deployment
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              className="px-3.5 shadow-xs"
              onClick={() =>
                toast.info('Deploying is not available in this demo.')
              }
            >
              <Rocket className="size-4" />
              Deploy
            </Button>
          )}
        </>
      }
      stats={[
        {
          label: 'Accuracy',
          value: formatAccuracy(model.accuracy),
          delta: <DeltaLine delta={deltas.accuracy} />,
        },
        {
          label: 'Macro F1',
          value: formatF1(model.f1),
          delta: <DeltaLine delta={deltas.f1} />,
        },
        {
          label: 'Inference p95',
          value: model.latencyP95,
          delta: <DeltaLine delta={deltas.latency} lower />,
        },
        {
          label: 'Size',
          value: model.size,
          delta: <DeltaLine delta={deltas.size} />,
        },
      ]}
    />
  )
}
