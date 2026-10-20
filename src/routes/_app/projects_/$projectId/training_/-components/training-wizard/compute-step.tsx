import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react'

import { SwitchButton } from '@/components/shared/switch-button'
import type { ApiComputeOption } from '@/features/catalog/api'

export function ComputeStep({
  computeOptions,
  instanceId,
  setInstanceId,
  spot,
  setSpot,
}: {
  computeOptions: ApiComputeOption[]
  instanceId: string
  setInstanceId: (id: string) => void
  spot: boolean
  setSpot: (value: boolean) => void
}) {
  return (
    <section>
      <Box>
        <Heading
          as="h2"
          fontSize="lg"
          fontWeight="semibold"
          letterSpacing="tight"
        >
          Choose compute
        </Heading>
        <Text mt="1" textStyle="body-sm" color="fg.muted">
          Larger instances finish faster but cost more per hour.
        </Text>
      </Box>
      <Stack mt="6" gap="2.5">
        {computeOptions.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => setInstanceId(item.id)}
            aria-pressed={instanceId === item.id}
            w="full"
            justifyContent="space-between"
            gap="4"
            rounded="l3"
            css={{ '&[aria-pressed=true] [data-chosen]': { opacity: 1 } }}
          >
            <Box>
              <Text textStyle="body-sm" fontWeight="semibold">
                {item.name}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {item.specification}
              </Text>
            </Box>
            <Flex
              as="span"
              align="center"
              gap="3"
              textStyle="body-sm"
              fontWeight="semibold"
            >
              ${item.hourly_rate_usd.toFixed(2)}/hr
              <Box
                data-chosen
                aria-hidden="true"
                boxSize="2"
                rounded="full"
                bg="brand"
                opacity={0}
              />
            </Flex>
          </Button>
        ))}
      </Stack>
      <Flex
        as="label"
        mt="5"
        align="center"
        justify="space-between"
        gap="4"
        borderTopWidth="1px"
        borderColor="border"
        pt="5"
        cursor="pointer"
      >
        <Box>
          <Text textStyle="body-sm" fontWeight="semibold">
            Use spot instance
          </Text>
          <Text fontSize="xs" color="fg.muted">
            About 60% cheaper; may be interrupted and resumed.
          </Text>
        </Box>
        <SwitchButton
          checked={spot}
          onCheckedChange={setSpot}
          aria-label="Use spot instance"
        />
      </Flex>
    </section>
  )
}
