import { Avatar, Badge, Box, Card, EmptyState, HStack, Skeleton, Stack, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useProjectMembers, type ProjectDetail } from '@/modules/projects/api';
import { PROJECT_ROLES } from '@/modules/projects/constants';
import { membersQuery } from '@/modules/members';
import { useCan, useMe, useWorkspace } from '@/modules/workspaces';

/** Shown in place of a name we cannot read: the start of the member's id. */
const SHORT_ID_LENGTH = 8;

/**
 * The people added to the project and their roles. Names come from the workspace's member list, which only admins may read;
 * everyone else sees their own name and a short id for the rest.
 */
export function TeamCard({ project }: { project: ProjectDetail }) {
  const { t } = useTranslation();
  const workspace = useWorkspace();
  const me = useMe();
  const isAdmin = useCan('tenant.admin');
  const { data: members, isPending, isError } = useProjectMembers(workspace.id, project.id);
  const { data: people } = useQuery({ ...membersQuery(workspace.id), enabled: isAdmin });

  const nameOf = (sub: string) => {
    if (sub === me.sub) return me.name ?? me.email ?? t('projects.overview.team.you');
    const person = people?.find((p) => p.user_sub === sub);
    return person?.display_name ?? person?.email ?? sub.slice(0, SHORT_ID_LENGTH);
  };

  return (
    <Card.Root variant="outline" data-testid="project-team">
      <Card.Header>
        <Card.Title as="h2" textStyle="body" fontWeight="semibold">
          {t('projects.overview.team.title')}
        </Card.Title>
      </Card.Header>
      <Card.Body gap="4">
        {isError ? (
          <Text color="fg.muted" data-testid="project-team-error">
            {t('projects.overview.team.loadFailed')}
          </Text>
        ) : isPending ? (
          <Skeleton h="16" />
        ) : !members.length ? (
          <EmptyState.Root size="sm">
            <EmptyState.Content>
              <EmptyState.Indicator>
                <Users />
              </EmptyState.Indicator>
              <EmptyState.Title>{t('projects.overview.team.empty')}</EmptyState.Title>
            </EmptyState.Content>
          </EmptyState.Root>
        ) : (
          <Stack as="ul" gap="4">
            {members.map((member) => {
              const name = nameOf(member.user_sub);
              const roles = PROJECT_ROLES.filter((role) => member.roles.includes(role));
              return (
                <HStack as="li" key={member.user_sub} gap="3" data-testid="project-team-member">
                  <Avatar.Root size="sm">
                    <Avatar.Fallback name={name} />
                  </Avatar.Root>
                  <Box minW="0" flex="1">
                    <HStack gap="2">
                      <Text textStyle="body-sm" fontWeight="medium" truncate>
                        {name}
                      </Text>
                      {member.user_sub === me.sub && (
                        <Badge variant="outline" flexShrink={0}>
                          {t('projects.overview.team.you')}
                        </Badge>
                      )}
                    </HStack>
                    <HStack mt="1" gap="1" wrap="wrap">
                      {roles.map((role) => (
                        <Badge key={role} colorPalette="gray" variant="subtle">
                          {t(`projects.role.${role}`)}
                        </Badge>
                      ))}
                    </HStack>
                  </Box>
                </HStack>
              );
            })}
          </Stack>
        )}
        <Text textStyle="body-sm" color="fg.muted">
          {t(`newProject.visibilityHelp.${project.visibility}`, { workspace: workspace.name })}
        </Text>
      </Card.Body>
    </Card.Root>
  );
}
