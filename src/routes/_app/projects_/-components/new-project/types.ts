import { Copy, Sparkles, Upload } from 'lucide-react'

export const steps = ['Basics', 'Task type', 'Start method'] as const

export type StartMethod = 'upload' | 'template' | 'clone'

export const startMethods: Array<{
  id: StartMethod
  label: string
  description: string
  icon: typeof Upload
}> = [
  {
    id: 'upload',
    label: 'Upload dataset',
    description: 'Start empty and upload your own data right after creation.',
    icon: Upload,
  },
  {
    id: 'template',
    label: 'Use a template',
    description: 'Seed the project with a ready sample dataset for this task.',
    icon: Sparkles,
  },
  {
    id: 'clone',
    label: 'Clone a project',
    description: 'Reuse the setup from an existing compatible project.',
    icon: Copy,
  },
]
