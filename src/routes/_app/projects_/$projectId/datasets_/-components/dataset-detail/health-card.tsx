import { Box, Button, Flex, Stack } from '@chakra-ui/react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

import { SectionCard } from '@/components/shared/section-card';
import { useCurrentDataset } from './use-current-dataset';

export function HealthCard({ onReview }: { onReview: () => void }) {
  const checks = useCurrentDataset().detail.healthChecks;
  return (
    <SectionCard title="Health check" divided={false}>
      <Stack gap="3" px="5" pb="5">
        <Stack as="ul" gap="3">
          {checks.map((check) => (
            <Flex as="li" key={check.label} align="flex-start" gap="2" textStyle="body-sm">
              <Box mt="0.5" flexShrink={0} color={check.status === 'pass' ? 'fg.success' : 'fg.warning'}>
                {check.status === 'pass' ? (
                  <CheckCircle2 size={16} aria-label="Passed" />
                ) : (
                  <AlertTriangle size={16} aria-label="Warning" />
                )}
              </Box>
              <span>{check.label}</span>
            </Flex>
          ))}
        </Stack>
        <Button variant="outline" size="sm" mt="1" w="full" onClick={onReview}>
          Review issues
        </Button>
      </Stack>
    </SectionCard>
  );
}
