import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useTrainingMetrics } from '@/features/training/queries'
import { useCurrentTrainingRun } from './use-current-training-run'

export function MetricCard({
  title,
  dataKey,
  color,
}: {
  title: string
  dataKey: 'loss' | 'accuracy'
  color: string
}) {
  const { project, run } = useCurrentTrainingRun()
  const metricData = useTrainingMetrics(project.id, run.id).data ?? []

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <ChartContainer
          config={{ [dataKey]: { label: title, color } }}
          className="h-52 w-full aspect-auto"
        >
          <LineChart data={metricData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="epoch" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} width={36} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              dataKey={dataKey}
              type="monotone"
              stroke={`var(--color-${dataKey})`}
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
