import { Box, Center, Flex, SimpleGrid, Text } from '@chakra-ui/react';
import { Bell, Database, GitBranch, Plug, Webhook } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toaster } from '@/components/toaster';

import { SectionCard } from '@/components/shared/section-card';
import { SECTION_OFFSET } from '@/components/shared/settings-nav';
import { SwitchButton } from '@/components/shared/switch-button';
import { useProjectDetail } from '@/features/dashboard/context';
import { useProjectIntegrations, useSetProjectIntegration } from '@/features/projects/queries';

/** How each integration the API knows is drawn; an unknown one gets a default. */
const appearance: Record<string, { icon: LucideIcon; palette: string }> = {
  github: { icon: GitBranch, palette: 'night' },
  slack: { icon: Bell, palette: 'brand' },
  webhook: { icon: Webhook, palette: 'info' },
  s3: { icon: Database, palette: 'warning' },
};
const fallbackAppearance = { icon: Plug, palette: 'gray' };

export function IntegrationsCard() {
  const { project } = useProjectDetail();
  const integrations = (useProjectIntegrations(project.id).data ?? []).map((item) => ({
    ...item,
    ...(appearance[item.id] ?? fallbackAppearance),
  }));
  const setIntegration = useSetProjectIntegration(project.id);

  function toggle(item: (typeof integrations)[number], on: boolean) {
    setIntegration.mutate(
      { id: item.id, enabled: on },
      {
        onSuccess: () =>
          toaster.create({
            type: 'success',
            title: `${item.name} ${on ? 'connected' : 'disconnected'}.`,
          }),
      },
    );
  }

  return (
    <SectionCard
      id="integrations"
      scrollMarginTop={`${SECTION_OFFSET}px`}
      title="Integrations"
      description="Connect the tools your team already uses."
    >
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap="1px" bg="border">
        {integrations.map((item) => {
          const on = item.enabled;
          return (
            <Flex key={item.id} align="flex-start" gap="3" bg="surface-raised" p="5">
              <Center
                aria-hidden="true"
                boxSize="9"
                flexShrink={0}
                rounded="l2"
                colorPalette={item.palette}
                bg="colorPalette.subtle"
                color="colorPalette.fg"
              >
                <item.icon size={16} />
              </Center>
              <Box flex="1" minW="0">
                <Text fontSize="13px" fontWeight="medium">
                  <label htmlFor={`integration-${item.id}`}>{item.name}</label>
                </Text>
                <Text mt="0.5" fontSize="xs" color="fg.muted">
                  {item.description}
                </Text>
                <Text mt="2" fontSize="xs" fontWeight="medium" color={on ? 'fg.success' : 'fg.muted'}>
                  {on ? 'Connected' : 'Not connected'}
                </Text>
              </Box>
              <SwitchButton id={`integration-${item.id}`} checked={on} onCheckedChange={(checked) => toggle(item, checked)} />
            </Flex>
          );
        })}
      </SimpleGrid>
    </SectionCard>
  );
}
