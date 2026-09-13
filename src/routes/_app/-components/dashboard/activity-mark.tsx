import { Check, CircleUserRound, Database, Rocket, X } from 'lucide-react'

import type { Activity } from '@/features/dashboard/data'

export function ActivityMark({ kind }: { kind: Activity['icon'] }) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-600',
    dataset: 'bg-orange-50 text-orange-600',
    deployment: 'bg-sky-50 text-sky-600',
    error: 'bg-rose-50 text-rose-600',
    person: 'bg-indigo-50 text-indigo-600',
  }
  const Icon =
    kind === 'dataset'
      ? Database
      : kind === 'deployment'
        ? Rocket
        : kind === 'error'
          ? X
          : kind === 'person'
            ? CircleUserRound
            : Check

  return (
    <span
      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${styles[kind]}`}
    >
      <Icon className="size-4" />
    </span>
  )
}
