import { Box, Card, Flex, SimpleGrid, Skeleton, Text } from '@chakra-ui/react';

import type { ApiMetricKey } from '@/features/dashboard/api';
import { compactCount, metricChange, sparklinePoints } from '@/features/dashboard/format';
import { useDashboardSummary, useMetricHistory } from '@/features/dashboard/queries';

const HISTORY_DAYS = 30;

const changeColor = {
  up: 'fg.success',
  down: 'fg.error',
  flat: 'fg.muted',
} as const;

const changeArrow = { up: '▲', down: '▼', flat: '■' } as const;

export function WorkspaceMetrics() {
  const { data, isPending } = useDashboardSummary();
  const history = useMetricHistory(HISTORY_DAYS);
  const metrics = data?.metrics;

  // The counts are live from core-api; the trend and sparkline beside each
  // come from the metric history.
  const cards: Array<{
    key: ApiMetricKey;
    title: string;
    value: string | undefined;
    format: (value: number) => string;
  }> = [
    {
      key: 'active_projects',
      title: 'Active Projects',
      value: metrics && String(metrics.active_projects),
      format: String,
    },
    {
      key: 'trainings_running',
      title: 'Trainings Running',
      value: metrics && String(metrics.trainings_running),
      format: String,
    },
    {
      key: 'models_deployed',
      title: 'Models Deployed',
      value: metrics && String(metrics.models_deployed),
      format: String,
    },
    {
      key: 'inference_calls',
      title: 'Inference Calls',
      value: metrics && compactCount(metrics.inference_calls_30d),
      format: compactCount,
    },
  ];

  return (
    <SimpleGrid as="section" aria-label="Workspace metrics" columns={{ base: 1, sm: 2, xl: 4 }} gap="4">
      {cards.map(({ key, title, value, format }) => {
        const series = history.data?.metrics[key];
        const values = series?.points.map((point) => point.value) ?? [];
        const change = series && metricChange(series);

        return (
          <Card.Root key={key} variant="outline">
            <Flex align="flex-end" justify="space-between" p="5">
              <Flex direction="column">
                <Text textStyle="body-sm" color="fg.muted">
                  {title}
                </Text>
                {isPending ? (
                  <Skeleton mt="2" h="9" w="16" />
                ) : (
                  <Text mt="2" fontSize="3xl" fontWeight="semibold" letterSpacing="tight" lineHeight="short">
                    {/* A dash when the request failed; the cards below say why. */}
                    {value ?? '—'}
                  </Text>
                )}
                {history.isPending ? (
                  <Skeleton mt="2" h="4" w="24" />
                ) : (
                  change && (
                    <Text mt="2" fontSize="xs">
                      <Text as="span" fontWeight="medium" color={changeColor[change.direction]}>
                        {changeArrow[change.direction]} {change.label}
                      </Text>{' '}
                      <Text as="span" color="fg.muted">
                        vs last {HISTORY_DAYS}d
                      </Text>
                    </Text>
                  )
                )}
              </Flex>
              {history.isPending ? (
                <Skeleton h="8" w="24" />
              ) : (
                values.length > 0 && (
                  <Box asChild h="8" w="24" color="brand-text">
                    <svg
                      viewBox="0 0 100 34"
                      role="img"
                      aria-label={`${title}, last ${HISTORY_DAYS} days: ${format(values[0])} to ${format(values[values.length - 1])}`}
                    >
                      <polyline
                        points={sparklinePoints(values)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Box>
                )
              )}
            </Flex>
          </Card.Root>
        );
      })}
    </SimpleGrid>
  );
}
