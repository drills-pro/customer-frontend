import { useState } from 'react';
import { Button, Checkbox, Dialog, Portal, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { isRollback, PromotionStatus, servingOf, usePromoteModel, type ModelVersion } from '@/modules/models/api';
import { modelErrorKey, promotionFailureKey, ProblemCode } from '@/modules/models/errors';

/** Promote to Production (or roll back to an older version, or try a failed promotion again), after saying what changes: the version
 * is deployed first, and the one serving now keeps serving until that deployment is active. A promotion refused for an unchecked run
 * asks for the risk to be accepted here. */
export function PromoteDialog({ projectId, version, models }: { projectId: string; version: ModelVersion; models: ModelVersion[] }) {
  const { t } = useTranslation();
  const promote = usePromoteModel(projectId);
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const rollback = isRollback(models, version);
  const failed = version.promotion_status === PromotionStatus.Failed;
  const risk = failed && version.promotion_error_code === ProblemCode.DeployRisk;
  const serving = servingOf(models, version);
  const name = t('models.version', { version: version.mlflow_version });
  const action = failed ? 'retry' : rollback ? 'rollback' : 'promote';

  const confirm = async () => {
    try {
      await promote.mutateAsync({ versionId: version.id, stage: 'Production', acknowledgeRisk: risk && accepted });
      setOpen(false);
    } catch {
      // The error shows in the dialog.
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        setOpen(e.open);
        if (!e.open) promote.reset();
      }}
    >
      <Dialog.Trigger asChild>
        <Button size="xs" data-testid="model-promote" data-action={rollback ? 'rollback' : 'promote'}>
          {t(`models.serving.${action}`)}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content data-testid="model-promote-dialog">
            <Dialog.Header>
              <Dialog.Title>{t(rollback ? 'models.confirm.rollbackTitle' : 'models.confirm.title', { name })}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="3">
                <Dialog.Description>
                  {serving
                    ? t('models.confirm.body', { name, serving: t('models.version', { version: serving.mlflow_version }) })
                    : t('models.confirm.bodyFirst', { name })}
                </Dialog.Description>
                {risk && (
                  <>
                    <Text textStyle="body-sm" color="fg.warning">
                      {t(promotionFailureKey(version.promotion_error_code))}
                    </Text>
                    <Checkbox.Root
                      size="sm"
                      checked={accepted}
                      onCheckedChange={(e) => setAccepted(e.checked === true)}
                      data-testid="model-promote-risk-accept"
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>{t('models.serving.riskAccept')}</Checkbox.Label>
                    </Checkbox.Root>
                  </>
                )}
                {promote.isError && (
                  <Text textStyle="body-sm" color="fg.error" role="alert">
                    {t(modelErrorKey(promote.error))}
                  </Text>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button size="sm">{t('models.confirm.cancel')}</Button>
              </Dialog.ActionTrigger>
              <Button
                size="sm"
                variant="solid"
                loading={promote.isPending}
                disabled={risk && !accepted}
                onClick={() => void confirm()}
                data-testid="model-promote-confirm"
              >
                {t(`models.serving.${action}`)}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
