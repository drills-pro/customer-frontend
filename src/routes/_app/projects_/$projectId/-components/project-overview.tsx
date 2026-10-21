import type * as React from 'react';
import { Box, Button, Card, Center, Flex, Heading, Stack, Text } from '@chakra-ui/react';
import { Link } from '@tanstack/react-router';
import { FolderKanban } from 'lucide-react';

import type { ProjectOverview, ResourceUsage, UsagePeriod } from '@/features/dashboard/data';

/** The unit of a single bar within the selected period, not of the period. */
export const usagePeriodLabels: Record<UsagePeriod, string> = {
  day: 'hours',
  week: 'days',
  month: 'days',
};

/** e.g. "last 24 hours" — the count comes from the series so copy can't drift. */
export function usageRangeLabel(resource: ResourceUsage, period: UsagePeriod) {
  return `last ${resource.series[period].length} ${usagePeriodLabels[period]}`;
}

export function FactList({ items }: { items: Array<[string, React.ReactNode]> }) {
  return (
    <Stack as="dl" gap="4">
      {items.map(([label, value]) => (
        <Flex key={label} align="flex-start" justify="space-between" gap="4">
          <Box as="dt" color="fg.muted">
            {label}
          </Box>
          <Box as="dd" textAlign="end" fontWeight="medium">
            {value}
          </Box>
        </Flex>
      ))}
    </Stack>
  );
}

export function serializeReadme(
  readme: NonNullable<ProjectOverview['readme']>,
  bestModel: NonNullable<ProjectOverview['bestModel']>,
  region: string,
) {
  return `\`status: production\` \`pytorch 2.4\` \`acc ${bestModel.accuracy.toFixed(1)}%\` \`${region}\`

## About

${readme.about}

## Model

| Property | Value |
| --- | --- |
| Architecture | ${readme.architecture} |
| Accuracy / F1 | ${bestModel.accuracy.toFixed(1)}% / ${bestModel.f1.toFixed(3)} |
| Latency | ${bestModel.latency} (p50, GPU) |
| Size | ${bestModel.size} |

## Quickstart

Call the live endpoint with a base64-encoded shelf image:

\`\`\`
${readme.quickstart}
\`\`\`

## Notes

${readme.notes.map((note) => `- **${note.label}:** ${note.text}`).join('\n')}
`;
}

export function formatUsageValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function getUsageSummary(resource: ResourceUsage, period: UsagePeriod) {
  const values = resource.series[period].map((point) => point.value);
  return resource.aggregation === 'peak' ? Math.max(...values) : Math.round(values.reduce((total, value) => total + value, 0) * 10) / 10;
}

export function ProjectNotFound({ projectId }: { projectId: string }) {
  return (
    <Center as="main" id="dashboard-main" mx="auto" minH="60vh" w="full" maxW="1440px" flex="1" p={{ base: '4', sm: '6', lg: '8' }}>
      <Card.Root variant="outline" w="full" maxW="md" textAlign="center">
        <Card.Body alignItems="center" py="8">
          <Center boxSize="12" rounded="full" bg="brand.subtle" color="brand.fg">
            <FolderKanban />
          </Center>
          <Heading as="h1" mt="4" fontSize="xl" fontWeight="semibold">
            Project not found
          </Heading>
          <Text mt="2" color="fg.muted">
            We could not find a project with the ID “{projectId}”.
          </Text>
          <Button asChild variant="solid" size="sm" mt="5">
            <Link to="/projects">Return to Projects</Link>
          </Button>
        </Card.Body>
      </Card.Root>
    </Center>
  );
}
