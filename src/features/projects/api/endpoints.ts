/**
 * Calls for projects, served by core-api (app/modules/user/projects). Moving
 * a project to another organization answers 501 there for now.
 *
 * Projects are copied into the mock as they arrive (`mirrorToMock`), because
 * their datasets, runs, models and deployments are still mocked.
 */
import { del, get, mirrorToMock, patch, post, put, qs } from '@/api/client';
import type { ApiVisibility } from '@/features/organizations/api';
import type {
  ApiIntegration,
  ApiProject,
  ApiProjectDetail,
  ApiProjectMember,
  ApiProjectRole,
  ApiResourceUsage,
  CreateProjectRequest,
  InviteProjectMemberRequest,
  UpdateProjectRequest,
} from './types';

const project = (projectId: string) => `/v1/projects/${encodeURIComponent(projectId)}`;

const member = (projectId: string, userId: string) => `${project(projectId)}/members/${encodeURIComponent(userId)}`;

export const projectsApi = {
  list: (organizationId: string) =>
    get<ApiProject[]>(`/v1/projects${qs({ organization_id: organizationId })}`).then((rows) => mirrorToMock('projects', rows)),
  create: (input: CreateProjectRequest) =>
    post<ApiProjectDetail>('/v1/projects', input).then((row) => mirrorToMock('projects', [row]).then(() => row)),
  get: (projectId: string) => get<ApiProjectDetail>(project(projectId)).then((row) => mirrorToMock('projects', [row]).then(() => row)),
  update: (projectId: string, input: UpdateProjectRequest) => patch<ApiProjectDetail>(project(projectId), input),
  setVisibility: (projectId: string, visibility: ApiVisibility) =>
    patch<ApiProjectDetail>(`${project(projectId)}/visibility`, { visibility }),
  archive: (projectId: string) => post<ApiProjectDetail>(`${project(projectId)}/archive`),
  unarchive: (projectId: string) => post<ApiProjectDetail>(`${project(projectId)}/unarchive`),
  /** Moves the project to another organization the caller belongs to. */
  transfer: (projectId: string, organizationId: string) =>
    post<ApiProjectDetail>(`${project(projectId)}/transfer`, {
      organization_id: organizationId,
    }),
  remove: (projectId: string) => del(project(projectId)),

  getUsage: (projectId: string) => get<ApiResourceUsage[]>(`${project(projectId)}/usage`),

  listMembers: (projectId: string) => get<ApiProjectMember[]>(`${project(projectId)}/members`),
  invite: (projectId: string, input: InviteProjectMemberRequest) => post<ApiProjectMember>(`${project(projectId)}/invitations`, input),
  setMemberRole: (projectId: string, userId: string, role: ApiProjectRole) => put<ApiProjectMember>(member(projectId, userId), { role }),
  removeMember: (projectId: string, userId: string) => del(member(projectId, userId)),

  listIntegrations: (projectId: string) => get<ApiIntegration[]>(`${project(projectId)}/integrations`),
  setIntegration: (projectId: string, integrationId: string, enabled: boolean) =>
    put<ApiIntegration>(`${project(projectId)}/integrations/${encodeURIComponent(integrationId)}`, { enabled }),
};
