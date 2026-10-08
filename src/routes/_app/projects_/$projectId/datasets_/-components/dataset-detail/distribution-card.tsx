import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useCurrentDataset } from './use-current-dataset'

export function DistributionCard() {
  const { dataset, detail } = useCurrentDataset()
  const { distribution } = detail
  const title =
    dataset.modality === 'text' ? 'Label distribution' : 'Class distribution'
  const maximum = Math.max(...distribution.map((item) => item.count), 1)
  return (
    <Card size="lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {distribution.length ? (
          distribution.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                <span>{item.label}</span>
                <span className="text-muted-foreground">
                  {item.count.toLocaleString('en-US')}
                </span>
              </div>
              <Progress value={(item.count / maximum) * 100} />
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Distribution will appear after samples are processed.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
