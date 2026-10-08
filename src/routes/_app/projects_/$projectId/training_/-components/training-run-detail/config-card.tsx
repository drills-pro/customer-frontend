import { Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { downloadText } from './helpers'
import { useCurrentTrainingRun } from './use-current-training-run'

export function ConfigCard() {
  const { run, dataset } = useCurrentTrainingRun()
  const config = {
    dataset: dataset?.name ?? run.datasetId,
    architecture: run.architecture,
    epochs: run.epochs,
    batchSize: run.batchSize,
    split: `${run.split.train}% / ${run.split.validation}% / ${run.split.test}%`,
    learningRate: run.learningRate,
    scheduler: run.scheduler,
    augmentations: run.augmentations,
    earlyStopping: run.earlyStopping,
    instance: run.instanceName,
    spot: run.spot,
    estimatedCost: run.estimatedCost,
  }
  return (
    <Card size="flush">
      <CardHeader className="flex-row items-center border-b">
        <CardTitle className="mr-auto">Saved configuration</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadText(
              `${run.name}-config.json`,
              JSON.stringify(config, null, 2),
              'application/json',
            )
          }
        >
          <Download />
          Download
        </Button>
      </CardHeader>
      <CardContent className="grid gap-0 p-5 sm:grid-cols-2 sm:gap-x-8">
        {Object.entries(config).map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between gap-4 border-b py-2 text-sm"
          >
            <span className="capitalize text-muted-foreground">
              {label.replace(/([A-Z])/g, ' $1')}
            </span>
            <span className="max-w-[60%] text-right font-medium">
              {Array.isArray(value)
                ? value.join(', ') || 'None'
                : typeof value === 'boolean'
                  ? value
                    ? 'Enabled'
                    : 'Disabled'
                  : String(value)}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
