import { CheckCircle2, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from 'cn'
import type { QualitySeverity } from '@/features/dashboard/data'
import { unavailable } from '@/lib/unavailable'

import { downloadJson, getQualityScore, getQualityStatus } from './helpers'
import type { DatasetTab } from './types'
import { useCurrentDataset } from './use-current-dataset'

const SEVERITY_RANK: Record<QualitySeverity, number> = {
  error: 0,
  warning: 1,
  pass: 2,
}

const SEVERITY_STYLES: Record<Exclude<QualitySeverity, 'pass'>, string> = {
  error: 'border-destructive/60 bg-destructive-muted/60',
  warning: 'border-warning/60 bg-warning-muted/60',
}

export function QualityTab({
  onNavigateTab,
}: {
  onNavigateTab: (tab: DatasetTab) => void
}) {
  const { dataset, detail } = useCurrentDataset()
  const { findings, lastChecked } = detail.qualityReport
  const score = getQualityScore(findings)
  const status = getQualityStatus(score)

  const issues = findings
    .filter((finding) => finding.severity !== 'pass')
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
  const passed = findings.filter((finding) => finding.severity === 'pass')

  return (
    <Card size="lg">
      <CardHeader>
        <CardTitle>Quality report</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
          <p className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {score}
            </span>
            <span className="text-lg text-muted-foreground">/ 100</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {status.label}
            {issues.length > 0 &&
              ` — lowered by ${issues.length} finding${issues.length === 1 ? '' : 's'} below`}
          </p>
          <QualityGauge score={score} />
        </div>

        {issues.length > 0 && (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Findings, ranked by impact
            </p>
            <div className="grid gap-3">
              {issues.map((finding) => (
                <div
                  key={finding.title}
                  className={cn(
                    'border-l-4 rounded-r-lg border-y border-r border-y-transparent border-r-transparent p-3',
                    SEVERITY_STYLES[finding.severity as 'error' | 'warning'],
                  )}
                >
                  <p className="font-medium text-foreground">{finding.title}</p>
                  {finding.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {finding.description}
                    </p>
                  )}
                  {finding.action && (
                    <Button
                      type="button"
                      variant="link"
                      className="mt-1"
                      onClick={() =>
                        finding.action?.tab
                          ? onNavigateTab(finding.action.tab)
                          : unavailable(finding.action?.label ?? '')
                      }
                    >
                      {finding.action.label}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {passed.length > 0 && (
          <div className="grid gap-2">
            {passed.map((finding) => (
              <div
                key={finding.title}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="size-4 shrink-0 text-success" />
                <span>{finding.title}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4 text-sm">
          <span className="text-muted-foreground">
            Last checked {lastChecked}
          </span>
          <Button
            variant="link"
            onClick={() =>
              downloadJson(`${dataset.name}-quality.json`, {
                dataset: dataset.id,
                score,
                status: status.label,
                findings,
              })
            }
          >
            <Download />
            Download full report
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function QualityGauge({ score }: { score: number }) {
  return (
    <div className="mt-4">
      <div className="relative pt-2.5">
        <div
          className="absolute top-0 h-2.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${score}%` }}
        />
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-destructive via-warning to-success" />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
        <span>Poor</span>
        <span>Needs attention</span>
        <span>Ready</span>
      </div>
    </div>
  )
}
