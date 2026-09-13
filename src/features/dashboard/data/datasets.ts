import type {
  ClassCount,
  Dataset,
  DatasetDetailMock,
  DatasetSample,
} from '../domain/types'
import { projects } from './projects'

export const datasets: Dataset[] = projects.flatMap((project, index) => [
  {
    id: `${project.id}-train`,
    projectId: project.id,
    name:
      project.id === 'retail'
        ? 'retail-shelf-train'
        : project.id === 'support'
          ? 'support-tickets-train'
          : `${project.id}-train`,
    modality: project.task.includes('Image')
      ? 'image'
      : project.task.includes('Text')
        ? 'text'
        : 'tabular',
    split: 'Train',
    items:
      project.id === 'retail'
        ? 18420
        : project.id === 'support'
          ? 42300
          : 3200 + index * 1200,
    size:
      project.id === 'retail'
        ? '4.2 GB'
        : project.id === 'support'
          ? '8.4 MB'
          : '520 MB',
    classes: project.id === 'retail' ? 240 : project.id === 'support' ? 18 : 12,
    version: project.id === 'retail' ? 3 : project.id === 'support' ? 2 : 1,
    status: 'Ready',
    created: '12 Jun',
    files: [],
  },
  {
    id: `${project.id}-val`,
    projectId: project.id,
    name:
      project.id === 'retail' ? 'retail-shelf-val' : `${project.id}-validation`,
    modality: project.task.includes('Image')
      ? 'image'
      : project.task.includes('Text')
        ? 'text'
        : 'tabular',
    split: 'Validation',
    items: 2300,
    size: '520 MB',
    classes: project.id === 'retail' ? 240 : 12,
    version: 1,
    status: 'Ready',
    created: '12 Jun',
    files: [],
  },
])

datasets.push(
  {
    id: 'retail-test',
    projectId: 'retail',
    name: 'retail-shelf-test',
    modality: 'image',
    split: 'Test',
    items: 2300,
    size: '518 MB',
    classes: 240,
    version: 3,
    status: 'Ready',
    created: '12 Jun',
    files: [],
  },
  {
    id: 'retail-raw',
    projectId: 'retail',
    name: 'shelf-v2-raw',
    modality: 'image',
    split: 'Unsplit',
    items: 31100,
    size: '7.8 GB',
    classes: 0,
    version: 1,
    status: 'Processing',
    created: '2h ago',
    files: [],
  },
  {
    id: 'retail-legacy',
    projectId: 'retail',
    name: 'legacy-import',
    modality: 'image',
    split: 'Train',
    items: 940,
    size: '180 MB',
    classes: 12,
    version: 1,
    status: 'Error',
    created: '3d ago',
    files: [],
  },
)

const retailLabels = [
  'beverages',
  'snacks',
  'dairy',
  'produce',
  'bakery',
  'household',
] as const

const retailImageSamples: DatasetSample[] = Array.from(
  { length: 24 },
  (_, index) => {
    const label = retailLabels[index % retailLabels.length]
    return {
      id: `retail-sample-${index + 1}`,
      modality: 'image' as const,
      image: `/dataset-samples/retail/${label}.png`,
      label,
      split:
        index % 10 < 8
          ? ('Train' as const)
          : index % 10 === 8
            ? ('Validation' as const)
            : ('Test' as const),
    }
  },
)

const supportTextSamples: DatasetSample[] = [
  [
    'My order #48213 has not arrived yet and it has been two weeks.',
    'Shipping delay',
    'Train',
  ],
  [
    'How do I reset my password? I cannot access my account anymore.',
    'Account access',
    'Train',
  ],
  [
    'I was charged twice for the same order. Please refund the extra charge.',
    'Billing issue',
    'Train',
  ],
  [
    'Love the new app update; everything feels much faster now!',
    'Positive feedback',
    'Validation',
  ],
  [
    'The product arrived damaged and the box was crushed in transit.',
    'Damaged item',
    'Train',
  ],
  [
    'Please cancel my subscription. I no longer need the service.',
    'Cancellation',
    'Train',
  ],
  [
    'Can I change my delivery address after placing an order?',
    'Account access',
    'Test',
  ],
  [
    'Requesting a refund for order #77219 because it was never delivered.',
    'Refund request',
    'Train',
  ],
].map(([text, label, split], index) => ({
  id: `support-sample-${index + 1}`,
  modality: 'text' as const,
  text,
  label,
  words: text.split(/\s+/).length,
  split: split as 'Train' | 'Validation' | 'Test',
}))

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
 * histogram has a realistic shape. Deterministic on purpose: these end up in
 * localStorage and in test assertions.
 */
