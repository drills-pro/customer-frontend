import { Badge, Box, Card, HStack, SimpleGrid, Text } from '@chakra-ui/react';
import { BarList, BarSegment, Chart, useChart, type BarListData } from '@chakra-ui/charts';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  RadialBar,
  RadialBarChart,
  Radar,
  RadarChart,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { InView } from '../../components/in-view';
import { chartMotion } from '../../theme/motion';
import { Check, Page, Section, Tri } from '../parts';

// Chart rules (see the Charts section of the design system): chart-1..6 for series, 2px strokes, flat tints, no smoothing,
// marks grow on the theme's gentle bounce (chartMotion), hairline horizontal grid, mono ticks, a dash pattern per series so color is never the only cue.
const ANIM = chartMotion;
const DASH = [undefined, '6 3', '2 3', '8 3 2 3', '1 3', '10 3'];
type Colors = { color: (token: string) => string };
const tick = (c: Colors) => ({ fill: c.color('ink-muted'), fontFamily: 'var(--chakra-fonts-mono)', fontSize: 12 });
const axis = (c: Colors) => ({ tick: tick(c), tickLine: false, axisLine: { stroke: c.color('line-strong') } });
const grid = (c: Colors) => <CartesianGrid stroke={c.color('line')} vertical={false} />;
const cursor = (c: Colors) => ({ stroke: c.color('line-strong'), strokeWidth: 1 });
const legend = <Legend content={<Chart.Legend />} />;

const KeyList = ({ items }: { items: { name: string; color: string; value: number }[] }) => (
  <HStack wrap="wrap" gap="4" justify="center">
    {items.map((i) => (
      <HStack key={i.name} gap="2">
        <Box boxSize="3" bg={i.color} borderWidth="2px" borderColor="outline" aria-hidden />
        <Text textStyle="body-sm">{i.name}</Text>
        <Text textStyle="body-sm" fontFamily="mono" color="fg.muted">
          {i.value.toLocaleString()}
        </Text>
      </HStack>
    ))}
  </HStack>
);

const Panel = ({ title, caption, children }: { title: string; caption: string; children: React.ReactNode }) => (
  <Section title={title}>
    <Card.Root>
      <Card.Body gap="4">
        <Text color="fg.muted" textStyle="body-sm">
          {caption}
        </Text>
        <InView>{children}</InView>
      </Card.Body>
    </Card.Root>
  </Section>
);

// ---- Fixtures: shaped like what the usage and training endpoints will return.
const training = Array.from({ length: 20 }, (_, i) => {
  const p = (i + 1) * 5;
  return {
    progress: p,
    train: +(1.6 * Math.exp(-p / 30) + 0.12).toFixed(2),
    test: +(1.7 * Math.exp(-p / 32) + 0.2 + (i % 4 === 3 ? 0.05 : 0)).toFixed(2),
  };
});

let [tr, inf, ev] = [0, 0, 0];
const gpu = Array.from({ length: 30 }, (_, k) => {
  tr += 1.4 + ((k * 7) % 5) * 0.3;
  inf += 1.1 + ((k * 3) % 4) * 0.25;
  ev += 0.35 + ((k * 5) % 3) * 0.1;
  return { day: k + 1, training: +tr.toFixed(1), inference: +inf.toFixed(1), evaluation: +ev.toFixed(1) };
});

const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => ({
  day,
  detector: 1200 + ((i * 370) % 900),
  labeler: 400 + ((i * 210) % 500),
  sorter: 250 + ((i * 130) % 300),
}));

