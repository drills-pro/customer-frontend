import * as React from 'react';
import { Box, Card, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { Bar, BarChart, Cell, Tooltip, XAxis } from 'recharts';

import { SimpleSelect } from '@/components/simple-select';
import { useProjectDetail } from '@/features/dashboard/context';
import type { ResourceUsage, UsagePeriod } from '@/features/dashboard/data';
import { formatUsageValue, getUsageSummary, usageRangeLabel } from './project-overview';

/** Horizontal room reserved per bar; wider series scroll instead of squashing. */
const BAR_SLOT = 36;

export function ResourceUsageCard({ ref, inView }: { ref?: React.Ref<HTMLDivElement>; inView: boolean }) {
  const resources = useProjectDetail().details.resourceUsage;
  const [period, setPeriod] = React.useState<UsagePeriod>('day');

  return (
    // minW 0 all the way down so the scrolling chart clips instead of
    // stretching the card past its grid column.
    <Card.Root ref={ref} as="section" aria-labelledby="resource-usage-title" variant="outline" minW="0">
      <Flex align="center" justify="space-between" gap="3" px="5" pt="5" pb="4">
        <Card.Title as="h2" id="resource-usage-title" textStyle="body" fontWeight="semibold">
          Resource usage
        </Card.Title>
        <SimpleSelect
          label="Usage interval"
          hideLabel
          size="sm"
          width="24"
          value={period}
          onChange={(value) => setPeriod(value as UsagePeriod)}
          items={[
            { label: 'Day', value: 'day' },
            { label: 'Week', value: 'week' },
            { label: 'Month', value: 'month' },
          ]}
        />
      </Flex>
      <Stack minW="0" gap="5" px="5" pb="5">
        {resources.map((resource, index) => (
          <Box
            as="section"
            key={resource.id}
            minW="0"
            borderTopWidth={index === 0 ? '0' : '1px'}
            borderColor="border"
            pt={index === 0 ? '0' : '5'}
          >
            <Flex align="flex-start" justify="space-between" gap="4" fontSize="xs">
              <Box>
                <Heading as="h3" fontSize="xs" fontWeight="medium">
                  {resource.label}
                </Heading>
                <Text mt="1" color="fg.muted">
                  {resource.description}, {usageRangeLabel(resource, period)}
                </Text>
              </Box>
              <Text as="strong" whiteSpace="nowrap" fontWeight="medium" color="fg.muted">
                {formatUsageValue(getUsageSummary(resource, period))} / {resource.limit} {resource.unit}
              </Text>
            </Flex>
            <ResourceUsageChart resource={resource} period={period} inView={inView} />
          </Box>
        ))}
      </Stack>
    </Card.Root>
  );
}

function ResourceUsageChart({ resource, period, inView }: { resource: ResourceUsage; period: UsagePeriod; inView: boolean }) {
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const points = resource.series[period];

  // Open on the most recent bar — the one drawn at full opacity. Recharts sizes
  // itself after layout, so keep the chart pinned to its right edge through
  // those resizes, and let go as soon as the reader scrolls it themselves.
  React.useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let pinned = true;
    const pinToLatest = () => {
      if (pinned) scroller.scrollLeft = scroller.scrollWidth;
    };
    const release = () => {
      pinned = false;
    };

    pinToLatest();
    const observer = new ResizeObserver(pinToLatest);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    scroller.addEventListener('pointerdown', release);
    scroller.addEventListener('wheel', release, { passive: true });
    scroller.addEventListener('keydown', release);

    return () => {
      observer.disconnect();
      scroller.removeEventListener('pointerdown', release);
      scroller.removeEventListener('wheel', release);
      scroller.removeEventListener('keydown', release);
    };
  }, [period, points.length]);

  const chart = useChart({
    data: points,
    // The resource's own color, from the API.
    series: [{ name: 'value', color: resource.color, label: resource.label }],
  });

  return (
    <Box ref={scrollerRef} mt="3" overflowX="auto" overflowY="hidden" data-testid={`usage-scroller-${resource.id}`}>
      <Chart.Root
        chart={chart}
        h="28"
        w="full"
        minW={`${points.length * BAR_SLOT}px`}
        role="img"
        aria-label={`${resource.label} usage for the ${usageRangeLabel(resource, period)}`}
        data-testid={`usage-chart-${resource.id}`}
      >
        <BarChart
          key={inView ? 'visible' : 'pending'}
          responsive
          data={chart.data}
          accessibilityLayer
          margin={{ top: 8, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis
            dataKey={chart.key('label')}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fill: chart.color('fg.muted'), fontSize: 12 }}
            tickFormatter={(label: string) => points.find((point) => point.label === label)?.shortLabel ?? label}
          />
          <Tooltip
            cursor={false}
            content={
              <Chart.Tooltip
                labelFormatter={(_, payload) => payload[0]?.payload.label}
                formatter={(value) => (
                  <Flex minW="32" align="center" justify="space-between" gap="4">
                    <Text as="span" color="fg.muted">
                      {resource.label}
                    </Text>
                    <Text as="span" fontFamily="mono" fontWeight="medium" fontVariantNumeric="tabular-nums">
                      {formatUsageValue(Number(value))} {resource.unit}
                    </Text>
                  </Flex>
                )}
              />
            }
          />
          <Bar dataKey={chart.key('value')} radius={[4, 4, 1, 1]} isAnimationActive={inView}>
            {points.map((point, index) => (
              <Cell key={point.label} fill={chart.color(resource.color)} fillOpacity={index === points.length - 1 ? 1 : 0.18} />
            ))}
          </Bar>
        </BarChart>
      </Chart.Root>
    </Box>
  );
}
