import type {
  ApiDataset,
  ApiDatasetDetail,
  ApiDatasetQuality,
  ApiDatasetSample,
  ApiDatasetStatistics,
  ApiDatasetVersion,
} from '@/features/datasets/api/types'
import { modalityForTask } from './catalog'
import { projectSeed } from './projects'
import { daysAgo, gb, hoursAgo, mb, onDate } from './units'

const seededOn = onDate('2026-06-12')

/** Every seeded project gets a train and a validation set. */
export const datasetSeed: ApiDataset[] = [
  ...projectSeed.flatMap((project, index): ApiDataset[] => {
    const modality = modalityForTask(project.task_type)
    const isRetail = project.id === 'retail'
    const isSupport = project.id === 'support'
    return [
      {
        id: `${project.id}-train`,
        project_id: project.id,
        name: isRetail
          ? 'retail-shelf-train'
          : isSupport
            ? 'support-tickets-train'
            : `${project.id}-train`,
        modality,
        split: 'train',
        item_count: isRetail ? 18420 : isSupport ? 42300 : 3200 + index * 1200,
        size_bytes: isRetail ? gb(4.2) : isSupport ? mb(8.4) : mb(520),
        class_count: isRetail ? 240 : isSupport ? 18 : 12,
        version: isRetail ? 3 : isSupport ? 2 : 1,
        status: 'ready',
        created_at: seededOn,
        files: [],
      },
      {
        id: `${project.id}-val`,
        project_id: project.id,
        name: isRetail ? 'retail-shelf-val' : `${project.id}-validation`,
        modality,
        split: 'validation',
        item_count: 2300,
        size_bytes: mb(520),
        class_count: isRetail ? 240 : 12,
        version: 1,
        status: 'ready',
        created_at: seededOn,
        files: [],
      },
    ]
  }),
  {
    id: 'retail-test',
    project_id: 'retail',
    name: 'retail-shelf-test',
    modality: 'image',
    split: 'test',
    item_count: 2300,
    size_bytes: mb(518),
    class_count: 240,
    version: 3,
    status: 'ready',
    created_at: seededOn,
    files: [],
  },
  {
    id: 'retail-raw',
    project_id: 'retail',
    name: 'shelf-v2-raw',
    modality: 'image',
    split: 'unsplit',
    item_count: 31100,
    size_bytes: gb(7.8),
    class_count: 0,
    version: 1,
    status: 'processing',
    created_at: hoursAgo(2),
    files: [],
  },
  {
    id: 'retail-legacy',
    project_id: 'retail',
    name: 'legacy-import',
    modality: 'image',
    split: 'train',
    item_count: 940,
    size_bytes: mb(180),
    class_count: 12,
    version: 1,
    status: 'error',
    created_at: daysAgo(3),
    files: [],
  },
]

const retailLabels = [
  'beverages',
  'snacks',
  'dairy',
  'produce',
  'bakery',
  'household',
] as const

const retailImageSamples: ApiDatasetSample[] = Array.from(
  { length: 24 },
  (_, index) => {
    const label = retailLabels[index % retailLabels.length]
    return {
      id: `retail-sample-${index + 1}`,
      modality: 'image',
      image_url: `/dataset-samples/retail/${label}.png`,
      label,
      split:
        index % 10 < 8 ? 'train' : index % 10 === 8 ? 'validation' : 'test',
    }
  },
)

const supportTexts: Array<[string, string, 'train' | 'validation' | 'test']> = [
  [
    'My order #48213 has not arrived yet and it has been two weeks.',
    'Shipping delay',
    'train',
  ],
  [
    'How do I reset my password? I cannot access my account anymore.',
    'Account access',
    'train',
  ],
  [
    'I was charged twice for the same order. Please refund the extra charge.',
    'Billing issue',
    'train',
  ],
  [
    'Love the new app update; everything feels much faster now!',
    'Positive feedback',
    'validation',
  ],
  [
    'The product arrived damaged and the box was crushed in transit.',
    'Damaged item',
    'train',
  ],
  [
    'Please cancel my subscription. I no longer need the service.',
    'Cancellation',
    'train',
  ],
  [
    'Can I change my delivery address after placing an order?',
    'Account access',
    'test',
  ],
  [
    'Requesting a refund for order #77219 because it was never delivered.',
    'Refund request',
    'train',
  ],
]

