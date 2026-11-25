import { useEffect, type ReactNode } from 'react';
import { Alert, Box, Button, Flex, Heading, SimpleGrid, Skeleton, Stack, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useProjectDataset, useVersions, versionCounts, type DatasetSummary } from '@/modules/datasets';
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

/** The project's one dataset, then one of its versions. The newest version comes preselected. */
export function DataStep({ projectId, slug, choice, onChange }: Props) {
  const { t } = useTranslation();
  const { dataset, isPending, isError, refetch } = useProjectDataset(projectId);
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
  if (isPending) return <Skeleton h="32" />;

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
        <VersionPicker key={dataset.id} projectId={projectId} slug={slug} dataset={dataset} choice={choice} onChange={onChange} />
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
  // Newest first, so the first one comes preselected.
  const current = versions?.find((v) => v.id === choice?.versionId) ?? versions?.[0];
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
              <Link to="/w/$slug/projects/$projectId/datasets" params={{ slug, projectId }}>
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
