import { useState } from 'react';
import { Alert, Button, Checkbox, Clipboard, Dialog, IconButton, Input, InputGroup, Portal, Stack, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { CloudServer, Upload } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { DeploymentStatus } from '@/modules/projects';
import { useWorkspace } from '@/modules/workspaces';
import { useCreateDeployment, useRunLineage, type DeploymentCreated } from '@/modules/deployments/api';
import { deploymentErrorKey, isRisk } from '@/modules/deployments/errors';
import { newIdempotencyKey } from '@/shared/api/idempotency';

const DEPLOYMENT_PATH = '/w/$slug/projects/$projectId/deployments/$deploymentId';
const REDEPLOYABLE: readonly string[] = [DeploymentStatus.Deleted, DeploymentStatus.Failed];

/** On a finished run: deploy its model, or open the deployment it already has. The dialog asks first (and can make it the project's main
 * model); a run with no test split, or one scored below the task's quality floor, needs the person to accept that risk. */
export function DeployRunButton({ projectId, runId }: { projectId: string; runId: string }) {
  const { t } = useTranslation();
  const { id: workspaceId, slug } = useWorkspace();
  const lineage = useRunLineage(projectId, runId);
  const create = useCreateDeployment(workspaceId, projectId);
  const [open, setOpen] = useState(false);
  // One key per attempt: a double click or a network retry replays the first answer instead of minting a second deployment.
  const [key, setKey] = useState(newIdempotencyKey);
  const [acknowledged, setAcknowledged] = useState(false);
  const [setMain, setSetMain] = useState(false);
  const [created, setCreated] = useState<DeploymentCreated | null>(null);
  // Lineage answers the run's newest deployment in any status; a deleted or failed one can be deployed again.
  const newest = lineage.data?.deployment;
  const existing = newest && !REDEPLOYABLE.includes(newest.status) ? newest : null;

  const reset = () => {
    create.reset();
    setKey(newIdempotencyKey());
    setAcknowledged(false);
    setSetMain(false);
    setCreated(null);
  };
  const deploy = () =>
    create.mutate(
      { runId, key, acknowledgeRisk: acknowledged, setMain },
      {
        onSuccess: setCreated,
        // A refused attempt is over: the next click is a new one.
        onError: () => setKey(newIdempotencyKey()),
      },
    );
  const risk = create.isError && isRisk(create.error);

  return (
    <>
      {existing && !created ? (
        <Button asChild size="sm">
          <Link to={DEPLOYMENT_PATH} params={{ slug, projectId, deploymentId: existing.id }} data-testid="training-run-deployment">
            <CloudServer />
            {t('deployments.deploy.view')}
          </Link>
        </Button>
      ) : (
        // Outline: the project header holds the screen's one solid button.
        <Button size="sm" onClick={() => setOpen(true)} loading={lineage.isPending} data-testid="training-run-deploy">
          <Upload />
          {t('deployments.deploy.open')}
        </Button>
      )}
      {/* Mounted apart from the trigger: once the deploy lands the trigger turns into a link, and the key must stay on screen. */}
      <Dialog.Root
        open={open}
        onOpenChange={(e) => {
          setOpen(e.open);
          if (!e.open) reset();
        }}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content data-testid="deploy-dialog">
              <Dialog.Header>
                <Dialog.Title>{t(created ? 'deployments.deploy.doneTitle' : 'deployments.deploy.title')}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {created ? (
                  <Created created={created} />
                ) : (
                  <Stack gap="4">
                    <Dialog.Description>{t('deployments.deploy.description')}</Dialog.Description>
                    <Checkbox.Root
                      size="sm"
                      checked={setMain}
                      onCheckedChange={(e) => setSetMain(e.checked === true)}
                      data-testid="deploy-set-main"
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>{t('deployments.deploy.setMain')}</Checkbox.Label>
                    </Checkbox.Root>
                    {risk && (
                      <Alert.Root status="warning" colorPalette="warning" data-testid="deploy-risk">
                        <Alert.Indicator />
                        <Alert.Content gap="3">
                          <Alert.Description>{t('deployments.deploy.risk')}</Alert.Description>
                          <Checkbox.Root
                            size="sm"
                            checked={acknowledged}
                            onCheckedChange={(e) => setAcknowledged(e.checked === true)}
                            data-testid="deploy-risk-accept"
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                            <Checkbox.Label>{t('deployments.deploy.riskAccept')}</Checkbox.Label>
                          </Checkbox.Root>
                        </Alert.Content>
                      </Alert.Root>
                    )}
                    {create.isError && !risk && (
                      <Alert.Root status="error" colorPalette="danger" data-testid="deploy-error">
                        <Alert.Indicator />
                        <Alert.Description>{t(deploymentErrorKey(create.error))}</Alert.Description>
                      </Alert.Root>
                    )}
                  </Stack>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                {created ? (
                  <Button asChild size="sm" variant="solid">
                    <Link to={DEPLOYMENT_PATH} params={{ slug, projectId, deploymentId: created.id }} data-testid="deploy-open">
                      {t('deployments.deploy.openDeployment')}
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Dialog.ActionTrigger asChild>
                      <Button size="sm">{t('deployments.deploy.cancel')}</Button>
                    </Dialog.ActionTrigger>
                    <Button
                      size="sm"
                      variant="solid"
                      loading={create.isPending}
                      disabled={risk && !acknowledged}
                      onClick={deploy}
                      data-testid="deploy-confirm"
                    >
                      {t('deployments.deploy.confirm')}
                    </Button>
                  </>
                )}
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

/** The deploy went through: the deployment's id is the X-Model-Id a predict call names (no key is minted any more). */
function Created({ created }: { created: DeploymentCreated }) {
  const { t } = useTranslation();
  return (
    <Stack gap="4" data-testid="deploy-created" data-deployment={created.id}>
      <Text>{t('deployments.deploy.started')}</Text>
      <Clipboard.Root value={created.id}>
        <Clipboard.Label>{t('deployments.deploy.idLabel')}</Clipboard.Label>
        <InputGroup
          endElement={
            <Clipboard.Trigger asChild>
              <IconButton variant="ghost" size="xs" aria-label={t('deployments.deploy.copyId')}>
                <Clipboard.Indicator />
              </IconButton>
            </Clipboard.Trigger>
          }
        >
          <Clipboard.Input asChild>
            <Input readOnly fontFamily="mono" data-testid="deploy-id" />
          </Clipboard.Input>
        </InputGroup>
      </Clipboard.Root>
      {created.main && <Text color="fg.muted">{t('deployments.deploy.mainNote')}</Text>}
    </Stack>
  );
}
