import * as React from 'react'
import {
  Box,
  Button,
  Field,
  Flex,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { Plus, Upload } from 'lucide-react'

import { AppDialog } from '@/components/shared/app-dialog'
import { SimpleSelect } from '@/components/simple-select'
import type { Dataset } from '@/features/dashboard/data'
import type { NewDataset } from '@/features/datasets/queries'
import { splitOptions, supportedFile } from './types'

export function AddDatasetDialog({
  open,
  onOpenChange,
  existing,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  existing: Dataset[]
  onAdd: (dataset: NewDataset) => void
}) {
  const [name, setName] = React.useState('')
  const [split, setSplit] = React.useState<Dataset['split']>('Train')
  const [source, setSource] = React.useState<'files' | 'bucket'>('files')
  const [files, setFiles] = React.useState<File[]>([])
  const [bucket, setBucket] = React.useState('')
  const [error, setError] = React.useState('')

  function chooseFiles(fileList: FileList | null) {
    if (!fileList) return
    const next = Array.from(fileList)
    if (next.some((file) => !supportedFile.test(file.name))) {
      setError('Choose CSV, JSON, JSONL, Parquet, ZIP, JPG, or PNG files.')
      return
    }
    setFiles(next)
    setError('')
    if (!name && next[0]) setName(next[0].name.replace(/\.[^.]+$/, ''))
  }

  function reset() {
    setName('')
    setSplit('Train')
    setSource('files')
    setFiles([])
    setBucket('')
    setError('')
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Enter a dataset name.')
    if (
      existing.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      return setError('This dataset name already exists in the project.')
    }
    if (source === 'files' && files.length === 0)
      return setError('Select at least one file.')
    if (source === 'bucket' && !/^s3:\/\/[^\s]+$/.test(bucket)) {
      return setError('Enter a bucket path such as s3://my-bucket/dataset.')
    }
    onAdd(
      source === 'bucket'
        ? { name: trimmed, split, source, bucketUri: bucket }
        : { name: trimmed, split, source, files },
    )
    reset()
    onOpenChange(false)
  }

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
      onSubmit={submit}
      size="lg"
      title="Add dataset"
      description="Add local data files or connect a mock cloud bucket."
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="solid" size="sm">
            <Plus />
            Add dataset
          </Button>
        </>
      }
    >
      <Stack gap="4">
        <Field.Root>
          <Field.Label>Dataset name</Field.Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. retail-shelf-v2"
            autoFocus
          />
        </Field.Root>
        <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
          <SimpleSelect
            label="Dataset source"
            width="full"
            portalled={false}
            value={source}
            onChange={(value) => setSource(value as 'files' | 'bucket')}
            items={[
              { label: 'Local files', value: 'files' },
              { label: 'Cloud bucket', value: 'bucket' },
            ]}
          />
          <SimpleSelect
            label="Dataset type"
            width="full"
            portalled={false}
            value={split}
            onChange={(value) => setSplit(value as Dataset['split'])}
            items={splitOptions.map((item) => ({ label: item, value: item }))}
          />
        </SimpleGrid>
        {source === 'files' ? (
          <Flex
            as="label"
            direction="column"
            align="center"
            justify="center"
            gap="1"
            minH="32"
            cursor="pointer"
            rounded="l3"
            borderWidth="1px"
            borderStyle="dashed"
            borderColor="border.emphasized"
            bg="bg.muted"
            textAlign="center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              chooseFiles(event.dataTransfer.files)
            }}
          >
            <Box color="brand-text">
              <Upload size={24} />
            </Box>
            <Text fontWeight="medium">
              {files.length
                ? `${files.length} file${files.length === 1 ? '' : 's'} selected`
                : 'Drop files here or click to browse'}
            </Text>
            <Text fontSize="xs" color="fg.muted">
              CSV, JSONL, Parquet, ZIP, JPG, PNG
            </Text>
            <Input
              aria-label="Dataset files"
              type="file"
              multiple
              srOnly
              accept=".csv,.json,.jsonl,.parquet,.zip,.jpg,.jpeg,.png"
              onChange={(event) => chooseFiles(event.target.files)}
            />
          </Flex>
        ) : (
          <Field.Root>
            <Field.Label>Bucket path</Field.Label>
            <Input
              value={bucket}
              onChange={(event) => setBucket(event.target.value)}
              placeholder="s3://my-bucket/dataset"
            />
          </Field.Root>
        )}
        {error && (
          <Text role="alert" textStyle="body-sm" color="fg.error">
            {error}
          </Text>
        )}
      </Stack>
    </AppDialog>
  )
}