function classCounts({
  count,
  total,
  min,
  max,
  extremes,
  vocabulary,
  seed = 13,
}: ClassCountsOptions): ClassCount[] {
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

const retailClassNames = [
  'produce',
  'dairy',
  'bakery',
  'beverage',
  'snack',
  'household',
  'frozen',
  'canned',
]

const supportClassNames = [
  'shipping',
  'billing',
  'account',
  'damage',
  'feedback',
  'returns',
]

export const datasetDetails: Partial<Record<string, DatasetDetailMock>> = {
  'retail-train': {
    samples: retailImageSamples,
    distribution: [
      { label: 'beverages', count: 3200 },
      { label: 'snacks', count: 2840 },
      { label: 'dairy', count: 2100 },
      { label: 'produce', count: 1750 },
      { label: 'bakery', count: 980 },
      { label: 'household', count: 7550 },
    ],
    // 144 / 45 = 3.2:1, the ratio the quality report cites.
    classDistribution: classCounts({
      count: 240,
      total: 18420,
      min: 45,
      max: 144,
      extremes: ['fresh_produce', 'expired_stock'],
      vocabulary: retailClassNames,
      seed: 13,
    }),
    composition: {
      fileFormat: 'JPEG',
      avgDimensions: { width: 1024, height: 768 },
    },
    healthChecks: [
      { status: 'pass', label: 'No corrupt files' },
      { status: 'warning', label: '142 near-duplicates found' },
      { status: 'warning', label: 'Class imbalance ratio 3.2:1' },
      { status: 'pass', label: 'All labels valid' },
    ],
    qualityReport: {
      lastChecked: 'just now',
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
          dimension: 'classBalance',
          severity: 'warning',
          title: 'Class imbalance ratio 3.2:1',
          description: 'Rare classes may perform worse after training.',
          action: { label: 'Review class distribution', tab: 'statistics' },
        },
        {
          dimension: 'labelValidity',
          severity: 'pass',
          title: 'All labels valid',
        },
      ],
    },
    splitDistribution: [
      { label: 'Train', percent: 80 },
      { label: 'Validation', percent: 10 },
      { label: 'Test', percent: 10 },
    ],
    versions: [
      { version: 3, items: 18420, created: '12 Jun 2026' },
      { version: 2, items: 16980, created: '4 May 2026' },
      { version: 1, items: 14200, created: '18 Mar 2026' },
    ],
  },
  'support-train': {
    samples: supportTextSamples,
    distribution: [
      { label: 'Shipping delay', count: 9800 },
      { label: 'Account access', count: 6420 },
      { label: 'Billing issue', count: 5180 },
      { label: 'Damaged item', count: 3960 },
      { label: 'General feedback', count: 3210 },
      { label: 'Other', count: 13730 },
    ],
    // 5043 / 1230 = 4.1:1, the ratio the quality report cites.
    classDistribution: classCounts({
      count: 18,
      total: 42300,
      min: 1230,
      max: 5043,
      extremes: ['shipping_delay', 'refund_status'],
      vocabulary: supportClassNames,
      seed: 29,
    }),
    composition: {
      fileFormat: 'CSV',
      avgWords: Math.round(
        supportTextSamples.reduce(
          (sum, sample) =>
            sum + (sample.modality === 'text' ? sample.words : 0),
          0,
        ) / supportTextSamples.length,
      ),
    },
    healthChecks: [
      { status: 'pass', label: 'No empty rows' },
      { status: 'warning', label: '96 near-duplicate texts found' },
      { status: 'warning', label: 'Label imbalance ratio 4.1:1' },
      { status: 'warning', label: '3 mixed-language rows detected' },
      { status: 'pass', label: 'All rows labeled' },
    ],
    qualityReport: {
      lastChecked: '2 hours ago',
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
          dimension: 'classBalance',
          severity: 'warning',
          title: 'Label imbalance ratio 4.1:1',
          description: 'Rare classes may perform worse after training.',
          action: { label: 'Review label distribution', tab: 'statistics' },
        },
        {
          dimension: 'labelConsistency',
          severity: 'warning',
          title: '3 mixed-language rows detected',
          description: 'Inconsistent language may reduce label reliability.',
          action: { label: 'Review flagged rows' },
        },
        {
          dimension: 'labelValidity',
          severity: 'pass',
          title: 'All rows labeled',
        },
      ],
    },
    splitDistribution: [
      { label: 'Train', percent: 80 },
      { label: 'Validation', percent: 10 },
      { label: 'Test', percent: 10 },
    ],
    versions: [
      { version: 2, items: 42300, created: '3 May 2026' },
      { version: 1, items: 38120, created: '14 Apr 2026' },
    ],
  },
}
