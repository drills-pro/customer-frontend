import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Rocket } from 'lucide-react'

import { EmptyNotice } from '@/components/shared/empty-notice'
import { SectionAction, SectionCard } from '@/components/shared/section-card'
import { ToneBadge } from '@/components/shared/tone-badge'
import { deploymentPlaceholders } from '@/features/dashboard/placeholders'
import { useDashboardSummary } from '@/features/dashboard/queries'
import type { ApiDeployment } from '@/features/dashboard/api'
import { unavailable } from '@/lib/unavailable'
import { CardError, CardLoading } from './card-states'

const deploymentStatus = {
  active: { label: 'Live', tone: 'success' },
  deploying: { label: 'Deploying', tone: 'warning' },
  failed: { label: 'Failed', tone: 'error' },
} as const satisfies Record<ApiDeployment['status'], unknown>

export function DeploymentHealthCard() {
  const { data, error, isPending, refetch } = useDashboardSummary()
  const deployments = data?.deployments ?? []

  return (
    <SectionCard title="Deployment health">
      {isPending ? (
        <CardLoading />
      ) : error ? (
        <CardError
          title="Could not load deployments"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : deployments.length ? (
        <Stack role="list" gap="0">
          {deployments.slice(0, 3).map((deployment) => {
            const status = deploymentStatus[deployment.status]
            return (
              <Flex
                key={deployment.id}
                role="listitem"
                align="center"
                justify="space-between"
                gap="3"
                px="5"
                py="3"
                borderBottomWidth="1px"
                borderColor="border"
                _last={{ borderBottomWidth: '0' }}
              >
                <Box minW="0">
                  {/* The deployment page still reads mock data, so no link yet. */}
                  <SectionAction
                    fontWeight="semibold"
                    color="fg"
                    _hover={{ color: 'brand-text' }}
                    onClick={() => unavailable(deployment.route_prefix)}
                  >
                    {deployment.route_prefix}
                  </SectionAction>
                  <Text fontSize="xs" color="fg.muted">
                    p95 {deploymentPlaceholders.latencyP95} · err{' '}
                    {deploymentPlaceholders.errorRate}
                  </Text>
                </Box>
                <ToneBadge
                  tone={status.tone}
                  dot
                  pulse={deployment.status === 'active'}
                >
                  {status.label}
                </ToneBadge>
              </Flex>
            )
          })}
        </Stack>
      ) : (
        <EmptyNotice
          icon={<Rocket />}
          title="No deployments"
          description="Deployed models will appear here."
          minH="36"
        />
      )}
    </SectionCard>
  )
}
