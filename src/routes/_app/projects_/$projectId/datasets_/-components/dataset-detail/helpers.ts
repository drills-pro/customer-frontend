import type { Dataset, DatasetDetailMock } from '@/features/dashboard/data'

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

export function fallbackDetail(dataset: Dataset): DatasetDetailMock {
  return {
    samples: [],
    distribution: [],
    healthChecks: [
      { status: 'pass', label: 'Source files available' },
      { status: 'pass', label: 'Metadata validated' },
    ],
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
