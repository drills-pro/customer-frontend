import { useEffect, type ReactNode } from 'react';
import { Alert, Badge, Box, Button, Center, Flex, Heading, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { Database } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDatasets, useVersions, versionCounts, type DatasetSummary } from '@/modules/datasets';
import { StepHeading } from '@/shared/ui/wizard';

/** What the run trains on, with the names the summary shows. */
export interface DataChoice {
  datasetId: string;
  datasetName: string;
  versionId: string | null;
  versionNumber: number | null;
}

interface Props {
  projectId: string;
  slug: string;
  choice: DataChoice | null;
  onChange: (choice: DataChoice) => void;
}

/** A choice card: an option button that marks itself pressed, with a dot at its end when chosen. */
function OptionCard({
  pressed,
  onClick,
  testId,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  testId: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="option"
      onClick={onClick}
      aria-pressed={pressed}
      w="full"
      minW="0"
      justifyContent="space-between"
      gap="4"
      borderRadius="l3"
      data-testid={testId}
    >
      {children}
      <Box aria-hidden="true" boxSize="2" flexShrink={0} bg="brand.solid" opacity={pressed ? 1 : 0} />
    </Button>
  );
}

/** Pick one of the project's datasets, then one of its versions. The chosen dataset (else the first) and its published (else newest)
 * version come preselected. */
