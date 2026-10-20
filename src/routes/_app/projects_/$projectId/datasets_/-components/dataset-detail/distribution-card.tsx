import { Box, Flex, Progress, Stack, Text } from '@chakra-ui/react'

import { SectionCard } from '@/components/shared/section-card'
import { useCurrentDataset } from './use-current-dataset'

export function DistributionCard() {
  const { dataset, detail } = useCurrentDataset()
  const { distribution } = detail
  const title =
    dataset.modality === 'text' ? 'Label distribution' : 'Class distribution'
  const maximum = Math.max(...distribution.map((item) => item.count), 1)
  return (
    <SectionCard title={title} divided={false}>
      <Stack gap="3" px="5" pb="5">
        {distribution.length ? (
          distribution.map((item) => (
            <Box key={item.label}>
              <Flex
                mb="1"
                align="center"
                justify="space-between"
                gap="3"
                fontSize="xs"
              >
                <span>{item.label}</span>
                <Text as="span" color="fg.muted">
                  {item.count.toLocaleString('en-US')}
                </Text>
              </Flex>
              <Progress.Root size="xs" value={(item.count / maximum) * 100}>
                <Progress.Track aria-label={item.label}>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </Box>
          ))
        ) : (
          <Text textStyle="body-sm" color="fg.muted">
            Distribution will appear after samples are processed.
          </Text>
        )}
      </Stack>
    </SectionCard>
  )
}
