import { IconButton, Menu, Portal } from '@chakra-ui/react';
import { MoreVertical } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { isPromoting, isServing, MODEL_STAGES, usePromoteModel, type ModelStage, type ModelVersion } from '@/modules/models/api';
import { modelErrorKey } from '@/modules/models/errors';

/** A version's other actions: a stage set by hand (not for the serving version, which another promotion replaces, nor one being
 * promoted). Failures come back as a toast. */
export function ModelMenu({ projectId, version }: { projectId: string; version: ModelVersion }) {
  const { t } = useTranslation();
  const promote = usePromoteModel(projectId);
  const name = t('models.version', { version: version.mlflow_version });
  const stages = isServing(version) || isPromoting(version) ? [] : MODEL_STAGES.filter((s) => s !== version.stage);

  const setStage = async (stage: ModelStage) => {
    try {
      await promote.mutateAsync({ versionId: version.id, stage });
    } catch (e) {
      toaster.create({ type: 'error', title: t('models.toast.stageFailed'), description: t(modelErrorKey(e)) });
    }
  };

  if (stages.length === 0) return null;
  return (
    <Menu.Root positioning={{ placement: 'bottom-end' }}>
      <Menu.Trigger asChild>
        <IconButton variant="ghost" size="xs" color="fg.muted" aria-label={t('models.menu', { name })} data-testid="model-menu">
          <MoreVertical />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content>
            {stages.map((stage) => (
              <Menu.Item
                key={stage}
                value={stage}
                disabled={promote.isPending}
                onSelect={() => void setStage(stage)}
                data-testid={`model-stage-${stage}`}
              >
                {t(`models.move.${stage}`)}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
