import type * as React from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from 'cn'

import { Card } from '@/components/ui/card'

export type EntityStat = {
  label: string
  value: React.ReactNode
  /** Optional comparison line, e.g. `▲ 2.5 pts vs v2`. */
  delta?: React.ReactNode
}

/**
 * The detail-page header shared by datasets, models and deployments: an icon
 * tile, the entity's identity and actions, and a stat strip welded to the
 * bottom of the same card.
 *
 * The strip draws its dividers with `gap-px` over a slate ground rather than
 * per-cell borders, because the cell that needs a right border changes when the
 * grid reflows from two columns to four.
 */
export function EntityHeader({
  icon: Icon,
  name,
  mono = false,
  badges,
  meta,
  actions,
  stats,
}: {
  icon: LucideIcon
  name: string
  /** Identifier-style names (models, deployments) set in the mono face. */
  mono?: boolean
  badges?: React.ReactNode
  meta: React.ReactNode
  actions: React.ReactNode
  stats: EntityStat[]
}) {
  return (
    <Card size="flush" className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-muted text-primary">
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={cn(
                  'truncate text-[16px] font-semibold tracking-tight text-foreground',
                  mono && 'font-mono',
                )}
              >
                {name}
              </h1>
              {badges}
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground">{meta}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-border bg-muted sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card px-5 py-4 sm:px-6">
            <p className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
              {stat.label}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight text-foreground">
              {stat.value}
            </p>
            {stat.delta ? (
              <p className="mt-0.5 text-[11px] font-medium">{stat.delta}</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  )
}
