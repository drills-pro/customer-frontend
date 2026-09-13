import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ComputeOption } from '@/features/dashboard/training'
import { computeOptions } from '@/features/dashboard/training'

export function ComputeStep({
  instanceId,
  setInstanceId,
  spot,
  setSpot,
}: {
  instanceId: string
  setInstanceId: (id: string) => void
  spot: boolean
  setSpot: (value: boolean) => void
}) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Choose compute</h2>
        <p className="mt-1 text-sm text-slate-500">
          Larger instances finish faster but cost more per hour.
        </p>
      </div>
      <div className="mt-6 grid gap-2.5">
        {computeOptions.map((item: ComputeOption) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => setInstanceId(item.id)}
            aria-pressed={instanceId === item.id}
            className="w-full justify-between gap-4 rounded-xl text-left"
          >
            <span>
              <span className="block text-sm font-semibold">{item.name}</span>
              <span className="text-xs text-muted-foreground">
                {item.specification}
              </span>
            </span>
            <span className="flex items-center gap-3 text-sm font-semibold">
              ${item.hourlyRate.toFixed(2)}/hr
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-primary opacity-0 group-aria-pressed/button:opacity-100"
              />
            </span>
          </Button>
        ))}
      </div>
      <Label className="mt-5 flex items-center justify-between gap-4 border-t pt-5 leading-normal font-normal">
        <span>
          <span className="block text-sm font-semibold">Use spot instance</span>
          <span className="block text-xs text-muted-foreground">
            About 60% cheaper; may be interrupted and resumed.
          </span>
        </span>
        <Switch
          checked={spot}
          onCheckedChange={setSpot}
          aria-label="Use spot instance"
        />
      </Label>
    </section>
  )
}
