import * as React from 'react'
import { Bell, Database, GitBranch, Webhook } from 'lucide-react'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const integrations = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Start a training run when a config changes on main.',
    icon: GitBranch,
    tint: 'bg-foreground text-background',
    enabled: true,
  },
  {
    id: 'slack',
    name: 'Slack notifications',
    description: 'Post run results and deployment alerts to #ml-alerts.',
    icon: Bell,
    tint: 'bg-highlight-muted text-highlight',
    enabled: true,
  },
  {
    id: 'webhook',
    name: 'Webhooks',
    description: 'Send run and deployment events to your own endpoint.',
    icon: Webhook,
    tint: 'bg-info-muted text-info',
    enabled: false,
  },
  {
    id: 's3',
    name: 'S3 bucket sync',
    description: 'Import new images from a bucket as a dataset version.',
    icon: Database,
    tint: 'bg-warning-muted text-warning',
    enabled: false,
  },
]

export function IntegrationsCard() {
  const [enabled, setEnabled] = React.useState(
    () =>
      new Set(
        integrations.filter((item) => item.enabled).map((item) => item.id),
      ),
  )

  function toggle(item: (typeof integrations)[number], on: boolean) {
    setEnabled((current) => {
      const next = new Set(current)
      if (on) next.add(item.id)
      else next.delete(item.id)
      return next
    })
    toast.success(`${item.name} ${on ? 'connected' : 'disconnected'}.`)
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
          const on = enabled.has(item.id)
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
