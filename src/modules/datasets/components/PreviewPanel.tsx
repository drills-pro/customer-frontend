import { useRef, useState } from 'react';
import { Box, Button, Center, EmptyState, Flex, Image, Skeleton, Stack, Table, Text } from '@chakra-ui/react';
import type { UseQueryResult } from '@tanstack/react-query';
import { Image as ImageIcon, Section } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { SimpleSelect } from '@/components/simple-select';
import type { DatasetPreview } from '@/modules/datasets/api';
import { PREVIEW_LIMITS } from '@/modules/datasets/constants';
import { LoadError } from '@/modules/datasets/components/LoadError';
import { cellText } from '@/modules/datasets/format';

const THUMB = '14';

/** One image. Presigned links expire, so the first load failure asks the panel for fresh rows; after that it shows a placeholder. */
function Thumb({ url, alt, onExpired }: { url: string; alt: string; onExpired: () => void }) {
  const [failed, setFailed] = useState(false);
  const asked = useRef(false);
  if (failed)
    return (
      <Center boxSize={THUMB} borderRadius="l2" bg="surface-sunken" color="fg.muted" aria-label={alt} role="img">
        <ImageIcon width={20} height={20} />
      </Center>
    );
  return (
    <Image
      src={url}
      alt={alt}
      boxSize={THUMB}
      objectFit="cover"
      borderRadius="l2"
      loading="lazy"
      onError={() => {
        if (!asked.current) {
          asked.current = true;
          onExpired();
        } else setFailed(true);
      }}
    />
  );
}

/** Sample rows of a version or a staged import, with a sampling limit. Tabular rows are a table; rows with a link also show the image. */
export function PreviewPanel({
  query,
  limit,
  onLimit,
}: {
  query: UseQueryResult<DatasetPreview>;
  limit: number;
  onLimit: (limit: number) => void;
}) {
  const { t } = useTranslation();
  const { data, isPending, isError, error, isFetching, refetch } = query;
  const limits = PREVIEW_LIMITS.map((n) => ({ label: t('datasets.preview.limitOption', { count: n }), value: String(n) }));
  const rows = data?.rows.map((row, i) => ({ row, id: `row-${i}` })) ?? [];
  const columns = data ? [...new Set(data.rows.flatMap((row) => Object.keys(row.data)))] : [];
  const hasImages = data?.rows.some((row) => row.url) ?? false;

  return (
    <Stack gap="3" data-testid="preview-panel" aria-busy={isFetching}>
      <Flex align="end" justify="space-between" gap="3" wrap="wrap">
        <SimpleSelect
          label={t('datasets.preview.limit')}
          items={limits}
          value={String(limit)}
          onChange={(v) => onLimit(Number(v))}
          size="sm"
          width="44"
        />
        <Button size="sm" onClick={() => void refetch()} loading={isFetching && !isPending}>
          {t('datasets.preview.refresh')}
        </Button>
      </Flex>
      {isError ? (
        <LoadError title={t('datasets.preview.loadFailed')} error={error} onRetry={() => void refetch()} />
      ) : isPending ? (
        <Skeleton h="48" />
      ) : !data.rows.length ? (
        <EmptyState.Root borderWidth="2px" borderColor="border" borderRadius="l3">
          <EmptyState.Content>
            <EmptyState.Indicator>
              <Section />
            </EmptyState.Indicator>
            <EmptyState.Title>{t('datasets.preview.empty')}</EmptyState.Title>
          </EmptyState.Content>
        </EmptyState.Root>
      ) : (
        <>
          <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
            <Table.Root variant="data" minW="xl">
              <Table.Header>
                <Table.Row>
                  {hasImages && <Table.ColumnHeader w={THUMB}>{t('datasets.preview.image')}</Table.ColumnHeader>}
                  {columns.map((name) => (
                    <Table.ColumnHeader key={name}>{name}</Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map(({ row, id }, i) => (
                  <Table.Row key={id} data-testid="preview-row">
                    {hasImages && (
                      <Table.Cell>
                        {row.url && (
                          <Thumb url={row.url} alt={t('datasets.preview.imageAlt', { row: i + 1 })} onExpired={() => void refetch()} />
                        )}
                      </Table.Cell>
                    )}
                    {columns.map((name) => (
                      <Table.Cell key={name} maxW="64" truncate>
                        {cellText(row.data[name])}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
          <Box>
            <Text textStyle="body-sm" color="fg.muted">
              {t('datasets.preview.shown', { count: data.rows.length })}
            </Text>
          </Box>
        </>
      )}
    </Stack>
  );
}
