import { Button, Flex, SimpleGrid, Text } from '@chakra-ui/react'
import { Download } from 'lucide-react'

import { SectionCard } from '@/components/shared/section-card'

import { downloadText } from './helpers'
import { useCurrentTrainingRun } from './use-current-training-run'

export function ConfigCard() {
  const { run, dataset } = useCurrentTrainingRun()
  const config = {
    dataset: dataset?.name ?? run.datasetId,
    architecture: run.architecture,
    epochs: run.epochs,
    batchSize: run.batchSize,
    split: `${run.split.train}% / ${run.split.validation}% / ${run.split.test}%`,
    learningRate: run.learningRate,
    scheduler: run.scheduler,
    augmentations: run.augmentations,
    earlyStopping: run.earlyStopping,
    instance: run.instanceName,
    spot: run.spot,
    estimatedCost: run.estimatedCost,
  }
  return (
    <SectionCard
      title="Saved configuration"
      action={
        <Button
          variant="outline"
          size="xs"
          onClick={() =>
            downloadText(
              `${run.name}-config.json`,
              JSON.stringify(config, null, 2),
              'application/json',
            )
          }
        >
          <Download />
          Download
        </Button>
      }
    >
      <SimpleGrid columns={{ base: 1, sm: 2 }} columnGap="8" p="5">
        {Object.entries(config).map(([label, value]) => (
          <Flex
            key={label}
            justify="space-between"
            gap="4"
            borderBottomWidth="1px"
            borderColor="border"
            py="2"
            textStyle="body-sm"
          >
            <Text as="span" textTransform="capitalize" color="fg.muted">
              {label.replace(/([A-Z])/g, ' $1')}
            </Text>
            <Text as="span" maxW="60%" textAlign="end" fontWeight="medium">
              {Array.isArray(value)
                ? value.join(', ') || 'None'
                : typeof value === 'boolean'
                  ? value
                    ? 'Enabled'
                    : 'Disabled'
                  : String(value)}
            </Text>
          </Flex>
        ))}
      </SimpleGrid>
    </SectionCard>
  )
}
