import { Box, Button, Flex, Grid, Progress, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { SectionCard } from '@/components/shared/section-card';
import { useDeploymentMetrics } from '@/features/deployments/queries';
import { useCurrentDeployment } from './use-current-deployment';

/** Parses the leading number out of `140 ms`; `—` has none. */
function ms(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function MonitoringTab({ onEditScaling }: { onEditScaling: () => void }) {
  const { project, deployment } = useCurrentDeployment();
  const metrics = useDeploymentMetrics(project.id, deployment.id).data;
  const volumeData = (metrics?.request_volume ?? []).map((point) => ({
    hour: point.hours_ago === 0 ? 'now' : `${point.hours_ago}h ago`,
    requests: point.requests,
  }));
  const live = deployment.status === 'Live';
  /**
   * All three percentiles share one scale — p99, the slowest value shown — so
   * the bars can actually be compared against each other.
   */
  const scale = ms(deployment.latencyP99) || 1;
  const percentiles = [
    ['p50', deployment.latencyP50, 'half of requests finish faster than this'],
    ['p95', deployment.latencyP95, 'the number to quote in an SLA'],
    ['p99', deployment.latencyP99, 'the slowest 1 in 100'],
  ] as const;
  const percentilePalette = ['success', 'warning', 'danger'];

  return (
    <Grid minW="0" alignItems="start" gap="6" templateColumns={{ lg: 'repeat(3, minmax(0, 1fr))' }}>
      <Grid minW="0" gap="6" gridColumn={{ lg: 'span 2' }}>
        <SectionCard
          title="Request volume"
          action={
            <Text fontSize="xs" color="fg.muted">
              hourly · last 24h
            </Text>
          }
        >
          <Box p="5">
            {live ? (
              <RequestVolumeChart data={volumeData} />
            ) : (
              <EmptyNotice
                minH="56"
                title="No traffic"
                description={`This deployment is ${deployment.status.toLowerCase()}, so it is not receiving requests.`}
              />
            )}
          </Box>
        </SectionCard>

        <SectionCard
          title="Latency distribution"
          action={
            <Text fontSize="xs" color="fg.muted">
              scale 0 – {deployment.latencyP99}
            </Text>
          }
        >
          <Box p="5">
            {percentiles.map(([label, value, note], index) => (
              <Box key={label} mt="4" _first={{ mt: '0' }}>
                <Flex align="baseline" justify="space-between" gap="3">
                  <Text as="span" fontFamily="mono" fontSize="13px" fontWeight="medium">
                    {label}
                  </Text>
                  <Text as="span" fontSize="15px" fontWeight="semibold" fontVariantNumeric="tabular-nums">
                    {value}
                  </Text>
                </Flex>
                <Progress.Root mt="1.5" size="sm" value={live ? (ms(value) / scale) * 100 : 0} colorPalette={percentilePalette[index]}>
                  <Progress.Track aria-label={`${label} latency`}>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>
                <Text mt="1" fontSize="11px" color="fg.muted">
                  {note}
                </Text>
              </Box>
            ))}
          </Box>
        </SectionCard>
      </Grid>

      <Grid gap="6">
        <SectionCard title="Live metrics">
          <Box as="dl">
            {(
              [
                ['Requests (24h)', deployment.requests24h],
                ['p50 latency', deployment.latencyP50],
                ['p95 latency', deployment.latencyP95],
                ['p99 latency', deployment.latencyP99],
                ['Error rate', deployment.errorRate],
                ['Replicas', `${deployment.activeReplicas} / ${deployment.maxReplicas}`],
                ['Cost today', deployment.costPerDay],
              ] as const
            ).map(([label, value]) => (
              <Flex
                key={label}
                align="center"
                justify="space-between"
                gap="3"
                px="5"
                py="2.5"
                fontSize="13px"
                borderTopWidth="1px"
                borderColor="border"
                _first={{ borderTopWidth: '0' }}
              >
                <Box as="dt" color="fg.muted">
                  {label}
                </Box>
                <Box as="dd" fontWeight="medium" fontVariantNumeric="tabular-nums" color={value === '—' ? 'fg.muted' : undefined}>
                  {value}
                </Box>
              </Flex>
            ))}
          </Box>
        </SectionCard>

        <SectionCard title="Autoscaling">
          <Box p="5">
            {(
              [
                ['Min replicas', String(deployment.minReplicas)],
                ['Max replicas', String(deployment.maxReplicas)],
                ['Target concurrency', String(deployment.targetConcurrency)],
                ['Scale-down delay', `${Math.round(deployment.scaleDownDelaySeconds / 60)} min`],
              ] as const
            ).map(([label, value]) => (
              <Flex key={label} align="center" justify="space-between" py="1.5" fontSize="13px">
                <Text as="span" color="fg.muted">
                  {label}
                </Text>
                <Text as="b" fontWeight="semibold" fontVariantNumeric="tabular-nums">
                  {value}
                </Text>
              </Flex>
            ))}
            <Button variant="outline" size="sm" mt="4" w="full" onClick={onEditScaling}>
              Edit scaling
            </Button>
          </Box>
        </SectionCard>
      </Grid>
    </Grid>
  );
}

function RequestVolumeChart({ data }: { data: { hour: string; requests: number }[] }) {
  const chart = useChart({
    data,
    series: [{ name: 'requests', color: 'brand', label: 'Requests' }],
  });
  return (
    <Chart.Root chart={chart} h="56" w="full">
      <AreaChart responsive data={chart.data} accessibilityLayer>
        <CartesianGrid stroke={chart.color('border')} vertical={false} />
        <XAxis
          dataKey={chart.key('hour')}
          tickLine={false}
          axisLine={false}
          // Both ends must be labelled: "now" is the point people read.
          interval="preserveStartEnd"
          minTickGap={48}
          tick={{ fill: chart.color('fg.muted'), fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          tick={{ fill: chart.color('fg.muted'), fontSize: 12 }}
          tickFormatter={(value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : `${value}`)}
        />
        <Tooltip content={<Chart.Tooltip />} />
        <Area
          dataKey={chart.key('requests')}
          type="monotone"
          stroke={chart.color('brand')}
          strokeWidth={2.5}
          fill={chart.color('brand')}
          fillOpacity={0.14}
          isAnimationActive={false}
        />
      </AreaChart>
    </Chart.Root>
  );
}
