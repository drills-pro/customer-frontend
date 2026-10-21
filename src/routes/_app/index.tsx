import * as React from 'react';
import { Box, Button, Center, Flex, Grid, Heading, HStack, Icon, Progress, Stack, Text } from '@chakra-ui/react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Check, Plus, Upload } from 'lucide-react';

import { SectionAction, SectionCard } from '@/components/shared/section-card';
import { useDashboardSummary } from '@/features/dashboard/queries';
import { useDashboardLayout } from '@/features/dashboard/context';
import { getSession } from '@/api/session';
import {
  RecentActivityCard,
  UploadDialog,
  YourProjectsCard,
  LiveTrainingsCard,
  DeploymentHealthCard,
  WorkspaceMetrics,
} from './-components/dashboard';

export const Route = createFileRoute('/_app/')({ component: DashboardPage });

function DashboardPage() {
  const { preferences, updatePreferences } = useDashboardLayout();
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const { data } = useDashboardSummary();
  const projects = data?.projects ?? [];
  const totals = data?.metrics;

  const onboarding = [
    { label: 'Create a project', done: projects.length > 0 },
    { label: 'Upload a dataset', done: (totals?.datasets ?? 0) > 0 },
    {
      label: 'Run your first training',
      done: (totals?.training_runs ?? 0) > 0,
    },
    { label: 'Deploy a model', done: (totals?.deployments ?? 0) > 0 },
  ];
  const onboardingDone = onboarding.filter((step) => step.done).length;

  return (
    <>
      <Box as="main" id="dashboard-main" mx="auto" w="full" maxW="1448px" flex="1" p={{ base: '4', sm: '6' }}>
        <Flex direction={{ base: 'column', sm: 'row' }} align={{ sm: 'flex-start' }} justify={{ sm: 'space-between' }} gap="4" mb="6">
          <Box>
            <Heading as="h1" fontSize="2xl" fontWeight="bold" letterSpacing="tight">
              Good morning, {getSession().displayName} <span aria-hidden="true">👋</span>
            </Heading>
            <Text mt="1" color="fg.muted">
              Here is what happened across your workspace.
            </Text>
          </Box>
          <HStack wrap="wrap" gap="2">
            <Button size="sm" variant="outline" px="3.5" onClick={() => setUploadOpen(true)}>
              <Upload />
              Upload Dataset
            </Button>
            <Button asChild size="sm" variant="solid" px="3.5">
              <Link to="/projects/new">
                <Plus />
                New Project
              </Link>
            </Button>
          </HStack>
        </Flex>

        <WorkspaceMetrics />

        <Grid mt="6" alignItems="start" gap="6" templateColumns={{ xl: 'minmax(0, 2fr) minmax(320px, 1fr)' }}>
          <Grid gap="6">
            <RecentActivityCard />
            <YourProjectsCard />
          </Grid>
          <Grid gap="6">
            <LiveTrainingsCard />
            <DeploymentHealthCard />
            {!preferences.onboardingDismissed && (
              <SectionCard
                title="Getting started"
                action={
                  <SectionAction color="fg.muted" onClick={() => updatePreferences({ onboardingDismissed: true })}>
                    Dismiss
                  </SectionAction>
                }
              >
                <Stack gap="3" p="5">
                  {onboarding.map(({ label, done }, index) => (
                    <HStack gap="3" textStyle="body-sm" key={label}>
                      <Center
                        boxSize="5"
                        rounded="full"
                        fontSize="xs"
                        colorPalette={done ? 'success' : 'gray'}
                        bg="colorPalette.subtle"
                        color={done ? 'colorPalette.fg' : 'fg.muted'}
                      >
                        {done ? (
                          <Icon boxSize="3.5" asChild>
                            <Check />
                          </Icon>
                        ) : (
                          index + 1
                        )}
                      </Center>
                      {label}
                    </HStack>
                  ))}
                  <Progress.Root mt="4" size="xs" value={(onboardingDone / onboarding.length) * 100}>
                    <Progress.Track aria-label="Getting started progress">
                      <Progress.Range />
                    </Progress.Track>
                  </Progress.Root>
                </Stack>
              </SectionCard>
            )}
          </Grid>
        </Grid>
      </Box>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} projects={projects} />
    </>
  );
}