export function DataStep({ projectId, slug, choice, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const { datasets: loaded, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useDatasets(projectId);
  // A picker needs every dataset, so read the remaining pages straight away.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  const datasets = loaded?.filter((d) => !d.deleted_at);
  const dataset = datasets?.find((d) => d.id === choice?.datasetId) ?? datasets?.[0];
  // A clone starts with only the ids, so the name is filled in here too.
  useEffect(() => {
    if (dataset && (dataset.id !== choice?.datasetId || dataset.name !== choice.datasetName))
      onChange({
        datasetId: dataset.id,
        datasetName: dataset.name,
        versionId: dataset.id === choice?.datasetId ? choice.versionId : null,
        versionNumber: null,
      });
  }, [dataset, choice, onChange]);
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium' });

  const heading = <StepHeading title={t('training.data.title')} description={t('training.data.description')} />;
  if (isError)
    return (
      <Stack as="section" gap="5">
        {heading}
        <Alert.Root status="error" colorPalette="danger">
          <Alert.Indicator />
          <Alert.Content gap="3">
            <Alert.Description>{t('training.data.loadFailed')}</Alert.Description>
            <Box>
              <Button size="sm" onClick={() => void refetch()}>
                {t('training.retry')}
              </Button>
            </Box>
          </Alert.Content>
        </Alert.Root>
      </Stack>
    );
  if (isPending || !datasets) return <Skeleton h="32" />;

  return (
    <Stack as="section" gap="5">
      {heading}
      {!dataset ? (
        <Alert.Root status="info" colorPalette="info" data-testid="training-no-datasets">
          <Alert.Indicator />
          <Alert.Content gap="3">
            <Alert.Description>{t('training.data.noDatasets')}</Alert.Description>
            <Box>
              <Button asChild size="sm">
                <Link to="/w/$slug/projects/$projectId/datasets" params={{ slug, projectId }}>
                  {t('training.data.goToDatasets')}
                </Link>
              </Button>
            </Box>
          </Alert.Content>
        </Alert.Root>
      ) : (
        <>
          <Stack gap="2.5" role="group" aria-label={t('training.data.dataset')} data-testid="training-datasets">
            {datasets.map((d) => {
              const pressed = d.id === dataset.id;
              return (
                <OptionCard
                  key={d.id}
                  pressed={pressed}
                  testId={`training-dataset-${d.id}`}
                  onClick={() => onChange({ datasetId: d.id, datasetName: d.name, versionId: null, versionNumber: null })}
                >
                  <Flex minW="0" align="center" gap="3.5">
                    <Center
                      boxSize="9"
                      flexShrink={0}
                      borderRadius="l2"
                      bg={pressed ? 'brand.solid' : 'brand.subtle'}
                      color={pressed ? 'brand.contrast' : 'brand.fg'}
                    >
                      <Database width={18} height={18} />
                    </Center>
                    <Box minW="0">
                      <Text truncate textStyle="body-sm" fontWeight="semibold">
                        {d.name}
                      </Text>
                      <Text textStyle="body-sm" color="fg.muted">
                        {t('training.data.createdOn', { date: date.format(new Date(d.created_at)) })}
                      </Text>
                    </Box>
                  </Flex>
                </OptionCard>
              );
            })}
          </Stack>
          <VersionPicker key={dataset.id} projectId={projectId} slug={slug} dataset={dataset} choice={choice} onChange={onChange} />
        </>
      )}
    </Stack>
  );
}

function VersionPicker({
  projectId,
  slug,
  dataset,
  choice,
  onChange,
}: Omit<Props, 'choice'> & { dataset: DatasetSummary; choice: DataChoice | null }) {
  const { t, i18n } = useTranslation();
  const { versions, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useVersions(projectId, dataset.id);
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  // Newest first; the published version is the dataset's chosen one, so it comes preselected when there is one.
  const preferred = versions?.find((v) => v.id === dataset.published_version_id) ?? versions?.[0];
  const current = versions?.find((v) => v.id === choice?.versionId) ?? preferred;
  useEffect(() => {
    if (current && (current.id !== choice?.versionId || current.number !== choice.versionNumber))
      onChange({ datasetId: dataset.id, datasetName: dataset.name, versionId: current.id, versionNumber: current.number });
  }, [current, choice, dataset, onChange]);
  const number = new Intl.NumberFormat(i18n.resolvedLanguage);

  if (isError)
    return (
      <Alert.Root status="error" colorPalette="danger">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Description>{t('training.data.versionsFailed')}</Alert.Description>
          <Box>
            <Button size="sm" onClick={() => void refetch()}>
              {t('training.retry')}
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );
  if (isPending || !versions) return <Skeleton h="16" />;
  if (!current)
    return (
      <Alert.Root status="info" colorPalette="info" data-testid="training-no-versions">
        <Alert.Indicator />
        <Alert.Content gap="3">
          <Alert.Description>{t('training.data.noVersions')}</Alert.Description>
          <Box>
            <Button asChild size="sm">
              <Link to="/w/$slug/projects/$projectId/datasets/$datasetId" params={{ slug, projectId, datasetId: dataset.id }}>
                {t('training.data.goToDataset')}
              </Link>
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    );

  return (
    <Box borderTopWidth="1px" borderColor="border" pt="5">
      <Flex mb="3" wrap="wrap" align="baseline" justify="space-between" gap="2">
        <Heading as="h3" textStyle="body-sm" fontWeight="semibold">
          {t('training.data.versionLabel')}
        </Heading>
        <Text textStyle="body-sm" color="fg.muted">
          {t('training.data.versionHelp')}
        </Text>
      </Flex>
      <SimpleGrid
        columns={{ base: 1, sm: 2 }}
        gap="2.5"
        role="group"
        aria-label={t('training.data.versionLabel')}
        data-testid="training-versions"
      >
        {versions.map((v) => {
          const counts = versionCounts(v.stats);
          const meta = [
            counts.rows !== undefined && t('training.data.items', { count: counts.rows, value: number.format(counts.rows) }),
            counts.classes !== undefined && t('training.data.classes', { count: counts.classes }),
          ].filter(Boolean);
          return (
            <OptionCard
              key={v.id}
              pressed={v.id === current.id}
              testId={`training-version-${v.id}`}
              onClick={() => onChange({ datasetId: dataset.id, datasetName: dataset.name, versionId: v.id, versionNumber: v.number })}
            >
              <Box minW="0">
                <Flex align="center" gap="2" wrap="wrap">
                  <Text textStyle="body-sm" fontWeight="semibold">
                    {t('training.data.version', { number: v.number })}
                  </Text>
                  {v.id === dataset.published_version_id && (
                    <Badge colorPalette="success" variant="subtle">
                      {t('training.data.published')}
                    </Badge>
                  )}
                </Flex>
                {meta.length > 0 && (
                  <Text textStyle="body-sm" color="fg.muted">
                    {meta.join(' · ')}
                  </Text>
                )}
              </Box>
            </OptionCard>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
