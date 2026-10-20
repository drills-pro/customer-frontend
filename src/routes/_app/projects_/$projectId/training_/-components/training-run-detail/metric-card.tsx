import { Box } from '@chakra-ui/react'
import { Chart, useChart } from '@chakra-ui/charts'
import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts'

import { SectionCard } from '@/components/shared/section-card'
import { useTrainingMetrics } from '@/features/training/queries'
import { useCurrentTrainingRun } from './use-current-training-run'

export function MetricCard({
  title,
  dataKey,
  color,
}: {
  title: string
  dataKey: 'loss' | 'accuracy'
  /** A theme color token, e.g. `brand`. */
  color: string
}) {
  const { project, run } = useCurrentTrainingRun()
  const metricData = useTrainingMetrics(project.id, run.id).data ?? []
  const chart = useChart({
    data: metricData,
    series: [{ name: dataKey, color, label: title }],
  })

  return (
    <SectionCard title={title}>
      <Box p="5">
        <Chart.Root chart={chart} h="52" w="full">
          <LineChart responsive data={chart.data} accessibilityLayer>
            <CartesianGrid stroke={chart.color('border')} vertical={false} />
            <XAxis
              dataKey={chart.key('epoch')}
              tickLine={false}
              axisLine={false}
              tick={{ fill: chart.color('fg.muted'), fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              tick={{ fill: chart.color('fg.muted'), fontSize: 12 }}
            />
            <Tooltip content={<Chart.Tooltip />} />
            <Line
              dataKey={chart.key(dataKey)}
              type="monotone"
              stroke={chart.color(color)}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </Chart.Root>
      </Box>
    </SectionCard>
  )
}
