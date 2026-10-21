import { Box, Center, Code, Flex, Grid, Link, Progress, Stack, Table, Text } from '@chakra-ui/react';
import type { FlexProps } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { Link as RouterLink } from '@tanstack/react-router';
import { Box as BoxIcon, ChevronDown, Cpu, Database } from 'lucide-react';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { SectionCard } from '@/components/shared/section-card';
import { formatAccuracy } from '../../../-components/model-list';
import { useCurrentModel } from './use-current-model';

/** Below this, a class is worth investigating before the model ships. */
const WEAK_CLASS_ACCURACY = 85;

/**
 * The three lineage steps point at three different routes, so each caller owns
 * its own link and this only supplies the shared box.
 */
function LineageStep(props: FlexProps) {
  return (
    <Flex minW="0" align="center" gap="3" rounded="l2" px="3" py="2.5" textDecoration="none" transition="background 0.15s" {...props} />
  );
}

function LineageBody({
  icon: Icon,
  title,
  description,
  current = false,
}: {
  icon: typeof BoxIcon;
  title: string;
  description: string;
  current?: boolean;
}) {
  return (
    <>
      <Center boxSize="8" flexShrink={0} rounded="l2" bg={current ? 'brand' : 'bg.muted'} color={current ? 'on-brand' : 'fg.muted'}>
        <Icon size={16} />
      </Center>
      <Box minW="0">
        <Text truncate fontFamily="mono" fontSize="13px" fontWeight="semibold" color={current ? 'brand-text' : 'fg'}>
          {title}
        </Text>
        <Text truncate fontSize="11px" color="fg.muted">
          {description}
        </Text>
      </Box>
    </>
  );
}

function LineageArrow() {
  return (
    <Box ms="7" color="fg.muted" aria-hidden="true">
      <ChevronDown size={16} />
    </Box>
  );
}

function AccuracyChart({ data }: { data: { version: string; accuracy: number }[] }) {
  const chart = useChart({
    data,
    series: [{ name: 'accuracy', color: 'brand', label: 'Accuracy' }],
  });
  return (
    <Chart.Root chart={chart} h="52" w="full">
      <LineChart responsive data={chart.data} accessibilityLayer>
        <CartesianGrid stroke={chart.color('border')} vertical={false} />
        <XAxis dataKey={chart.key('version')} tickLine={false} axisLine={false} tick={{ fill: chart.color('fg.muted'), fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={44}
          domain={['dataMin - 2', 'dataMax + 1']}
          tick={{ fill: chart.color('fg.muted'), fontSize: 12 }}
          tickFormatter={(value: number) => `${value.toFixed(1)}%`}
        />
        <Tooltip content={<Chart.Tooltip />} />
        <Line
          dataKey={chart.key('accuracy')}
          type="monotone"
          stroke={chart.color('brand')}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: chart.color('brand') }}
          isAnimationActive={false}
        />
      </LineChart>
    </Chart.Root>
  );
}

export function OverviewTab() {
  const { model, versions, detail } = useCurrentModel();
  const history = versions.map((item) => ({
    version: `v${item.version}`,
    accuracy: item.accuracy,
  }));

  return (
    <>
      <Grid minW="0" alignItems="start" gap="6" templateColumns={{ lg: 'repeat(3, minmax(0, 1fr))' }}>
        <Box minW="0" gridColumn={{ lg: 'span 2' }}>
          <SectionCard
            title="Accuracy across versions"
            action={
              <Text fontSize="xs" color="fg.muted">
                higher is better
              </Text>
            }
          >
            <Box p="5">
              {history.length > 1 ? (
                <AccuracyChart data={history} />
              ) : (
                <EmptyNotice
                  minH="52"
                  title="Only one version so far"
                  description={`Train ${model.name} again to compare accuracy across versions.`}
                />
              )}
            </Box>
          </SectionCard>
        </Box>

        <SectionCard title="Lineage">
          <Stack gap="1" p="3">
            <Link asChild _hover={{ bg: 'bg.muted', textDecoration: 'none' }} rounded="l2">
              <RouterLink
                to="/projects/$projectId/datasets/$datasetId"
                params={{
                  projectId: model.projectId,
                  datasetId: detail.datasetId,
                }}
              >
                <LineageStep>
                  <LineageBody icon={Database} title={detail.datasetId} description="Dataset" />
                </LineageStep>
              </RouterLink>
            </Link>
            <LineageArrow />
            <Link asChild _hover={{ bg: 'bg.muted', textDecoration: 'none' }} rounded="l2">
              <RouterLink to="/projects/$projectId/training/$runId" params={{ projectId: model.projectId, runId: model.runId }}>
                <LineageStep>
                  <LineageBody icon={Cpu} title={`run ${model.runId}`} description="Training run" />
                </LineageStep>
              </RouterLink>
            </Link>
            <LineageArrow />
            <LineageStep bg="brand.subtle">
              <LineageBody icon={BoxIcon} title={`${model.name} v${model.version}`} description="This model" current />
            </LineageStep>
          </Stack>
        </SectionCard>
      </Grid>

      {detail.perClassAccuracy.length > 0 ? (
        <SectionCard
          mt="6"
          title="Per-class accuracy"
          action={
            <Text fontSize="xs" color="fg.muted">
              {detail.perClassAccuracy.length} weakest classes
            </Text>
          }
        >
          <Table.ScrollArea>
            <Table.Root variant="data" minW="560px">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader px="5">Class</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Accuracy</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">Support</Table.ColumnHeader>
                  <Table.ColumnHeader w="220px">Distribution</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {detail.perClassAccuracy.map((entry) => {
                  const weak = entry.accuracy < WEAK_CLASS_ACCURACY;
                  return (
                    <Table.Row key={entry.label}>
                      <Table.Cell px="5">
                        <Code size="sm">{entry.label}</Code>
                      </Table.Cell>
                      <Table.Cell
                        textAlign="end"
                        fontWeight="semibold"
                        fontVariantNumeric="tabular-nums"
                        color={weak ? 'fg.warning' : 'fg'}
                      >
                        {formatAccuracy(entry.accuracy)}
                      </Table.Cell>
                      <Table.Cell textAlign="end" fontVariantNumeric="tabular-nums">
                        {entry.support.toLocaleString('en-US')}
                      </Table.Cell>
                      <Table.Cell>
                        <Progress.Root size="xs" value={entry.accuracy} colorPalette={weak ? 'warning' : 'brand'}>
                          <Progress.Track aria-label={`${entry.label} accuracy`}>
                            <Progress.Range />
                          </Progress.Track>
                        </Progress.Root>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        </SectionCard>
      ) : null}
    </>
  );
}
