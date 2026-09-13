export const steps = [
  'Dataset',
  'Model',
  'Configure',
  'Compute',
  'Review',
] as const

export type ConfigureMode = 'simple' | 'advanced' | 'yaml'