const supportTextSamples: ApiDatasetSample[] = supportTexts.map(
  ([text, label, split], index) => ({
    id: `support-sample-${index + 1}`,
    modality: 'text',
    text,
    label,
    word_count: text.split(/\s+/).length,
    split,
  }),
)

type ClassCountsOptions = {
  /** How many classes to generate. */
  count: number
  /** The generated counts add up to exactly this. */
  total: number
  /** Smallest class, pinned so the imbalance ratio is `max / min`. */
  min: number
  /** Largest class, pinned. */
  max: number
  /** Names for the largest and smallest class, in that order. */
  extremes: [string, string]
  /** Vocabulary the remaining class names are built from. */
  vocabulary: string[]
  seed?: number
}

/**
 * Builds one count per class, humped toward the middle of `[min, max]` so the
 * histogram has a realistic shape. Deterministic on purpose: these values are
 * asserted in tests.
 */
function classCounts({
  count,
  total,
  min,
  max,
  extremes,
  vocabulary,
  seed = 13,
}: ClassCountsOptions) {
  const [largestName, smallestName] = extremes
  const names = [
    largestName,
    smallestName,
    ...Array.from({ length: Math.max(0, count - 2) }, (_, index) => {
      const word = vocabulary[index % vocabulary.length]
      return `${word}_${String(index + 1).padStart(2, '0')}`
    }),
  ]

  // Two pinned extremes; the rest form a hump low in the range with a tail
  // toward the largest classes — averaging two draws humps the distribution,
  // and the exponent skews that hump left so the mean lands near
  // `total / count` and the drift pass below barely has to correct anything.
  let noise = seed
  const counts = names.map((_, index) => {
    if (index === 0) return max
    if (index === 1) return min
    noise = (noise * 1103515245 + 12345) % 2147483648
    const first = noise / 2147483648
    noise = (noise * 1103515245 + 12345) % 2147483648
    const second = noise / 2147483648
    const position = ((first + second) / 2) ** 1.6
    return Math.round(min + (max - min) * position)
  })

  // Absorb the difference across the middle classes only, so the pinned
  // extremes survive and the counts still sum to `total`.
  let drift = total - counts.reduce((sum, value) => sum + value, 0)
  for (let index = 2; drift !== 0 && index < counts.length; index += 1) {
    const step = drift > 0 ? 1 : -1
    const next = counts[index] + step
    if (next < min || next > max) continue
    counts[index] = next
    drift -= step
    if (index === counts.length - 1) index = 1
  }

  return names.map((name, index) => ({ name, count: counts[index] }))
}

const evenSplit: ApiDatasetStatistics['split_distribution'] = [
  { split: 'train', percent: 80 },
  { split: 'validation', percent: 10 },
  { split: 'test', percent: 10 },
]

type DatasetExtras = {
  health_checks: ApiDatasetDetail['health_checks']
  samples: ApiDatasetSample[]
  statistics: ApiDatasetStatistics
  quality: ApiDatasetQuality
  versions: ApiDatasetVersion[]
}