const hourly = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(i * 2).padStart(2, '0')}:00`,
  requests: 300 + ((i * 173) % 700),
  p95: 90 + ((i * 41) % 80),
}));

const topEndpoints: BarListData[] = [
  { name: 'defect-detector', value: 8420 },
  { name: 'label-assist', value: 3110 },
  { name: 'part-sorter', value: 1780 },
  { name: 'pallet-counter', value: 960 },
];

const classCounts = [
  { name: 'Scratch', value: 412, color: 'class-1' },
  { name: 'Dent', value: 268, color: 'class-2' },
  { name: 'Crack', value: 190, color: 'class-3' },
  { name: 'Rust', value: 154, color: 'class-4' },
  { name: 'Stain', value: 96, color: 'class-5' },
  { name: 'Chip', value: 61, color: 'class-6' },
];

const outcomes = [
  { band: 'Sure (90%+)', value: 6240, color: 'chart-1' },
  { band: 'Likely (60-90%)', value: 2310, color: 'chart-2' },
  { band: 'Unsure (<60%)', value: 870, color: 'chart-3' },
];

const perClass = classCounts.map((c, i) => ({ class: c.name, v3: 62 + ((i * 9) % 22), v4: 74 + ((i * 7) % 20) }));

const scatter = (n: number, slope: number, base: number) =>
  Array.from({ length: 22 }, (_, i) => {
    const mp = 0.4 + ((i * 37 + n * 11) % 70) / 10;
    return { mp: +mp.toFixed(1), ms: Math.round(base + mp * slope + (((i * 53 + n) % 17) - 8) * 2) };
  });
const latency: Record<string, { mp: number; ms: number }[]> = {
  'defect-detector': scatter(1, 14, 40),
  'part-sorter': scatter(2, 8, 28),
  'pallet-counter': scatter(3, 20, 55),
};

const spark = (seed: number) => Array.from({ length: 16 }, (_, i) => ({ i, v: 40 + ((i * seed) % 23) + i * 1.5 }));

// ---- Stat tiles with sparklines
function Stat({
  label,
  value,
  delta,
  good,
  seed,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  good: boolean;
  seed: number;
  color: string;
}) {
  const chart = useChart({ data: spark(seed), series: [{ name: 'v', color }] });
  return (
    <Card.Root>
      <Card.Body gap="2">
        <Text textStyle="label" color="fg.muted">
          {label}
        </Text>
        <Text textStyle="h2" fontFamily="mono">
          {value}
        </Text>
        <Badge alignSelf="start" colorPalette={good ? 'success' : 'warning'} variant="subtle">
          {good ? <Check /> : <Tri />}
          {delta}
        </Badge>
        <InView>
          <Chart.Root h="12" chart={chart}>
            <AreaChart responsive data={chart.data}>
              <Area
                dataKey="v"
                type="linear"
                stroke={chart.color(color)}
                strokeWidth={2}
                fill={chart.color(color)}
                fillOpacity={0.2}
                dot={false}
                {...ANIM}
              />
            </AreaChart>
          </Chart.Root>
        </InView>
      </Card.Body>
    </Card.Root>
  );
}

function TrainingLine() {
  const chart = useChart({
    data: training,
    series: [
      { name: 'train', color: 'chart-1', label: 'Training photos' },
      { name: 'test', color: 'chart-2', label: 'Test photos' },
    ],
  });
  return (
    <Chart.Root h="72" chart={chart}>
      <LineChart responsive data={chart.data}>
        {grid(chart)}
        <XAxis dataKey="progress" tickFormatter={(v) => `${v}%`} {...axis(chart)} />
        <YAxis {...axis(chart)} width={36} />
        <Tooltip cursor={cursor(chart)} content={<Chart.Tooltip />} />
        {legend}
        {chart.series.map((s, i) => (
          <Line
            key={s.name}
            dataKey={chart.key(s.name)}
            type="linear"
            stroke={chart.color(s.color)}
            strokeWidth={2}
            strokeDasharray={DASH[i]}
            dot={false}
            {...ANIM}
          />
        ))}
      </LineChart>
    </Chart.Root>
  );
}

function GpuArea() {
  const chart = useChart({
    data: gpu,
    series: [
      { name: 'training', color: 'chart-1', label: 'Training', stackId: 'a' },
      { name: 'inference', color: 'chart-2', label: 'Inference', stackId: 'a' },
      { name: 'evaluation', color: 'chart-3', label: 'Evaluation', stackId: 'a' },
    ],
  });
  return (
    <Chart.Root h="72" chart={chart}>
      <AreaChart responsive data={chart.data}>
        {grid(chart)}
        <XAxis dataKey="day" tickFormatter={(v) => `Day ${v}`} interval={4} {...axis(chart)} />
        <YAxis {...axis(chart)} width={36} domain={[0, 150]} ticks={[0, 50, 100, 150]} />
        <Tooltip cursor={cursor(chart)} content={<Chart.Tooltip showTotal />} />
        {legend}
        <ReferenceLine
          y={100}
          stroke={chart.color('danger')}
          strokeWidth={2}
          strokeDasharray="6 3"
          label={{ value: 'Free: 100 GPU-min', fill: chart.color('danger'), fontSize: 12, position: 'insideTopLeft' }}
        />
        {chart.series.map((s, i) => (
          <Area
            key={s.name}
            dataKey={chart.key(s.name)}
            type="linear"
            stackId="a"
            stroke={chart.color(s.color)}
            strokeWidth={2}
            strokeDasharray={DASH[i]}
            fill={chart.color(s.color)}
            fillOpacity={0.2}
            {...ANIM}
          />
        ))}
      </AreaChart>
    </Chart.Root>
  );
}

function RequestsBar({ stacked }: { stacked: boolean }) {
  const chart = useChart({
    data: week,
    series: [
      { name: 'detector', color: 'chart-1', label: 'defect-detector', ...(stacked && { stackId: 'a' }) },
      { name: 'labeler', color: 'chart-2', label: 'label-assist', ...(stacked && { stackId: 'a' }) },
      { name: 'sorter', color: 'chart-3', label: 'part-sorter', ...(stacked && { stackId: 'a' }) },
    ],
  });
  return (
    <Chart.Root h="64" chart={chart}>
      <BarChart responsive data={chart.data}>
        {grid(chart)}
        <XAxis dataKey="day" {...axis(chart)} />
        <YAxis {...axis(chart)} width={44} tickFormatter={chart.formatNumber({ notation: 'compact' })} />
        <Tooltip cursor={{ fill: chart.color('selected-bg') }} content={<Chart.Tooltip showTotal={stacked} />} />
        {legend}
        {chart.series.map((s) => (
          <Bar
            key={s.name}
            dataKey={chart.key(s.name)}
            stackId={s.stackId}
            fill={chart.color(s.color)}
            stroke={chart.color('outline')}
            strokeWidth={2}
            radius={0}
            {...ANIM}
          />
        ))}
      </BarChart>
    </Chart.Root>
  );
}

function LatencyCombo() {
  const chart = useChart({
    data: hourly,
    series: [
      { name: 'requests', color: 'chart-1', label: 'Requests', yAxisId: 'left' },
      { name: 'p95', color: 'chart-2', label: 'Slowest 5% (ms)', yAxisId: 'right' },
    ],
  });
  return (
    <Chart.Root h="64" chart={chart}>
      <ComposedChart responsive data={chart.data}>
        {grid(chart)}
        <XAxis dataKey="hour" interval={1} {...axis(chart)} />
        <YAxis yAxisId="left" {...axis(chart)} width={40} />
        <YAxis yAxisId="right" orientation="right" {...axis(chart)} width={40} tickFormatter={(v) => `${v}ms`} />
        <Tooltip cursor={{ fill: chart.color('selected-bg') }} content={<Chart.Tooltip />} />
        {legend}
        <Bar
          yAxisId="left"
          dataKey="requests"
          fill={chart.color('chart-1')}
          stroke={chart.color('outline')}
          strokeWidth={2}
          radius={0}
          {...ANIM}
        />
        <Line
          yAxisId="right"
          dataKey="p95"
          type="linear"
          stroke={chart.color('chart-2')}
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          {...ANIM}
        />
      </ComposedChart>
    </Chart.Root>
  );
}

function TopEndpoints() {
  const chart = useChart<BarListData>({
    data: topEndpoints,
    sort: { by: 'value', direction: 'desc' },
    series: [{ name: 'name', color: 'brand.subtle' }],
  });
  return (
    <BarList.Root chart={chart}>
      <BarList.Content>
        <BarList.Label title="Endpoint" flex="1">
          <BarList.Bar tooltip />
        </BarList.Label>
        <BarList.Label title="Requests" titleAlignment="end">
          <BarList.Value valueFormatter={(v) => v.toLocaleString()} />
        </BarList.Label>
      </BarList.Content>
    </BarList.Root>
  );
}

function SpendSegment() {
  const chart = useChart({
    data: [
      { name: 'Training', value: 54, color: 'chart-1' },
      { name: 'Inference', value: 31, color: 'chart-2' },
      { name: 'Storage', value: 15, color: 'chart-3' },
    ],
    sort: { by: 'value', direction: 'desc' },
  });
  return (
    <BarSegment.Root chart={chart}>
      <BarSegment.Content>
        <BarSegment.Value />
        <BarSegment.Bar tooltip />
        <BarSegment.Label />
      </BarSegment.Content>
      <BarSegment.Legend showPercent showValue />
    </BarSegment.Root>
  );
}

function Donut({ donut }: { donut: boolean }) {
  const data = donut ? classCounts : outcomes.map((o) => ({ name: o.band, value: o.value, color: o.color }));
  const chart = useChart({ data, series: [{ name: 'value' }] });
  return (
    <>
      <Chart.Root h="56" chart={chart}>
        <PieChart responsive>
          <Tooltip content={<Chart.Tooltip hideLabel />} />
          <Pie
            data={chart.data.map((d) => ({ ...d, fill: chart.color(d.color) }))}
            dataKey="value"
            nameKey="name"
            innerRadius={donut ? '60%' : 0}
            paddingAngle={0}
            stroke={chart.color('outline')}
            strokeWidth={2}
            {...ANIM}
          />
        </PieChart>
      </Chart.Root>
      <KeyList items={data} />
    </>
  );
}

function ClassRadar() {
  const chart = useChart({
    data: perClass,
    series: [
      { name: 'v3', color: 'chart-2', label: 'Version 3' },
      { name: 'v4', color: 'chart-1', label: 'Version 4' },
    ],
  });
  return (
    <Chart.Root h="64" chart={chart}>
      <RadarChart responsive data={chart.data}>
        <PolarGrid stroke={chart.color('line')} />
        <PolarAngleAxis dataKey="class" tick={tick(chart)} />
        <Tooltip content={<Chart.Tooltip />} />
        {legend}
        {chart.series.map((s, i) => (
          <Radar
            key={s.name}
            dataKey={chart.key(s.name)}
            stroke={chart.color(s.color)}
            strokeWidth={2}
            strokeDasharray={DASH[i]}
            fill={chart.color(s.color)}
            fillOpacity={0.15}
            {...ANIM}
          />
        ))}
      </RadarChart>
    </Chart.Root>
  );
}

function LatencyScatter() {
  const chart = useChart({
    data: [],
    series: [
      { name: 'defect-detector', color: 'chart-1' },
      { name: 'part-sorter', color: 'chart-2' },
      { name: 'pallet-counter', color: 'chart-3' },
    ],
  });
  const shapes = ['square', 'triangle', 'cross'] as const;
  return (
    <Chart.Root h="64" chart={chart}>
      <ScatterChart responsive>
        <CartesianGrid stroke={chart.color('line')} />
        <XAxis type="number" dataKey="mp" name="Photo size" unit=" MP" {...axis(chart)} />
        <YAxis type="number" dataKey="ms" name="Response time" unit=" ms" {...axis(chart)} width={64} />
        <ZAxis range={[48, 48]} />
        <Tooltip cursor={{ strokeDasharray: '3 3', stroke: chart.color('line-strong') }} content={<Chart.Tooltip />} />
        {legend}
        {chart.series.map((s, i) => (
          <Scatter
            key={String(s.name)}
            name={String(s.name)}
            data={latency[String(s.name)]}
            fill={chart.color(s.color)}
            shape={shapes[i]}
            {...ANIM}
          />
        ))}
      </ScatterChart>
    </Chart.Root>
  );
}

function FreeTierMeter() {
  const used = 62;
  const chart = useChart({ data: [{ name: 'Used', value: used, color: 'chart-1' }], series: [{ name: 'value' }] });
  return (
    <Box position="relative">
      <Chart.Root h="64" chart={chart}>
        <RadialBarChart responsive data={chart.data} innerRadius="70%" outerRadius="100%" startAngle={90} endAngle={-270}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar
            dataKey="value"
            background={{ fill: chart.color('surface-sunken') }}
            fill={chart.color('chart-1')}
            stroke={chart.color('outline')}
            strokeWidth={2}
            {...ANIM}
          />
        </RadialBarChart>
      </Chart.Root>
      <Box position="absolute" inset="0" display="grid" placeItems="center" pointerEvents="none">
        <Box textAlign="center">
          <Text textStyle="h2" fontFamily="mono">
            {used} / 100
          </Text>
          <Text color="fg.muted" textStyle="body-sm">
            free GPU-minutes used
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export function Charts() {
  return (
    <Page
      title="Charts"
      lead="Usage, endpoints and training results. Series use chart-1 to chart-6; label classes keep their fixed class colors."
    >
      <Section title="Today" wide>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
          <Stat label="Requests today" value="12,480" delta="8% more than yesterday" good seed={7} color="chart-1" />
          <Stat label="Slowest 5% of replies" value="142 ms" delta="Slower than last week" good={false} seed={11} color="chart-2" />
          <Stat label="Errors" value="0.4%" delta="Within target" good seed={5} color="chart-3" />
        </SimpleGrid>
      </Section>
      <Panel title="Free tier" caption="Meter against the monthly allowance. The number is in the middle; color is not the only cue.">
        <FreeTierMeter />
      </Panel>
      <Panel title="Spend split" caption="Where this month's $100 went. Segments carry a name and an amount.">
        <SpendSegment />
      </Panel>
      <Section title="Training progress" wide>
        <Card.Root>
          <Card.Body gap="4">
            <HStack justify="space-between" wrap="wrap">
              <Text color="fg.muted" textStyle="body-sm">
                Error on photos the model trained on and on photos it has not seen. Lower is better; solid and dashed lines differ by
                pattern.
              </Text>
            </HStack>
            <TrainingLine />
          </Card.Body>
        </Card.Root>
      </Section>
      <Section title="GPU-minutes this month" wide>
        <Card.Root>
          <Card.Body gap="4">
            <Text color="fg.muted" textStyle="body-sm">
              Running total by kind of work. The red line is the free allowance.
            </Text>
            <GpuArea />
          </Card.Body>
        </Card.Root>
      </Section>
      <Panel title="Requests per day, stacked" caption="Total height is all endpoints together.">
        <RequestsBar stacked />
      </Panel>
      <Panel title="Requests per day, side by side" caption="Compare endpoints on the same day.">
        <RequestsBar stacked={false} />
      </Panel>
      <Panel title="Traffic and speed" caption="Bars are requests (left axis); the dashed line is the slowest 5% of replies (right axis).">
        <LatencyCombo />
      </Panel>
      <Panel title="Top endpoints" caption="Requests in the last 7 days.">
        <TopEndpoints />
      </Panel>
      <Panel title="Photos by label" caption="Each label keeps its fixed class color, the same as on the photo.">
        <Donut donut />
      </Panel>
      <Panel title="Prediction confidence" caption="How sure the model was on the last 9,420 predictions.">
        <Donut donut={false} />
      </Panel>
      <Panel title="Accuracy by label" caption="Version 4 against version 3, in percent. Outer ring is better.">
        <ClassRadar />
      </Panel>
      <Panel title="Photo size and speed" caption="Each point is one prediction. Shapes differ per endpoint.">
        <LatencyScatter />
      </Panel>
    </Page>
  );
}
