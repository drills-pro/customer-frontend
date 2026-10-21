import { Grid } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router';

import { SettingsNav } from '@/components/shared/settings-nav';
import { ApiKeysCard } from '@/features/account/components/api-keys-card';
import { useProjectDetail } from '@/features/dashboard/context';
import { DangerZoneCard, GeneralCard, IntegrationsCard, MembersCard } from '../-components/project-settings';

export const Route = createFileRoute('/_app/projects_/$projectId/_nav/settings')({ component: ProjectSettingsRoute });

const sections = [
  { id: 'general', label: 'General' },
  { id: 'members', label: 'Members' },
  { id: 'api-keys', label: 'API keys' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'danger-zone', label: 'Danger zone' },
] as const;

function ProjectSettingsRoute() {
  const { project } = useProjectDetail();

  return (
    <Grid mt="6" minW="0" gap="6" templateColumns={{ lg: '200px minmax(0, 1fr)' }}>
      <SettingsNav sections={sections} />
      {/* Keyed on the project so switching projects resets every form. */}
      <Grid key={project.id} minW="0" maxW="4xl" gap="6">
        <GeneralCard />
        <MembersCard />
        <ApiKeysCard projectId={project.id} />
        <IntegrationsCard />
        <DangerZoneCard />
      </Grid>
    </Grid>
  );
}
