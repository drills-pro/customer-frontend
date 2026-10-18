import { Link } from '@tanstack/react-router'
import { Pause, Play, RefreshCw, Rocket } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { CopyButton } from '@/components/shared/copy-button'
import { EntityHeader } from '@/components/shared/entity-header'
import { DeploymentStatusBadge } from '@/features/deployments/components/deployment-status-badge'
import { useDeploymentAction } from '@/features/deployments/queries'
import { EnvironmentBadge } from '../../../-components/deployment-list'
import { useCurrentDeployment } from './use-current-deployment'

export function DeploymentHeader() {
  const { project, deployment, model } = useCurrentDeployment()
  const act = useDeploymentAction(project.id, deployment.id)
  const idle = deployment.status !== 'Live'
  // Nothing to pause or resume while a rollout is still in progress.
  const rollingOut = deployment.status === 'Deploying'

  return (
    <EntityHeader
      icon={Rocket}
      name={deployment.name}
      mono
      badges={
        <>
          <DeploymentStatusBadge status={deployment.status} />
          <EnvironmentBadge environment={deployment.environment} />
        </>
      }
      meta={
        <>
          {/* For a deployment the endpoint URL is the identity, so it leads. */}
          <span className="flex flex-wrap items-center gap-2">
            <code className="max-w-full truncate rounded bg-muted px-2 py-1 text-xs">
              {deployment.endpoint}
            </code>
            <CopyButton value={deployment.endpoint} label="Copy endpoint URL" />
          </span>
          <span className="mt-1.5 block">
            Serving{' '}
            {model ? (
              <Link
                to="/projects/$projectId/models/$modelId"
                params={{
                  projectId: deployment.projectId,
                  modelId: model.id,
                }}
                className="h-auto border-none p-0 font-mono font-medium"
              >
                {model.name} v{model.version}
              </Link>
            ) : (
              deployment.modelId
            )}{' '}
            · {deployment.instanceName} · {deployment.region} · deployed{' '}
            {deployment.deployed}
          </span>
        </>
      }
      actions={
        <>
          <Button
            variant="outline"
            size="lg"
            className="px-3.5 shadow-xs"
            disabled={rollingOut || act.isPending}
            onClick={() =>
              act.mutate(idle ? 'resume' : 'pause', {
                onSuccess: () =>
                  toast.success(
                    `${deployment.name} ${idle ? 'resumed' : 'paused'}.`,
                  ),
              })
            }
          >
            {idle ? <Play className="size-4" /> : <Pause className="size-4" />}
            {idle ? 'Resume' : 'Pause'}
          </Button>
          <Button
            size="lg"
            className="px-3.5 shadow-xs"
            disabled={rollingOut || act.isPending}
            onClick={() =>
              act.mutate('redeploy', {
                onSuccess: () =>
                  toast.success(`Redeploying ${deployment.name}.`),
              })
            }
          >
            <RefreshCw className="size-4" />
            Redeploy
          </Button>
        </>
      }
      stats={[
        {
          label: 'Requests 24h',
          value: deployment.requests24h,
          delta: idle ? (
            <span className="text-muted-foreground">
              no traffic while {deployment.status.toLowerCase()}
            </span>
          ) : (
            <span className="text-success">▲ 6.2% vs yesterday</span>
          ),
        },
        {
          label: 'p95 latency',
          value: deployment.latencyP95,
          delta: idle ? undefined : (
            <span className="text-success">▼ 8 ms vs yesterday</span>
          ),
        },
        {
          label: 'Error rate',
          value: deployment.errorRate,
          delta: idle ? undefined : (
            <span className="text-muted-foreground">within 0.5% budget</span>
          ),
        },
        {
          label: 'Cost today',
          value: deployment.costPerDay,
          delta: (
            <span className="text-muted-foreground">
              {deployment.activeReplicas} / {deployment.maxReplicas} replicas
              active
            </span>
          ),
        },
      ]}
    />
  )
}