const datasetExtras: Partial<Record<string, DatasetExtras>> = {
  'retail-train': {
    health_checks: [
      { status: 'pass', label: 'No corrupt files' },
      { status: 'warning', label: '142 near-duplicates found' },
      { status: 'warning', label: 'Class imbalance ratio 3.2:1' },
      { status: 'pass', label: 'All labels valid' },
    ],
    samples: retailImageSamples,
    statistics: {
      label_distribution: [
        { label: 'beverages', count: 3200 },
        { label: 'snacks', count: 2840 },
        { label: 'dairy', count: 2100 },
        { label: 'produce', count: 1750 },
        { label: 'bakery', count: 980 },
        { label: 'household', count: 7550 },
      ],
      // 144 / 45 = 3.2:1, the ratio the quality report cites.
      class_distribution: classCounts({
        count: 240,
        total: 18420,
        min: 45,
        max: 144,
        extremes: ['fresh_produce', 'expired_stock'],
        vocabulary: [
          'produce',
          'dairy',
          'bakery',
          'beverage',
          'snack',
          'household',
          'frozen',
          'canned',
        ],
        seed: 13,
      }),
      split_distribution: evenSplit,
      composition: { file_format: 'JPEG', avg_width: 1024, avg_height: 768 },
    },
    quality: {
      last_checked_at: new Date().toISOString(),
      findings: [
        { dimension: 'integrity', severity: 'pass', title: 'No corrupt files' },
        {
          dimension: 'duplicates',
          severity: 'warning',
          title: '142 near-duplicate images found',
          description:
            'Duplicates can bias the model toward overrepresented items.',
          action: { label: 'Review duplicates' },
        },
        {
          dimension: 'class_balance',
          severity: 'warning',
          title: 'Class imbalance ratio 3.2:1',
          description: 'Rare classes may perform worse after training.',
          action: { label: 'Review class distribution', tab: 'statistics' },
        },
        {
          dimension: 'label_validity',
          severity: 'pass',
          title: 'All labels valid',
        },
      ],
    },
    versions: [
      { version: 3, item_count: 18420, created_at: onDate('2026-06-12') },
      { version: 2, item_count: 16980, created_at: onDate('2026-05-04') },
      { version: 1, item_count: 14200, created_at: onDate('2026-03-18') },
    ],
  },
  'support-train': {
    health_checks: [
      { status: 'pass', label: 'No empty rows' },
      { status: 'warning', label: '96 near-duplicate texts found' },
      { status: 'warning', label: 'Label imbalance ratio 4.1:1' },
      { status: 'warning', label: '3 mixed-language rows detected' },
      { status: 'pass', label: 'All rows labeled' },
    ],
    samples: supportTextSamples,
    statistics: {
      label_distribution: [
        { label: 'Shipping delay', count: 9800 },
        { label: 'Account access', count: 6420 },
        { label: 'Billing issue', count: 5180 },
        { label: 'Damaged item', count: 3960 },
        { label: 'General feedback', count: 3210 },
        { label: 'Other', count: 13730 },
      ],
      // 5043 / 1230 = 4.1:1, the ratio the quality report cites.
      class_distribution: classCounts({
        count: 18,
        total: 42300,
        min: 1230,
        max: 5043,
        extremes: ['shipping_delay', 'refund_status'],
        vocabulary: [
          'shipping',
          'billing',
          'account',
          'damage',
          'feedback',
          'returns',
        ],
        seed: 29,
      }),
      split_distribution: evenSplit,
      composition: {
        file_format: 'CSV',
        avg_words: Math.round(
          supportTexts.reduce(
            (sum, [text]) => sum + text.split(/\s+/).length,
            0,
          ) / supportTexts.length,
        ),
      },
    },
    quality: {
      last_checked_at: hoursAgo(2),
      findings: [
        { dimension: 'integrity', severity: 'pass', title: 'No empty rows' },
        {
          dimension: 'duplicates',
          severity: 'warning',
          title: '96 near-duplicate texts found',
          description:
            'Duplicates can bias the model toward overrepresented items.',
          action: { label: 'Review duplicates' },
        },
        {
          dimension: 'class_balance',
          severity: 'warning',
          title: 'Label imbalance ratio 4.1:1',
          description: 'Rare classes may perform worse after training.',
          action: { label: 'Review label distribution', tab: 'statistics' },
        },
        {
          dimension: 'label_consistency',
          severity: 'warning',
          title: '3 mixed-language rows detected',
          description: 'Inconsistent language may reduce label reliability.',
          action: { label: 'Review flagged rows' },
        },
        {
          dimension: 'label_validity',
          severity: 'pass',
          title: 'All rows labeled',
        },
      ],
    },
    versions: [
      { version: 2, item_count: 42300, created_at: onDate('2026-05-03') },
      { version: 1, item_count: 38120, created_at: onDate('2026-04-14') },
    ],
  },
}

function composition(dataset: ApiDataset): ApiDatasetStatistics['composition'] {
  if (dataset.modality === 'image')
    return { file_format: 'JPEG', avg_width: 1024, avg_height: 768 }
  if (dataset.modality === 'text') return { file_format: 'CSV' }
  return { file_format: 'Parquet' }
}

/** A dataset with no fixture still answers every tab, just with less in it. */
export function extrasFor(dataset: ApiDataset): DatasetExtras {
  return (
    datasetExtras[dataset.id] ?? {
      health_checks: [
        { status: 'pass', label: 'Source files available' },
        { status: 'pass', label: 'Metadata validated' },
      ],
      samples: [],
      statistics: {
        label_distribution: [],
        class_distribution: [],
        split_distribution: (['train', 'validation', 'test'] as const).map(
          (split) => ({ split, percent: dataset.split === split ? 100 : 0 }),
        ),
        composition: composition(dataset),
      },
      quality: {
        last_checked_at: null,
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
      versions: [
        {
          version: dataset.version,
          item_count: dataset.item_count,
          created_at: dataset.created_at,
        },
      ],
    }
  )
}
