import { useQuery } from '@tanstack/react-query';
import { Box, Button, Center, Flex, Grid, Heading, Image, Progress, Text } from '@chakra-ui/react';
import type { BoxProps } from '@chakra-ui/react';
import { ImageUp, Play } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { SectionCard } from '@/components/shared/section-card';
import { ToneBadge } from '@/components/shared/tone-badge';
import { modelsApi } from '@/features/models/api';
import { modelKeys } from '@/features/models/queries';
import { useCurrentModel } from './use-current-model';

/**
 * A worked example rather than a live endpoint: the demo has no inference
 * backend, so the panel opens showing what a real prediction looks like and
 * labels it as an example.
 */
const SAMPLE_IMAGE = '/dataset-samples/retail/beverages.png';

function Bar({ label, value, mono = true, palette = 'brand' }: { label: string; value: number; mono?: boolean; palette?: string }) {
  return (
    <Box mt="3" _first={{ mt: '0' }}>
      <Flex align="baseline" justify="space-between" gap="3" fontSize="13px">
        <Text as="span" truncate fontFamily={mono ? 'mono' : undefined}>
          {label}
        </Text>
        <Text as="span" flexShrink={0} fontWeight="semibold" fontVariantNumeric="tabular-nums">
          {value.toFixed(1)}%
        </Text>
      </Flex>
      <Progress.Root mt="1.5" size="xs" value={value} colorPalette={palette}>
        <Progress.Track aria-label={label}>
          <Progress.Range />
        </Progress.Track>
      </Progress.Root>
    </Box>
  );
}

/** The sample image with a saliency overlay painted over it. */
function Saliency(props: BoxProps) {
  return (
    <Box position="relative" overflow="hidden" rounded="l2" {...props}>
      <Image src={SAMPLE_IMAGE} alt="Sample shelf photo with the model's saliency overlay" display="block" w="full" />
      <Box
        aria-hidden="true"
        position="absolute"
        inset="0"
        css={{
          backgroundImage:
            'radial-gradient(circle at 30% 55%, color-mix(in srgb, var(--chakra-colors-danger) 55%, transparent), transparent 45%), radial-gradient(circle at 62% 62%, color-mix(in srgb, var(--chakra-colors-warning) 40%, transparent), transparent 38%)',
        }}
      />
    </Box>
  );
}

export function PlaygroundTab() {
  const { project, model } = useCurrentModel();
  // The panel opens on the model's answer for the example image; "Run
  // prediction" asks for it again.
  const prediction = useQuery({
    queryKey: [...modelKeys.one(project.id, model.id), 'example-prediction'],
    queryFn: () => modelsApi.predict(project.id, model.id),
    staleTime: Infinity,
  });
  const predictions = prediction.data?.predictions ?? [];
  const contributions = prediction.data?.contributions ?? [];
  const top = predictions.at(0);

  return (
    <Grid minW="0" alignItems="start" gap="6" templateColumns={{ lg: 'repeat(2, minmax(0, 1fr))' }}>
      <SectionCard title="Test this model">
        <Box p="5">
          <Flex
            minH="210px"
            direction="column"
            align="center"
            justify="center"
            gap="2"
            rounded="l2"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor="border.emphasized"
            px="6"
            textAlign="center"
          >
            <Center boxSize="10" rounded="l2" bg="surface-raised" color="fg.muted" borderWidth="1px" borderColor="border">
              <ImageUp size={20} />
            </Center>
            <Text mt="1" fontSize="13px" fontWeight="medium">
              Drop an image here
            </Text>
            <Text fontSize="xs" color="fg.muted">
              or click to browse · JPG, PNG up to 10 MB
            </Text>
          </Flex>
          <Flex mt="4" wrap="wrap" align="center" gap="3" rounded="l2" bg="bg.muted" p="3">
            <Saliency boxSize="10" flexShrink={0} />
            <Box minW="0" flex="1">
              <Text truncate fontFamily="mono" fontSize="13px">
                shelf-sample-0142.jpg
              </Text>
              <Text fontSize="11px" color="fg.muted">
                Example image · 1.2 MB · 1440 × 1080
              </Text>
            </Box>
            <Button
              variant="solid"
              size="sm"
              disabled={prediction.isFetching}
              onClick={() =>
                void prediction.refetch().then((result) => {
                  if (result.error)
                    toaster.create({
                      type: 'error',
                      title: result.error.message,
                    });
                  else
                    toaster.create({
                      type: 'success',
                      title: 'Prediction complete.',
                    });
                })
              }
            >
              <Play />
              Run prediction
            </Button>
          </Flex>
        </Box>
      </SectionCard>

      <SectionCard title="Prediction" action={<ToneBadge tone="neutral">Example result</ToneBadge>}>
        <Box p="5">
          <Flex align="center" justify="space-between" gap="4" rounded="l2" bg="bg.success" color="fg.success" px="4" py="3">
            <Box minW="0">
              <Text fontSize="11px" fontWeight="medium" letterSpacing="widest" textTransform="uppercase">
                Top prediction
              </Text>
              <Text truncate fontFamily="mono" fontSize="15px" fontWeight="semibold">
                {top?.label}
              </Text>
            </Box>
            <Text flexShrink={0} fontSize="2xl" fontWeight="semibold" fontVariantNumeric="tabular-nums">
              {top ? `${top.confidence}%` : ''}
            </Text>
          </Flex>

          <Box mt="4">
            {predictions.map((entry) => (
              <Bar key={entry.label} label={entry.label} value={entry.confidence} />
            ))}
          </Box>

          <Box mt="5" borderTopWidth="1px" borderColor="border" pt="4">
            <Heading as="h3" fontSize="sm" fontWeight="semibold">
              Why this prediction
            </Heading>
            <Text mt="0.5" fontSize="xs" color="fg.muted">
              The regions and features that moved the model toward this label.
            </Text>
            <Flex mt="3" wrap="wrap" gap="4">
              <Box w="132px" flexShrink={0}>
                <Saliency />
                <Text mt="1.5" fontSize="11px" color="fg.muted">
                  Saliency overlay
                </Text>
              </Box>
              <Box minW="200px" flex="1">
                {contributions.map((entry) => (
                  <Bar key={entry.label} label={entry.label} value={entry.weight} mono={false} palette="lens" />
                ))}
              </Box>
            </Flex>
          </Box>

          <Text mt="4" fontSize="xs" color="fg.muted">
            Inference {model.latencyP95} · {model.name} v{model.version} · temporary endpoint, not billed
          </Text>
        </Box>
      </SectionCard>
    </Grid>
  );
}
