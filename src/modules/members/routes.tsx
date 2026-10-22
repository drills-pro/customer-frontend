import { createRoute } from '@tanstack/react-router';
import { appRoute, workspaceRoute } from '@/modules/workspaces';
import { InvitePage } from '@/modules/members/pages/InvitePage';
import { MembersPage } from '@/modules/members/pages/MembersPage';

export const inviteRoute = createRoute({ getParentRoute: () => appRoute, path: 'invite/$token', component: InvitePage });
export const membersRoute = createRoute({ getParentRoute: () => workspaceRoute, path: 'members', component: MembersPage });
