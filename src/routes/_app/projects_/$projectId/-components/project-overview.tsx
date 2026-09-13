import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { FolderKanban } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type {
  ProjectOverview,
  ResourceUsage,
  UsagePeriod,
} from '@/features/dashboard/data'

/** The unit of a single bar within the selected period, not of the period. */
export const usagePeriodLabels: Record<UsagePeriod, string> = {
  day: 'hours',
  week: 'days',
  month: 'days',
}

/** e.g. "last 24 hours" — the count comes from the series so copy can't drift. */
export function usageRangeLabel(resource: ResourceUsage, period: UsagePeriod) {
  return `last ${resource.series[period].length} ${usagePeriodLabels[period]}`
}

export function unavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}

export function FactList({
  items,
}: {
  items: Array<[string, React.ReactNode]>
}) {
  return (
    <dl className="grid gap-4">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="text-right font-medium text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function serializeReadme(
  readme: NonNullable<ProjectOverview['readme']>,
  bestModel: NonNullable<ProjectOverview['bestModel']>,
  region: string,
) {
  return `\`status: production\` \`pytorch 2.4\` \`acc ${bestModel.accuracy.toFixed(1)}%\` \`${region}\`

## About

${readme.about}

## Model

| Property | Value |
| --- | --- |
| Architecture | ${readme.architecture} |
| Accuracy / F1 | ${bestModel.accuracy.toFixed(1)}% / ${bestModel.f1.toFixed(3)} |
| Latency | ${bestModel.latency} (p50, GPU) |
| Size | ${bestModel.size} |

## Quickstart

Call the live endpoint with a base64-encoded shelf image:

\`\`\`
${readme.quickstart}
\`\`\`

## Notes

${readme.notes.map((note) => `- **${note.label}:** ${note.text}`).join('\n')}
`
}

export function formatUsageValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function getUsageSummary(resource: ResourceUsage, period: UsagePeriod) {
  const values = resource.series[period].map((point) => point.value)
  return resource.aggregation === 'peak'
    ? Math.max(...values)
    : Math.round(values.reduce((total, value) => total + value, 0) * 10) / 10
}

export function ProjectNotFound({ projectId }: { projectId: string }) {
  return (
    <main
      id="dashboard-main"
      className="mx-auto flex min-h-[60vh] w-full max-w-[1440px] flex-1 items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <Card className="w-full max-w-md text-center">
        <CardContent className="flex flex-col items-center py-8">
          <span className="flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <FolderKanban />
          </span>
          <h1 className="mt-4 text-xl">Project not found</h1>
          <p className="mt-2 text-muted-foreground">
            We could not find a project with the ID “{projectId}”.
          </p>
          <Button asChild className="mt-5">
            <Link to="/projects">Return to Projects</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
