import { useState } from 'react';
import { Alert, Button, CloseButton, Dialog, Field, Input, Portal, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useCreateDataset, type DatasetSummary } from '@/modules/datasets/api';
import { ImportForm } from '@/modules/datasets/components/ImportForm';
import { canImport } from '@/modules/datasets/constants';
import { datasetErrorKey } from '@/modules/datasets/errors';
import type { Schemas } from '@/shared/api/client';

type TaskType = Schemas['TaskType'];

/** A new dataset, named, then its data: the same import form, inside the dialog, for the dataset just made. A project whose task
 * cannot take data opens the dataset straight away. `disabled` is the write-denied state. */
export function CreateDatasetDialog({
  projectId,
  slug,
  task,
  open,
  onOpenChange,
  onCreated,
}: {
  projectId: string;
  slug: string;
  task: TaskType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (datasetId: string) => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [made, setMade] = useState<DatasetSummary | null>(null);
  const create = useCreateDataset(projectId);
  const trimmed = name.trim();

  const onChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      create.reset();
      setName('');
      setMade(null);
    }
  };

  const onDone = (dataset: DatasetSummary) => {
    if (task && canImport(task)) setMade(dataset);
    else onCreated(dataset.id);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onChange(e.open)}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="2xl">
            <Dialog.Header>
              <Dialog.Title>{t(made ? 'datasets.create.dataTitle' : 'datasets.create.title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {made && task ? (
                <Stack gap="4" data-testid="datasets-create-data">
                  <Text color="fg.muted">{t('datasets.create.dataHelp', { name: made.name })}</Text>
                  <ImportForm projectId={projectId} datasetId={made.id} slug={slug} task={task} baseVersions={[]} />
                </Stack>
              ) : (
                <Stack
                  as="form"
                  gap="4"
                  id="dataset-create-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!trimmed) return;
                    create.mutate(trimmed, { onSuccess: onDone });
                  }}
                >
                  <Field.Root required>
                    <Field.Label>{t('datasets.create.name')}</Field.Label>
                    <Input data-testid="datasets-create-name" value={name} onChange={(e) => setName(e.target.value)} />
                    <Field.HelperText>{t('datasets.create.nameHelp')}</Field.HelperText>
                  </Field.Root>
                  {create.isError && (
                    <Alert.Root status="error" colorPalette="danger">
                      <Alert.Indicator />
                      <Alert.Description>{t(datasetErrorKey(create.error))}</Alert.Description>
                    </Alert.Root>
                  )}
                </Stack>
              )}
            </Dialog.Body>
            {made && (
              <Dialog.Footer>
                <Button onClick={() => onCreated(made.id)} data-testid="datasets-create-later">
                  {t('datasets.create.later')}
                </Button>
              </Dialog.Footer>
            )}
            {!made && (
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button>{t('datasets.cancel')}</Button>
                </Dialog.ActionTrigger>
                <Button
                  type="submit"
                  form="dataset-create-form"
                  variant="solid"
                  loading={create.isPending}
                  disabled={!trimmed}
                  data-testid="datasets-create-submit"
                >
                  {t('datasets.create.submit')}
                </Button>
              </Dialog.Footer>
            )}
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={t('datasets.close')} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
