import { createFileRoute } from '@tanstack/react-router'

import { CardError, CardLoading } from '@/components/shared/query-states'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/features/account/queries'
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
  const settings = useNotificationSettings()
  const update = useUpdateNotificationSettings()
  const notificationSettings = settings.data ?? []

  if (settings.error) {
    return (
      <Card size="flush">
        <CardError
          title="Could not load notification settings"
          error={settings.error}
          onRetry={() => void settings.refetch()}
        />
      </Card>
    )
  }
  if (settings.isPending) {
    return (
      <Card size="flush">
        <CardLoading rows={4} />
      </Card>
    )
  }

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
                checked={setting.enabled}
                aria-describedby={`${id}-description`}
                onCheckedChange={(checked) =>
                  update.mutate({ [setting.id]: checked })
                }
              />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
