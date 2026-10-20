import { Box, Card, Flex, Text } from '@chakra-ui/react'
import { createFileRoute } from '@tanstack/react-router'

import { CardError, CardLoading } from '@/components/shared/query-states'
import { SwitchButton } from '@/components/shared/switch-button'
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
      <Card.Root variant="outline">
        <CardError
          title="Could not load notification settings"
          error={settings.error}
          onRetry={() => void settings.refetch()}
        />
      </Card.Root>
    )
  }
  if (settings.isPending) {
    return (
      <Card.Root variant="outline">
        <CardLoading rows={4} />
      </Card.Root>
    )
  }

  return (
    <Card.Root variant="outline">
      {notificationSettings.map((setting) => {
        const id = `notification-${setting.id}`
        return (
          <Flex
            key={setting.id}
            align="center"
            gap="4"
            px="5"
            py="4"
            borderTopWidth="1px"
            borderColor="border"
            _first={{ borderTopWidth: '0' }}
          >
            <Box me="auto" minW="0">
              <Text asChild fontSize="13px" fontWeight="medium">
                <label htmlFor={id}>{setting.title}</label>
              </Text>
              <Text
                id={`${id}-description`}
                mt="0.5"
                fontSize="xs"
                color="fg.muted"
              >
                {setting.description}
              </Text>
            </Box>
            <SwitchButton
              id={id}
              checked={setting.enabled}
              aria-describedby={`${id}-description`}
              onCheckedChange={(checked) =>
                update.mutate({ [setting.id]: checked })
              }
            />
          </Flex>
        )
      })}
    </Card.Root>
  )
}
