import { Box, Flex, Stack, Text } from '@chakra-ui/react';
import { CheckCircle2, Download } from 'lucide-react';

import { SectionAction, SectionCard } from '@/components/shared/section-card';
import type { QualitySeverity } from '@/features/dashboard/data';
import { unavailable } from '@/lib/unavailable';

import { downloadJson, getQualityScore, getQualityStatus } from './helpers';
import type { DatasetTab } from './types';
import { useCurrentDataset } from './use-current-dataset';

const SEVERITY_RANK: Record<QualitySeverity, number> = {
  error: 0,
  warning: 1,
  pass: 2,
};

const SEVERITY_PALETTE: Record<Exclude<QualitySeverity, 'pass'>, string> = {
  error: 'danger',
  warning: 'warning',
};

export function QualityTab({ onNavigateTab }: { onNavigateTab: (tab: DatasetTab) => void }) {
  const { dataset, detail } = useCurrentDataset();
  const { findings, lastChecked } = detail.qualityReport;
  const score = getQualityScore(findings);
  const status = getQualityStatus(score);

  const issues = findings
    .filter((finding) => finding.severity !== 'pass')
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  const passed = findings.filter((finding) => finding.severity === 'pass');

  return (
    <SectionCard title="Quality report" divided={false}>
      <Stack gap="6" px="5" pb="5">
        <Box>
          <Flex align="baseline" gap="1.5">
            <Text as="span" fontSize="4xl" fontWeight="bold" letterSpacing="tight" lineHeight="1">
              {score}
            </Text>
            <Text as="span" fontSize="lg" color="fg.muted">
              / 100
            </Text>
          </Flex>
          <Text mt="1" textStyle="body-sm" color="fg.muted">
            {status.label}
            {issues.length > 0 && ` — lowered by ${issues.length} finding${issues.length === 1 ? '' : 's'} below`}
          </Text>
          <QualityGauge score={score} />
        </Box>

        {issues.length > 0 && (
          <Box>
            <Text mb="3" fontSize="xs" color="fg.muted">
              Findings, ranked by impact
            </Text>
            <Stack gap="3">
              {issues.map((finding) => (
                <Box
                  key={finding.title}
                  colorPalette={SEVERITY_PALETTE[finding.severity as 'error' | 'warning']}
                  borderStartWidth="4px"
                  borderColor="colorPalette.solid"
                  roundedEnd="l2"
                  bg="colorPalette.subtle"
                  p="3"
                >
                  <Text fontWeight="medium">{finding.title}</Text>
                  {finding.description && (
                    <Text mt="0.5" textStyle="body-sm" color="fg.muted">
                      {finding.description}
                    </Text>
                  )}
                  {finding.action && (
                    <SectionAction
                      type="button"
                      mt="1"
                      onClick={() => (finding.action?.tab ? onNavigateTab(finding.action.tab) : unavailable(finding.action?.label ?? ''))}
                    >
                      {finding.action.label}
                    </SectionAction>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {passed.length > 0 && (
          <Stack gap="2">
            {passed.map((finding) => (
              <Flex key={finding.title} align="center" gap="2" textStyle="body-sm">
                <Box flexShrink={0} color="fg.success">
                  <CheckCircle2 size={16} aria-label="Passed" />
                </Box>
                <span>{finding.title}</span>
              </Flex>
            ))}
          </Stack>
        )}

        <Flex
          wrap="wrap"
          align="center"
          justify="space-between"
          gap="2"
          borderTopWidth="1px"
          borderColor="border"
          pt="4"
          textStyle="body-sm"
        >
          <Text as="span" color="fg.muted">
            Last checked {lastChecked}
          </Text>
          <SectionAction
            gap="1.5"
            onClick={() =>
              downloadJson(`${dataset.name}-quality.json`, {
                dataset: dataset.id,
                score,
                status: status.label,
                findings,
              })
            }
          >
            <Download />
            Download full report
          </SectionAction>
        </Flex>
      </Stack>
    </SectionCard>
  );
}

function QualityGauge({ score }: { score: number }) {
  return (
    <Box mt="4">
      <Box position="relative" pt="2.5">
        <Box position="absolute" top="0" left={`${score}%`} h="2.5" w="0.5" transform="translateX(-50%)" rounded="full" bg="fg" />
        <Box h="1.5" w="full" rounded="full" bgGradient="to-r" gradientFrom="danger" gradientVia="warning" gradientTo="success" />
      </Box>
      <Flex mt="1.5" justify="space-between" fontSize="xs" color="fg.muted">
        <span>Poor</span>
        <span>Needs attention</span>
        <span>Ready</span>
      </Flex>
    </Box>
  );
}
