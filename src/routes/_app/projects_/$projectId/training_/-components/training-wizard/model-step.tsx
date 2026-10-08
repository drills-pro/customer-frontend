import { Network } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import type { ArchitectureOption } from '@/features/dashboard/training'

export function ModelStep({
  architectures,
  architectureId,
  setArchitectureId,
}: {
  architectures: ArchitectureOption[]
  architectureId: string
  setArchitectureId: (id: string) => void
}) {
  const selected =
    architectures.find((item) => item.id === architectureId) ?? architectures[0]
  const metadata = selected.meta.split(' · ')

  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Choose a model</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick an architecture to fine-tune, or start from scratch.
        </p>
      </div>
      <Item
        variant="outline"
        className="mt-6 flex-nowrap gap-4 rounded-xl border-primary bg-primary-muted/70 p-5"
      >
        <ItemMedia className="group-has-data-[slot=item-description]/item:self-center group-has-data-[slot=item-description]/item:translate-y-0">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Network className="size-6" />
          </span>
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle className="text-base font-semibold">
            {selected.name}
          </ItemTitle>
          <ItemDescription className="leading-relaxed">
            {selected.description}
          </ItemDescription>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-primary">
            {metadata.map((value, index) => (
              <span key={value} className="flex items-center gap-3">
                {index > 0 && (
                  <span className="size-1 rounded-full bg-current" />
                )}
                {value}
              </span>
            ))}
          </div>
        </ItemContent>
      </Item>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {architectures.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => setArchitectureId(item.id)}
            aria-pressed={architectureId === item.id}
            className="min-w-0 flex-col justify-start gap-2.5 rounded-xl py-5 text-center aria-pressed:[&_[data-model-icon]]:bg-primary aria-pressed:[&_[data-model-icon]]:text-primary-foreground"
          >
            <span
              data-model-icon
              className="flex size-10 items-center justify-center rounded-lg bg-primary-muted text-primary"
            >
              <Network className="size-5" />
            </span>
            <span className="max-w-full whitespace-normal text-sm font-semibold">
              {item.name}
            </span>
          </Button>
        ))}
      </div>
    </section>
  )
}
