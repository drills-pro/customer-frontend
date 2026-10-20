import { Box, Button, Code, Flex, Link, Text } from '@chakra-ui/react'
import { Link as RouterLink } from '@tanstack/react-router'
import { Pause, Play, RefreshCw, Rocket } from 'lucide-react'
import { toaster } from '@/components/toaster'

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
          <Flex as="span" wrap="wrap" align="center" gap="2">
            <Code size="sm" maxW="full" truncate>
              {deployment.endpoint}
            </Code>
            <CopyButton value={deployment.endpoint} label="Copy endpoint URL" />
          </Flex>
          <Box as="span" display="block" mt="1.5">
            Serving{' '}
            {model ? (
              <Link asChild fontFamily="mono" fontWeight="medium" color="fg">
                <RouterLink
                  to="/projects/$projectId/models/$modelId"
                  params={{
                    projectId: deployment.projectId,
                    modelId: model.id,
                  }}
                >
                  {model.name} v{model.version}
                </RouterLink>
              </Link>
            ) : (
              deployment.modelId
            )}{' '}
            · {deployment.instanceName} · {deployment.region} · deployed{' '}
            {deployment.deployed}
          </Box>
        </>
      }
      actions={
        <>
          <Button
            variant="outline"
            size="sm"
            px="3.5"
            disabled={rollingOut || act.isPending}
            onClick={() =>
              act.mutate(idle ? 'resume' : 'pause', {
                onSuccess: () =>
                  toaster.create({
                    type: 'success',
                    title: `${deployment.name} ${idle ? 'resumed' : 'paused'}.`,
                  }),
              })
            }
          >
            {idle ? <Play /> : <Pause />}
            {idle ? 'Resume' : 'Pause'}
          </Button>
          <Button
            variant="solid"
            size="sm"
            px="3.5"
            disabled={rollingOut || act.isPending}
            onClick={() =>
              act.mutate('redeploy', {
                onSuccess: () =>
                  toaster.create({
                    type: 'success',
                    title: `Redeploying ${deployment.name}.`,
                  }),
              })
            }
          >
            <RefreshCw />
            Redeploy
          </Button>
        </>
      }
      stats={[
        {
          label: 'Requests 24h',
          value: deployment.requests24h,
          delta: idle ? (
            <Text as="span" color="fg.muted">
              no traffic while {deployment.status.toLowerCase()}
            </Text>
          ) : (
            <Text as="span" color="fg.success">
              ▲ 6.2% vs yesterday
            </Text>
          ),
        },
        {
          label: 'p95 latency',
          value: deployment.latencyP95,
          delta: idle ? undefined : (
            <Text as="span" color="fg.success">
              ▼ 8 ms vs yesterday
            </Text>
          ),
        },
        {
          label: 'Error rate',
          value: deployment.errorRate,
          delta: idle ? undefined : (
            <Text as="span" color="fg.muted">
              within 0.5% budget
            </Text>
          ),
        },
        {
          label: 'Cost today',
          value: deployment.costPerDay,
          delta: (
            <Text as="span" color="fg.muted">
              {deployment.activeReplicas} / {deployment.maxReplicas} replicas
              active
            </Text>
          ),
        },
      ]}
    />
  )
}
