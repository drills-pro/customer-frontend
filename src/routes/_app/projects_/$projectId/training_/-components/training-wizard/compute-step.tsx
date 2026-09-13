import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { ComputeOption } from '@/features/dashboard/training'
import { computeOptions } from '@/features/dashboard/training'
import { StepHeading } from './step-heading'

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
      <StepHeading
        title="Choose compute"
        description="Larger instances finish faster but cost more per hour."
      />
      <div className="mt-5 grid gap-2.5">
        {computeOptions.map((item: ComputeOption) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => setInstanceId(item.id)}
            aria-pressed={instanceId === item.id}
            className="w-full justify-between gap-4"
          >
            <span>
              <span className="block text-sm font-medium">{item.name}</span>
              <span className="text-xs text-slate-500">
                {item.specification}
              </span>
            </span>
            <span className="flex items-center gap-3 text-sm font-semibold">
              ${item.hourlyRate.toFixed(2)}/hr{' '}
              {instanceId === item.id && (
                <span className="text-indigo-600">●</span>
              )}
            </span>
          </Button>
        ))}
      </div>
      <Label className="mt-4 flex items-center justify-between gap-4 rounded-lg p-3 leading-normal font-normal ring-1 ring-slate-200">
        <span>
          <span className="block text-sm font-medium">Use spot instance</span>
          <span className="block text-xs text-slate-500">
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
