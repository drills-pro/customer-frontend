import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { Dataset, DatasetDetailMock } from '@/features/dashboard/data'

export function StatisticsTab({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetailMock
}) {
  return (
    <div className="grid gap-6">
      <Card size="lg">
        <CardHeader>
          <CardTitle>Dataset statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {[
            ['Total items', dataset.items.toLocaleString('en-US')],
            ['Classes', dataset.classes || 'Pending'],
            ['Size', dataset.size],
            ['Split', dataset.split],
            ['Label coverage', dataset.status === 'Ready' ? '100%' : 'Pending'],
            ['Modality', dataset.modality],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 font-medium capitalize">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card size="lg">
        <CardHeader>
          <CardTitle>Split distribution</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {detail.splitDistribution.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{item.percent}%</span>
              </div>
              <Progress value={item.percent} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
