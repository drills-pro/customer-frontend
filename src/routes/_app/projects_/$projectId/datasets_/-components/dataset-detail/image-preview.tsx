import * as React from 'react';
import { Badge, Box, Card, Flex, Image, SimpleGrid, Text, VisuallyHidden } from '@chakra-ui/react';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { SimpleSelect } from '@/components/simple-select';
import type { DatasetSample } from '@/features/dashboard/data';
import { useCurrentDataset } from './use-current-dataset';

export function ImagePreview() {
  const { dataset, detail } = useCurrentDataset();
  const samples = detail.samples.filter((sample): sample is Extract<DatasetSample, { modality: 'image' }> => sample.modality === 'image');
  const [label, setLabel] = React.useState('all');
  const [split, setSplit] = React.useState('all');
  const labels = Array.from(new Set(samples.map((sample) => sample.label)));
  const visible = samples.filter((sample) => (label === 'all' || sample.label === label) && (split === 'all' || sample.split === split));

  return (
    <Card.Root variant="outline" overflow="hidden">
      <Flex wrap="wrap" align="center" justify="space-between" gap="2" px="4" py="3" borderBottomWidth="1px" borderColor="border">
        <Flex wrap="wrap" align="center" gap="2">
          <SimpleSelect
            label="Filter by class"
            hideLabel
            size="sm"
            width="36"
            value={label}
            onChange={setLabel}
            items={[{ label: 'All classes', value: 'all' }, ...labels.map((item) => ({ label: item, value: item }))]}
          />
          <SimpleSelect
            label="Filter by split"
            hideLabel
            size="sm"
            width="32"
            value={split}
            onChange={setSplit}
            items={[
              { label: 'All splits', value: 'all' },
              { label: 'Train', value: 'Train' },
              { label: 'Validation', value: 'Validation' },
              { label: 'Test', value: 'Test' },
            ]}
          />
        </Flex>
        <Text fontSize="xs" color="fg.muted" textAlign={{ sm: 'end' }}>
          Showing {visible.length} of {dataset.items.toLocaleString('en-US')}
        </Text>
      </Flex>
      <Box p="4">
        {visible.length ? (
          <SimpleGrid columns={{ base: 3, sm: 4, lg: 6 }} gap="3">
            {visible.map((sample) => (
              <Box
                as="figure"
                key={sample.id}
                className="group"
                position="relative"
                aspectRatio="square"
                overflow="hidden"
                rounded="l2"
                bg="bg.muted"
              >
                <Image
                  src={sample.image}
                  alt={`${sample.label} dataset sample`}
                  loading="lazy"
                  boxSize="full"
                  objectFit="cover"
                  transition="transform 0.2s"
                  _groupHover={{ transform: 'scale(1.05)' }}
                />
                <Flex as="figcaption" position="absolute" insetX="2" bottom="2" align="center" justify="space-between" gap="2">
                  <Badge bg="night" color="on-night">
                    {sample.label}
                  </Badge>
                  <VisuallyHidden>{sample.split} split</VisuallyHidden>
                </Flex>
              </Box>
            ))}
          </SimpleGrid>
        ) : (
          <EmptyNotice minH="56" title="No matching samples" description="Try a different class or split." />
        )}
      </Box>
    </Card.Root>
  );
}
