import { createRoute } from '@tanstack/react-router';
import { appRoute, workspaceRoute } from '@/modules/workspaces';
import { InvitePage } from '@/modules/members/pages/InvitePage';
import { MembersPage } from '@/modules/members/pages/MembersPage';
import { textCrumb } from '@/shared/ui/crumbs';

export const inviteRoute = createRoute({ getParentRoute: () => appRoute, path: 'invite/$token', component: InvitePage });
export const membersRoute = createRoute({
  getParentRoute: () => workspaceRoute,
  path: 'members',
  staticData: { crumb: textCrumb('shell.members') },
  component: MembersPage,
});
