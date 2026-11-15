import { Fragment } from 'react';
import { Badge, Box, Card, Center, Flex, Grid, HStack, Link as ChakraLink, Skeleton, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { ArrowRight, Checkbox, CheckboxOn, Hourglass, Minus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDatasetCount, useDeployments, useTrainingRuns } from '@/modules/projects/api';
import { PIPELINE_STAGES, StageState, type StageId } from '@/modules/projects/constants';
import { dataStage, deployStage, trainStage, type Stage } from '@/modules/projects/pipeline';
import { useWorkspace } from '@/modules/workspaces';
import type { PixelIcon } from '@/shared/ui/icons';

/** Status always shows a glyph and a word. */
const STATE_LOOK: Record<StageState, { icon: PixelIcon; palette: string }> = {
  [StageState.Done]: { icon: CheckboxOn, palette: 'success' },
  [StageState.Active]: { icon: Hourglass, palette: 'info' },
  [StageState.Todo]: { icon: Checkbox, palette: 'gray' },
  [StageState.Unavailable]: { icon: Minus, palette: 'gray' },
};

/** The stages that have a page of their own; the stage title leads there. */
const STAGE_LINKS = {
  data: '/w/$slug/projects/$projectId/datasets',
  train: '/w/$slug/projects/$projectId/training',
  deploy: '/w/$slug/projects/$projectId/deployments',
} as const satisfies Partial<Record<StageId, string>>;

/** Data, train, deploy: how far the project has come, from what each part of the API reports. A part that fails to load reads as unavailable. */
export function PipelineCard({ projectId }: { projectId: string }) {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const datasets = useDatasetCount(workspaceId, projectId);
  const runs = useTrainingRuns(workspaceId, projectId);
  const deployments = useDeployments(workspaceId, projectId);
  const stages: Record<StageId, { stage: Stage; loading: boolean }> = {
    data: { stage: dataStage(datasets.data, datasets.isError), loading: datasets.isPending },
    train: { stage: trainStage(runs.data, runs.isError), loading: runs.isPending },
    deploy: { stage: deployStage(deployments.data, deployments.isError), loading: deployments.isPending },
  };

  return (
    <Card.Root variant="outline">
      <Card.Header>
        <Card.Title as="h2" textStyle="body" fontWeight="semibold">
          {t('projects.overview.pipeline.title')}
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <Grid gap="3" alignItems={{ lg: 'center' }} templateColumns={{ lg: 'minmax(0,1fr) auto minmax(0,1fr) auto minmax(0,1fr)' }}>
          {PIPELINE_STAGES.map((id, index) => {
            const { stage, loading } = stages[id];
            const title = t(`projects.overview.pipeline.${id}.title`);
            return (
              <Fragment key={id}>
                <Flex
                  direction="column"
                  gap="2"
                  minW="0"
                  p="4"
                  borderWidth="1px"
                  borderColor="border"
                  borderRadius="l3"
                  bg="surface-raised"
                  data-testid={`pipeline-${id}`}
                  data-state={loading ? undefined : stage.state}
                  data-count={stage.count ?? undefined}
                >
                  <Flex align="center" justify="space-between" gap="2">
                    <HStack gap="2" minW="0">
                      <Center boxSize="7" flexShrink={0} borderRadius="full" bg="bg.muted" color="fg.muted" textStyle="body-sm">
                        {index + 1}
                      </Center>
                      {id in STAGE_LINKS ? (
                        <ChakraLink asChild fontWeight="semibold" data-testid={`pipeline-${id}-link`}>
                          <Link to={STAGE_LINKS[id as keyof typeof STAGE_LINKS]} params={{ slug, projectId }}>
                            {title}
                          </Link>
                        </ChakraLink>
                      ) : (
                        <Text fontWeight="semibold">{title}</Text>
                      )}
                    </HStack>
                    {loading ? <Skeleton h="5" w="16" /> : <StageBadge state={stage.state} />}
                  </Flex>
                  {loading ? <Skeleton h="4" w="24" /> : <StageSummary id={id} stage={stage} />}
                </Flex>
                {index < PIPELINE_STAGES.length - 1 && (
                  <Box display={{ base: 'none', lg: 'block' }} color="fg.subtle" aria-hidden="true">
                    <ArrowRight width={16} height={16} />
                  </Box>
                )}
              </Fragment>
            );
          })}
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}

function StageBadge({ state }: { state: StageState }) {
  const { t } = useTranslation();
  const look = STATE_LOOK[state];
  return (
    <Badge colorPalette={look.palette} variant="subtle" gap="1" flexShrink={0}>
      <look.icon width={12} height={12} />
      {t(`projects.overview.pipeline.state.${state}`)}
    </Badge>
  );
}

function StageSummary({ id, stage }: { id: StageId; stage: Stage }) {
  const { t } = useTranslation();
  if (stage.count === null)
    return (
      <Text textStyle="body-sm" color="fg.muted">
        {t('projects.overview.pipeline.unavailable')}
      </Text>
    );
  const count = t(`projects.overview.pipeline.${id}.${stage.more ? 'countMore' : 'count'}`, { count: stage.count });
  return (
    <Text textStyle="body-sm" color="fg.muted" truncate>
      {stage.inProgress > 0 ? t('projects.overview.pipeline.withActive', { total: count, active: stage.inProgress }) : count}
    </Text>
  );
}
