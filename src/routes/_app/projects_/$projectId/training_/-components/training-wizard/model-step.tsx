import { Brain } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { ArchitectureOption } from '@/features/dashboard/training'
import { StepHeading } from './step-heading'

export function ModelStep({
  architectures,
  architectureId,
  setArchitectureId,
}: {
  architectures: ArchitectureOption[]
  architectureId: string
  setArchitectureId: (id: string) => void
}) {
  return (
    <section>
      <StepHeading
        title="Choose a model"
        description="Pick an architecture to fine-tune, or start from scratch."
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {architectures.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => setArchitectureId(item.id)}
            aria-pressed={architectureId === item.id}
            className="flex-col items-stretch justify-start"
          >
            <div className="flex items-start justify-between">
              <Brain className="size-5 text-indigo-600" />
              {architectureId === item.id && (
                <span className="text-indigo-600">●</span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium">{item.name}</p>
            <p className="text-xs text-slate-500">{item.description}</p>
            <p className="mt-2 text-[11px] font-medium text-slate-400">
              {item.meta}
            </p>
          </Button>
        ))}
      </div>
    </section>
  )
}
