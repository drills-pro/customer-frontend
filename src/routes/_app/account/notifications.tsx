import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { notificationSettings } from './-components/account-data'
import { PageHeader } from './-components/page-header'

export const Route = createFileRoute('/_app/account/notifications')({
  component: NotificationsRoute,
})

function NotificationsRoute() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Choose what you're notified about and how."
      />
      <NotificationsCard />
    </>
  )
}

function NotificationsCard() {
  const [enabled, setEnabled] = React.useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      notificationSettings.map((setting) => [setting.id, setting.enabled]),
    ),
  )

  return (
    <Card size="flush">
      <CardContent className="divide-y p-0">
        {notificationSettings.map((setting) => {
          const id = `notification-${setting.id}`
          return (
            <div key={setting.id} className="flex items-center gap-4 px-5 py-4">
              <div className="mr-auto min-w-0">
                <label htmlFor={id} className="text-[13px] font-medium">
                  {setting.title}
                </label>
                <p
                  id={`${id}-description`}
                  className="mt-0.5 text-xs text-muted-foreground"
                >
                  {setting.description}
                </p>
              </div>
              <Switch
                id={id}
                checked={enabled[setting.id]}
                aria-describedby={`${id}-description`}
                onCheckedChange={(checked) =>
                  setEnabled((current) => ({
                    ...current,
                    [setting.id]: checked,
                  }))
                }
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
