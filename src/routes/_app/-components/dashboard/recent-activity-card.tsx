import * as React from 'react';
import { Box, Center, Flex, Icon, Stack, Text } from '@chakra-ui/react';
import { Check, CircleUserRound, Database, History, Rocket, X } from 'lucide-react';

import { EmptyNotice } from '@/components/shared/empty-notice';
import { SectionAction, SectionCard } from '@/components/shared/section-card';

import { toActivity } from '@/features/dashboard/format';
import { useDashboardSummary } from '@/features/dashboard/queries';
import type { Activity } from '@/features/dashboard/data';
import { unavailable } from '@/lib/unavailable';
import { CardError, CardLoading } from './card-states';

const activityPalettes: Record<Activity['icon'], string> = {
  success: 'success',
  dataset: 'warning',
  deployment: 'info',
  error: 'danger',
  person: 'brand',
};

const activityIcons: Record<Activity['icon'], typeof Check> = {
  success: Check,
  dataset: Database,
  deployment: Rocket,
  error: X,
  person: CircleUserRound,
};

export function RecentActivityCard() {
  const { data, error, isPending, refetch } = useDashboardSummary();
  const orgActivity = (data?.activity ?? []).map((item) => toActivity(item));
  const [allActivity, setAllActivity] = React.useState(false);

  return (
    <SectionCard
      title="Recent activity"
      action={<SectionAction onClick={() => setAllActivity((value) => !value)}>{allActivity ? 'Show less' : 'View all'}</SectionAction>}
    >
      {isPending ? (
        <CardLoading rows={5} />
      ) : error ? (
        <CardError title="Could not load activity" error={error} onRetry={() => void refetch()} />
      ) : orgActivity.length ? (
        <Stack role="list" gap="0">
          {orgActivity.slice(0, allActivity ? 20 : 5).map((item) => {
            const ActivityIcon = activityIcons[item.icon];
            return (
              <Flex
                key={item.id}
                role="listitem"
                align="center"
                gap="3"
                minH="60px"
                px={{ base: '4', sm: '5' }}
                py="3.5"
                borderBottomWidth="1px"
                borderColor="border"
                _last={{ borderBottomWidth: '0' }}
              >
                <Center
                  boxSize="8"
                  flexShrink={0}
                  rounded="full"
                  colorPalette={activityPalettes[item.icon]}
                  bg="colorPalette.subtle"
                  color="colorPalette.fg"
                >
                  <Icon boxSize="4" asChild>
                    <ActivityIcon />
                  </Icon>
                </Center>
                <Box flex="1" minW="0">
                  <Text>
                    <Text as="strong" fontWeight="semibold">
                      {item.lead}
                    </Text>{' '}
                    <span>{item.text}</span>
                  </Text>
                </Box>
                <Text as="span" display={{ base: 'none', sm: 'block' }} flexShrink={0} fontSize="xs" color="fg.muted">
                  {item.time}
                </Text>
                <SectionAction flexShrink={0} onClick={() => unavailable(item.action)}>
                  {item.action}
                </SectionAction>
              </Flex>
            );
          })}
        </Stack>
      ) : (
        <EmptyNotice icon={<History />} title="No activity yet" description="Workspace activity will appear here." minH="36" />
      )}
    </SectionCard>
  );
}
