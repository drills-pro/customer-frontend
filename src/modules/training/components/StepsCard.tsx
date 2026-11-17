import { Flex, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useRunSteps } from '@/modules/training/api';
import { failureKey } from '@/modules/training/report';
import { errorKey } from '@/shared/api/errors';

const STATE_COLOR = { pending: 'fg.muted', active: 'brand-text', done: 'fg', failed: 'fg.error', cancelled: 'fg.muted' } as const;

/** The run's steps in order, with the epoch it is on and, for a failed run, why. It never shows the job's raw output. */
export function StepsCard({ projectId, runId, status }: { projectId: string; runId: string; status: string }) {
  const { t } = useTranslation();
  const steps = useRunSteps(projectId, runId, status);

  if (steps.isError) {
    return (
      <Text color="fg.error" textStyle="body-sm" role="alert" data-testid="training-steps-error">
        {t(errorKey(steps.error))}
      </Text>
    );
  }
  if (steps.isPending) return <Skeleton h="32" />;

  return (
    <Stack
      as="ol"
      gap="3"
      p="5"
      m="0"
      listStyleType="none"
      borderWidth="1px"
      borderColor="border"
      borderRadius="l3"
      bg="surface-raised"
      data-testid="training-steps"
    >
      {steps.data.steps.map((step) => (
        <Flex as="li" key={step.key} gap="3" align="baseline" wrap="wrap" data-testid={`training-step-${step.key}`} data-state={step.state}>
          <Text fontWeight="medium" minW="8rem">
            {t(`training.run.steps.${step.key}`)}
          </Text>
          <Text color={STATE_COLOR[step.state]} textStyle="body-sm" data-testid={`training-step-state-${step.key}`}>
            {t(`training.run.steps.state.${step.state}`)}
          </Text>
          {step.key === 'training' &&
            step.epoch !== null &&
            step.epoch !== undefined &&
            step.epochs !== null &&
            step.epochs !== undefined && (
              <Text color="fg.muted" textStyle="body-sm">
                {t('training.run.progress', { epoch: step.epoch, epochs: step.epochs })}
              </Text>
            )}
          {step.failure && (
            <Text color="fg.error" textStyle="body-sm" data-testid="training-step-failure">
              {t(failureKey(step.failure))}
            </Text>
          )}
        </Flex>
      ))}
    </Stack>
  );
}
