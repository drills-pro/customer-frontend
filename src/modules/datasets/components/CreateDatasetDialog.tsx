import { useState } from 'react';
import { Alert, Button, CloseButton, Dialog, Field, Input, Portal, Stack } from '@chakra-ui/react';
import { Plus } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useCreateDataset } from '@/modules/datasets/api';
import { datasetErrorKey } from '@/modules/datasets/errors';

/** Name a new dataset; it opens on success. `disabled` is the write-denied state. */
export function CreateDatasetDialog({
  projectId,
  disabled,
  onCreated,
}: {
  projectId: string;
  disabled?: boolean;
  onCreated: (datasetId: string) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const create = useCreateDataset(projectId);
  const trimmed = name.trim();

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      create.reset();
      setName('');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Trigger asChild>
        <Button variant="solid" disabled={disabled} data-testid="datasets-create-open">
          <Plus />
          {t('datasets.create.open')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('datasets.create.title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack
                as="form"
                gap="4"
                id="dataset-create-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!trimmed) return;
                  create.mutate(trimmed, { onSuccess: (dataset) => onCreated(dataset.id) });
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
            </Dialog.Body>
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
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={t('datasets.close')} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
