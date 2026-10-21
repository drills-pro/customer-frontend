import { Badge, Box, Button, Link, Text } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from '@tanstack/react-router';
import { Box as BoxIcon, Download, Rocket } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { EntityHeader } from '@/components/shared/entity-header';
import { SimpleSelect } from '@/components/simple-select';
import { useCreateDeployment } from '@/features/deployments/queries';
import { formatAccuracy, formatF1, StageBadge } from '../../../-components/model-list';
import { versionDeltas } from './helpers';
import type { Delta } from './helpers';
import { useCurrentModel } from './use-current-model';

/** Green when the change is an improvement, which depends on the metric. */
function DeltaLine({ delta, lower }: { delta: Delta; lower?: boolean }) {
  const improved = lower ? delta.tone === 'down' : delta.tone === 'up';
  const regressed = lower ? delta.tone === 'up' : delta.tone === 'down';
  return (
    <Text as="span" color={improved ? 'fg.success' : regressed ? 'fg.error' : delta.tone === 'flat' ? 'fg.muted' : undefined}>
      {delta.text}
    </Text>
  );
}

export function ModelHeader() {
  const { project, model, versions, deployment } = useCurrentModel();
  const navigate = useNavigate();
  const deploy = useCreateDeployment(project.id);
  const index = versions.findIndex((item) => item.id === model.id);
  const deltas = versionDeltas(model, index > 0 ? versions[index - 1] : undefined);
  const latest = versions.at(-1);

  return (
    <EntityHeader
      icon={BoxIcon}
      name={model.name}
      mono
      badges={
        <>
          <Badge colorPalette="gray" variant="subtle" fontFamily="mono">
            v{model.version}
          </Badge>
          <StageBadge stage={model.stage} />
        </>
      }
      meta={
        <>
          {model.architecture} · {model.framework} · from{' '}
          <Link asChild fontWeight="medium" color="fg">
            <RouterLink to="/projects/$projectId/training/$runId" params={{ projectId: model.projectId, runId: model.runId }}>
              run {model.runId}
            </RouterLink>
          </Link>{' '}
          · {model.size} · created {model.created} by {model.author}
        </>
      }
      actions={
        <>
          {versions.length > 1 ? (
            <Box fontFamily="mono">
              <SimpleSelect
                label="Model version"
                hideLabel
                size="sm"
                width="136px"
                value={model.id}
                onChange={(value) =>
                  navigate({
                    to: '/projects/$projectId/models/$modelId',
                    params: { projectId: model.projectId, modelId: value },
                  })
                }
                items={[...versions].reverse().map((item) => ({
                  label: `v${item.version}${item.id === latest?.id ? ' (latest)' : ''}`,
                  value: item.id,
                }))}
              />
            </Box>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            px="3.5"
            onClick={() =>
              toaster.create({
                type: 'info',
                title: 'Model downloads are not available in this demo.',
              })
            }
          >
            <Download />
            Download
          </Button>
          {deployment ? (
            <Button asChild variant="solid" size="sm" px="3.5">
              <RouterLink
                to="/projects/$projectId/deployments/$deploymentId"
                params={{
                  projectId: deployment.projectId,
                  deploymentId: deployment.id,
                }}
              >
                <Rocket />
                View deployment
              </RouterLink>
            </Button>
          ) : (
            <Button
              variant="solid"
              size="sm"
              px="3.5"
              disabled={deploy.isPending}
              onClick={() =>
                deploy.mutate(
                  { model_id: model.id },
                  {
                    onSuccess: (created) => {
                      toaster.create({
                        type: 'success',
                        title: `Deploying ${created.name}.`,
                      });
                      void navigate({
                        to: '/projects/$projectId/deployments/$deploymentId',
                        params: {
                          projectId: project.id,
                          deploymentId: created.id,
                        },
                      });
                    },
                  },
                )
              }
            >
              <Rocket />
              Deploy
            </Button>
          )}
        </>
      }
      stats={[
        {
          label: 'Accuracy',
          value: formatAccuracy(model.accuracy),
          delta: <DeltaLine delta={deltas.accuracy} />,
        },
        {
          label: 'Macro F1',
          value: formatF1(model.f1),
          delta: <DeltaLine delta={deltas.f1} />,
        },
        {
          label: 'Inference p95',
          value: model.latencyP95,
          delta: <DeltaLine delta={deltas.latency} lower />,
        },
        {
          label: 'Size',
          value: model.size,
          delta: <DeltaLine delta={deltas.size} />,
        },
      ]}
    />
  );
}
