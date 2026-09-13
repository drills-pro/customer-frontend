import { toast } from 'sonner'

import type {
  ClassCount,
  Dataset,
  DatasetDetailMock,
  QualityFinding,
  QualitySeverity,
} from '@/features/dashboard/data'

export function unavailable(label: string) {
  toast.info(`${label} is not available in this dashboard demo.`)
}

export function downloadJson(filename: string, value: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  )
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function itemNoun(dataset: Dataset) {
  return dataset.modality === 'image'
    ? 'images'
    : dataset.modality === 'text'
      ? 'rows'
      : 'items'
}

const QUALITY_SEVERITY_DEDUCTION: Record<QualitySeverity, number> = {
  pass: 0,
  warning: 14,
  error: 25,
}

export function getQualityScore(findings: QualityFinding[]) {
  const deduction = findings.reduce(
    (sum, finding) => sum + QUALITY_SEVERITY_DEDUCTION[finding.severity],
    0,
  )
  return Math.max(0, 100 - deduction)
}

export function getQualityStatus(score: number) {
  if (score >= 85) return { label: 'Ready', tone: 'success' } as const
  if (score >= 60) return { label: 'Needs attention', tone: 'warning' } as const
  return { label: 'Poor', tone: 'error' } as const
}

export function getClassStats(classes: ClassCount[]) {
  if (!classes.length) return null

  const counts = classes.map((item) => item.count)
  const sorted = [...counts].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const median =
    sorted.length % 2 === 0
      ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
      : sorted[middle]
  const largest = classes.reduce((top, item) =>
    item.count > top.count ? item : top,
  )
  const smallest = classes.reduce((low, item) =>
    item.count < low.count ? item : low,
  )

  return {
    avg: Math.round(
      counts.reduce((sum, count) => sum + count, 0) / counts.length,
    ),
    median,
    largest,
    smallest,
    ratio: Math.round((largest.count / smallest.count) * 10) / 10,
  }
}

export function getClassHistogram(classes: ClassCount[], bucketCount = 5) {
  if (!classes.length) return []

  const counts = classes.map((item) => item.count)
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  const size = Math.max(1, Math.ceil((max - min + 1) / bucketCount))

  return Array.from({ length: bucketCount }, (_, index) => {
    const from = min + index * size
    const to = from + size - 1
    const names = classes
      .filter((item) => item.count >= from && item.count <= to)
      .map((item) => item.name)
    return { label: `${from}–${to}`, classes: names.length, names }
  })
}

function fallbackComposition(
  dataset: Dataset,
): DatasetDetailMock['composition'] {
  if (dataset.modality === 'image')
    return { fileFormat: 'JPEG', avgDimensions: { width: 1024, height: 768 } }
  if (dataset.modality === 'text') return { fileFormat: 'CSV' }
  return { fileFormat: 'Parquet' }
}

export function fallbackDetail(dataset: Dataset): DatasetDetailMock {
  return {
    samples: [],
    distribution: [],
    classDistribution: [],
    composition: fallbackComposition(dataset),
    healthChecks: [
      { status: 'pass', label: 'Source files available' },
      { status: 'pass', label: 'Metadata validated' },
    ],
    qualityReport: {
      lastChecked: 'Not yet checked',
      findings: [
        {
          dimension: 'integrity',
          severity: 'pass',
          title: 'Source files available',
        },
        {
          dimension: 'metadata',
          severity: 'pass',
          title: 'Metadata validated',
        },
      ],
    },
    splitDistribution: [
      { label: 'Train', percent: dataset.split === 'Train' ? 100 : 0 },
      {
        label: 'Validation',
        percent: dataset.split === 'Validation' ? 100 : 0,
      },
      { label: 'Test', percent: dataset.split === 'Test' ? 100 : 0 },
    ],
    versions: [
      {
        version: dataset.version,
        items: dataset.items,
        created: dataset.created,
      },
    ],
  }
}
