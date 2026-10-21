import * as React from 'react';
import { Button, CloseButton, Dialog, Field, Input, Portal, Spinner, Stack, Text } from '@chakra-ui/react';
import { Upload } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { SimpleSelect } from '@/components/simple-select';
import { taskLabel } from '@/features/dashboard/format';
import { useUploadDataset } from '@/features/dashboard/queries';
import { acceptedUploads, uploadKind } from '@/features/datasets/upload-rules';
import type { ApiProject } from '@/features/dashboard/api';

export function UploadDialog({
  open,
  onOpenChange,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A dataset always belongs to a project, so the user has to pick one. */
  projects: ApiProject[];
}) {
  const [projectId, setProjectId] = React.useState('');
  const [name, setName] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState('');
  const upload = useUploadDataset();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const datasetName = name.trim();
    const project = projects.find((item) => item.id === projectId);
    if (!datasetName) return setError('Enter a dataset name.');
    if (!project) return setError('Choose a project.');
    const kind = file ? uploadKind(file) : undefined;
    if (!file || !kind) return setError('Choose a ZIP or CSV file.');
    const accepted = acceptedUploads(project.task_type);
    if (!accepted.includes(kind)) {
      return setError(
        accepted.length
          ? `${taskLabel(project.task_type)} projects take a ${accepted.join(' or ').toUpperCase()} file here.`
          : `${taskLabel(project.task_type)} projects cannot be uploaded to from here yet.`,
      );
    }

    setError('');
    upload.mutate(
      { project, name: datasetName, file },
      {
        onSuccess: () => {
          toaster.create({
            type: 'success',
            title: `${datasetName} uploaded to ${project.name}.`,
          });
          setName('');
          setFile(null);
          onOpenChange(false);
        },
        onError: (cause) => setError(cause.message),
      },
    );
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(event) => {
        onOpenChange(event.open);
        if (!event.open) setError('');
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content asChild>
            <form onSubmit={submit}>
              <Dialog.Header flexDirection="column" alignItems="stretch" gap="1">
                <Dialog.Title>Upload dataset</Dialog.Title>
                <Dialog.Description textStyle="body-sm" color="fg.muted">
                  Add a ZIP of labelled image folders or a CSV to one of your projects.
                </Dialog.Description>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  <SimpleSelect
                    label="Project"
                    items={projects.map((project) => ({
                      label: project.name,
                      value: project.id,
                    }))}
                    value={projectId}
                    onChange={setProjectId}
                    placeholder={projects.length ? 'Choose a project' : 'No projects yet'}
                    width="full"
                    portalled={false}
                  />

                  <Field.Root>
                    <Field.Label>Dataset name</Field.Label>
                    <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="retail-products-v3" />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label>Dataset files</Field.Label>
                    <Input type="file" accept=".csv,.zip" pt="1.5" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
                  </Field.Root>

                  {error && (
                    <Text role="alert" textStyle="body-sm" color="fg.error">
                      {error}
                    </Text>
                  )}
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="solid" disabled={upload.isPending}>
                  {upload.isPending ? <Spinner size="sm" /> : <Upload />}
                  Upload dataset
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
