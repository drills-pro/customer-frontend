import { Card, SimpleGrid } from '@chakra-ui/react';
import { Chart, useChart } from '@chakra-ui/charts';
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { Schemas } from '@/shared/api/client';
import { chartMotion } from '@/theme/motion';
import { CHART_COLORS } from '@/modules/training/constants';

type ProgressPoint = Schemas['ProgressPoint'];
type Row = { epoch: number } & Record<string, number>;

/** Metric names in the order the trainer first reported them, at most one per chart color. */
const metricNames = (history: ProgressPoint[]) =>
  [...new Set(history.flatMap((p) => Object.keys(p.metrics)))].slice(0, CHART_COLORS.length);

/** One chart per metric the trainer reported, epoch by epoch, two to a row. Kept after the run ends, so a failed or cancelled run
 * shows how far it got. */
export function MetricCharts({ history }: { history: ProgressPoint[] }) {
  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6" data-testid="training-progress-chart" data-points={history.length}>
      {metricNames(history).map((name, i) => (
        <MetricChart key={name} name={name} color={CHART_COLORS[i]} history={history} />
      ))}
    </SimpleGrid>
  );
}

function MetricChart({ name, color, history }: { name: string; color: string; history: ProgressPoint[] }) {
  const chart = useChart<Row>({
    data: history.filter((p) => name in p.metrics).map((p) => ({ ...p.metrics, epoch: p.epoch })),
    series: [{ name, color, label: name }],
  });
  const tick = { fill: chart.color('ink-muted'), fontFamily: 'var(--chakra-fonts-mono)', fontSize: 12 };
  const axis = { tick, tickLine: false, axisLine: { stroke: chart.color('line-strong') } };
  return (
    <Card.Root variant="outline" minW="0" data-testid={`training-metric-chart-${name}`}>
      <Card.Header>
        <Card.Title as="h3" textStyle="body" fontWeight="semibold" fontFamily="mono">
          {name}
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <Chart.Root h="52" chart={chart}>
          <LineChart responsive data={chart.data} accessibilityLayer>
            <CartesianGrid stroke={chart.color('line')} vertical={false} />
            <XAxis dataKey={chart.key('epoch')} allowDecimals={false} {...axis} />
            <YAxis width={40} {...axis} />
            <Tooltip cursor={{ stroke: chart.color('line-strong'), strokeWidth: 1 }} content={<Chart.Tooltip />} />
            <Line
              dataKey={chart.key(name)}
              type="linear"
              stroke={chart.color(color)}
              strokeWidth={2}
              dot={chart.data.length === 1}
              {...chartMotion}
            />
          </LineChart>
        </Chart.Root>
      </Card.Body>
    </Card.Root>
  );
}
