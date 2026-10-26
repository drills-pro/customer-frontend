import { Badge, Box, Code, HStack, SimpleGrid, Stack, Stat, Table, Text } from '@chakra-ui/react';
import { InfoBox, WarningDiamond } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import type { ImportReport } from '@/modules/datasets/api';
import { Severity } from '@/modules/datasets/constants';
import { formatBytes } from '@/modules/datasets/format';

const Count = ({ label, value }: { label: string; value: string }) => (
  <Stat.Root>
    <Stat.Label>{label}</Stat.Label>
    <Stat.ValueText textStyle="h3">{value}</Stat.ValueText>
  </Stat.Root>
);

/** What the import found: the size of the result, then every issue with its severity, location and message. */
export function ReportView({ report }: { report: ImportReport }) {
  const { t, i18n } = useTranslation();
  const number = new Intl.NumberFormat(i18n.resolvedLanguage);
  const { stats, issues } = report;
  const tags = (counts: Record<string, number>) => Object.entries(counts).map(([name, n]) => `${name} (${number.format(n)})`);
  const rows = issues.map((issue, i) => ({ issue, id: `issue-${i}` }));
  const groups = stats ? [tags(stats.classes), tags(stats.splits)] : [];
  return (
    <Stack gap="5" data-testid="import-report">
      {stats && (
        <Stack gap="4">
          <SimpleGrid columns={{ base: 2, md: 4 }} gap="4">
            <Count label={t('datasets.report.rows')} value={number.format(stats.row_count)} />
            {stats.file_count > 0 && <Count label={t('datasets.report.files')} value={number.format(stats.file_count)} />}
            {stats.total_bytes > 0 && (
              <Count label={t('datasets.report.size')} value={formatBytes(stats.total_bytes, i18n.resolvedLanguage)} />
            )}
            <Count label={t('datasets.report.duplicates')} value={number.format(stats.duplicates_skipped)} />
          </SimpleGrid>
          {(['classes', 'splits'] as const).map((kind, i) =>
            groups[i]?.length ? (
              <HStack key={kind} wrap="wrap" gap="2">
                <Text textStyle="body-sm" color="fg.muted">
                  {t(`datasets.report.${kind}`)}
                </Text>
                {groups[i].map((label) => (
                  <Badge key={label} variant="subtle">
                    {label}
                  </Badge>
                ))}
              </HStack>
            ) : null,
          )}
        </Stack>
      )}
      {issues.length > 0 && (
        <Box>
          <Text fontWeight="semibold" mb="2">
            {t('datasets.report.issues', { count: issues.length + report.issues_omitted })}
          </Text>
          <Table.ScrollArea borderRadius="l3" borderWidth="1px" borderColor="border" bg="surface-raised">
            <Table.Root variant="data" minW="2xl">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{t('datasets.report.severity')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('datasets.report.code')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('datasets.report.path')}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t('datasets.report.message')}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map(({ issue, id }) => (
                  <Table.Row key={id} data-testid="import-issue" data-severity={issue.severity}>
                    <Table.Cell>
                      <Badge colorPalette={issue.severity === Severity.Error ? 'danger' : 'warning'} variant="subtle" gap="1">
                        {issue.severity === Severity.Error ? <WarningDiamond width={12} height={12} /> : <InfoBox width={12} height={12} />}
                        {t(`datasets.report.${issue.severity}`)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Code>{issue.code}</Code>
                    </Table.Cell>
                    <Table.Cell maxW="48" truncate>
                      {issue.path ?? ''}
                    </Table.Cell>
                    <Table.Cell whiteSpace="normal">{issue.message}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
          {report.issues_omitted > 0 && (
            <Text mt="2" textStyle="body-sm" color="fg.muted" data-testid="import-issues-omitted">
              {t('datasets.report.omitted', { count: report.issues_omitted })}
            </Text>
          )}
        </Box>
      )}
    </Stack>
  );
}
