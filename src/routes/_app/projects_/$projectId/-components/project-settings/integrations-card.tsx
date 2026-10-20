import { Bell, Database, GitBranch, Plug, Webhook } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { toaster } from '@/components/toaster'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useProjectDetail } from '@/features/dashboard/context'
import {
  useProjectIntegrations,
  useSetProjectIntegration,
} from '@/features/projects/queries'

/** How each integration the API knows is drawn; an unknown one gets a default. */
const appearance: Record<string, { icon: LucideIcon; tint: string }> = {
  github: { icon: GitBranch, tint: 'bg-foreground text-background' },
  slack: { icon: Bell, tint: 'bg-highlight-muted text-highlight' },
  webhook: { icon: Webhook, tint: 'bg-info-muted text-info' },
  s3: { icon: Database, tint: 'bg-warning-muted text-warning' },
}
const fallbackAppearance = { icon: Plug, tint: 'bg-muted text-foreground' }

export function IntegrationsCard() {
  const { project } = useProjectDetail()
  const integrations = (useProjectIntegrations(project.id).data ?? []).map(
    (item) => ({ ...item, ...(appearance[item.id] ?? fallbackAppearance) }),
  )
  const setIntegration = useSetProjectIntegration(project.id)

  function toggle(item: (typeof integrations)[number], on: boolean) {
    setIntegration.mutate(
      { id: item.id, enabled: on },
      {
        onSuccess: () =>
          toaster.create({
            type: 'success',
            title: `${item.name} ${on ? 'connected' : 'disconnected'}.`,
          }),
      },
    )
  }

  return (
    <Card id="integrations" size="flush" className="scroll-mt-22">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect the tools your team already uses.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-px bg-border p-0 sm:grid-cols-2">
        {integrations.map((item) => {
          const on = item.enabled
          return (
            <div key={item.id} className="flex items-start gap-3 bg-card p-5">
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${item.tint}`}
              >
                <item.icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">
                  <label htmlFor={`integration-${item.id}`}>{item.name}</label>
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.description}
                </p>
                <p
                  className={`mt-2 text-xs font-medium ${on ? 'text-success' : 'text-muted-foreground'}`}
                >
                  {on ? 'Connected' : 'Not connected'}
                </p>
              </div>
              <Switch
                id={`integration-${item.id}`}
                checked={on}
                onCheckedChange={(checked) => toggle(item, checked)}
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
