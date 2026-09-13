import { AlertTriangle, CheckCircle2, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Dataset, DatasetDetailMock } from '@/features/dashboard/data'

import { downloadJson } from './helpers'

export function QualityTab({
  dataset,
  detail,
}: {
  dataset: Dataset
  detail: DatasetDetailMock
}) {
  return (
    <Card size="lg">
      <CardHeader>
        <CardTitle>Quality report</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        {detail.healthChecks.map((check) => (
          <div
            key={check.label}
            className={`flex items-start gap-3 rounded-lg border p-3 ${
              check.status === 'pass'
                ? 'border-emerald-200 bg-emerald-50/60'
                : 'border-amber-200 bg-amber-50/60'
            }`}
          >
            {check.status === 'pass' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
        <Button
          variant="outline"
          className="mt-2 w-fit"
          onClick={() =>
            downloadJson(`${dataset.name}-quality.json`, {
              dataset: dataset.id,
              checks: detail.healthChecks,
            })
          }
        >
          <Download />
          Download report
        </Button>
      </CardContent>
    </Card>
  )
}
