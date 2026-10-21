import * as React from 'react';
import { Box, Button, Field, Flex, Grid, Input, SimpleGrid, Stack, Text } from '@chakra-ui/react';
import { useNavigate } from '@tanstack/react-router';
import { Trash2 } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { AppDialog } from '@/components/shared/app-dialog';
import { DangerCard } from '@/components/shared/danger-card';
import { SectionCard } from '@/components/shared/section-card';
import { SimpleSelect } from '@/components/simple-select';
import { useComputeOptions } from '@/features/catalog/queries';
import { useDeleteDeployment, useUpdateDeployment } from '@/features/deployments/queries';
import { useCurrentDeployment } from './use-current-deployment';

export function SettingsTab() {
  const { project, deployment, model } = useCurrentDeployment();
  const navigate = useNavigate();
  const update = useUpdateDeployment(project.id, deployment.id);
  const remove = useDeleteDeployment(project.id, deployment.id);
  // The current type stays selectable even if it is no longer offered.
  const instanceTypes = [...new Set([deployment.instanceName, ...(useComputeOptions('serving').data ?? []).map((item) => item.id)])];
  const [values, setValues] = React.useState({
    name: deployment.name,
    serving: deployment.serving,
    minReplicas: String(deployment.minReplicas),
    maxReplicas: String(deployment.maxReplicas),
    instanceType: deployment.instanceName,
  });
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const set = (changes: Partial<typeof values>) => setValues((current) => ({ ...current, ...changes }));

  const modelLabel = model ? `${model.name} v${model.version}` : deployment.modelId;

  function save() {
    update.mutate(
      {
        name: values.name,
        serving: values.serving,
        min_replicas: Number(values.minReplicas),
        max_replicas: Number(values.maxReplicas),
        instance_type: values.instanceType,
      },
      {
        onSuccess: () =>
          toaster.create({
            type: 'success',
            title: 'Deployment settings saved.',
          }),
      },
    );
  }

  return (
    <Grid minW="0" alignItems="start" gap="6" templateColumns={{ lg: 'repeat(3, minmax(0, 1fr))' }}>
      <Grid minW="0" gap="6" gridColumn={{ lg: 'span 2' }}>
        <SectionCard title="Deployment settings">
          <Stack gap="5" p="5">
            <Field.Root>
              <Field.Label>Deployment name</Field.Label>
              <Input value={values.name} onChange={(event) => set({ name: event.target.value })} />
            </Field.Root>

            <Stack gap="1.5">
              <SimpleSelect
                label="Serving model"
                width="full"
                value={values.serving}
                onChange={(value) => set({ serving: value as typeof values.serving })}
                items={[
                  { label: `${modelLabel} (pinned)`, value: 'pinned' },
                  {
                    label: `${model?.name ?? deployment.modelId} (always latest)`,
                    value: 'latest',
                  },
                ]}
              />
              <Text textStyle="body-sm" color="fg.muted">
                Pinning a version means promoting a new model will not change what this endpoint serves.
              </Text>
            </Stack>

            <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
              <Field.Root>
                <Field.Label>Min replicas</Field.Label>
                <Input type="number" min={0} value={values.minReplicas} onChange={(event) => set({ minReplicas: event.target.value })} />
              </Field.Root>
              <Field.Root>
                <Field.Label>Max replicas</Field.Label>
                <Input type="number" min={1} value={values.maxReplicas} onChange={(event) => set({ maxReplicas: event.target.value })} />
              </Field.Root>
            </SimpleGrid>

            <SimpleSelect
              label="Instance type"
              width="full"
              value={values.instanceType}
              onChange={(value) => set({ instanceType: value })}
              items={instanceTypes.map((item) => ({
                label: item,
                value: item,
              }))}
            />
          </Stack>
          <Flex justify="flex-end" borderTopWidth="1px" borderColor="border" px="5" py="4">
            <Button variant="solid" size="sm" px="3.5" disabled={update.isPending} onClick={save}>
              Save settings
            </Button>
          </Flex>
        </SectionCard>

        <DangerCard title="Danger zone">
          <Flex wrap="wrap" align="center" gap="4" p="5">
            <Box me="auto" minW="0">
              <Text fontSize="13px" fontWeight="medium">
                Delete this deployment
              </Text>
              <Text mt="0.5" fontSize="xs" color="fg.muted">
                The endpoint stops answering immediately. The model itself is not deleted.
              </Text>
            </Box>
            <Button variant="solid" colorPalette="danger" size="sm" px="3.5" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete deployment
            </Button>
            <AppDialog
              role="alertdialog"
              open={deleteOpen}
              onOpenChange={setDeleteOpen}
              title={`Delete ${deployment.name}?`}
              description="The endpoint stops answering immediately. This cannot be undone."
              footer={
                <>
                  <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="solid"
                    colorPalette="danger"
                    size="sm"
                    disabled={remove.isPending}
                    onClick={() =>
                      // Leave the page before its deployment disappears.
                      // That unmounts this tab, so the result is read from the
                      // promise; a failure is reported by the global handler.
                      void navigate({
                        to: '/projects/$projectId/deployments',
                        params: { projectId: project.id },
                      })
                        .then(() => remove.mutateAsync())
                        .then(() =>
                          toaster.create({
                            type: 'success',
                            title: `${deployment.name} was deleted.`,
                          }),
                        )
                        .catch(() => undefined)
                    }
                  >
                    Delete deployment
                  </Button>
                </>
              }
            />
          </Flex>
        </DangerCard>
      </Grid>

      <SectionCard title="Deployment history">
        <Box p="3">
          {(
            [
              [`${modelLabel} promoted`, deployment.deployed, true],
              [`Scaled max replicas to ${deployment.maxReplicas}`, '2 weeks ago', false],
              ['Created', '5 weeks ago', false],
            ] as const
          ).map(([label, when, current]) => (
            <Flex key={label} gap="3" rounded="l2" px="2" py="2.5">
              <Box aria-hidden="true" mt="1.5" boxSize="1.5" flexShrink={0} rounded="full" bg={current ? 'success' : 'border'} />
              <Box minW="0">
                <Text fontSize="13px">{label}</Text>
                <Text fontSize="xs" color="fg.muted">
                  {when}
                </Text>
              </Box>
            </Flex>
          ))}
        </Box>
      </SectionCard>
    </Grid>
  );
}
