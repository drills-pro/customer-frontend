/**
 * Calls for deployments. Mocked. core-api has list, get, create and test under
 * app/modules/user/deployments, without traffic numbers or scaling settings.
 */
import { del, get, patch, post, qs } from '@/api/client';
import type {
  ApiDeployment,
  ApiDeploymentKey,
  ApiDeploymentMetrics,
  ApiRequestLog,
  ApiRotatedKey,
  ApiTestCall,
  CreateDeploymentRequest,
  UpdateDeploymentRequest,
} from './types';

const deployments = (projectId: string) => `/v1/projects/${encodeURIComponent(projectId)}/deployments`;

const deployment = (projectId: string, deploymentId: string) => `${deployments(projectId)}/${encodeURIComponent(deploymentId)}`;

export const deploymentsApi = {
  list: (projectId: string) => get<ApiDeployment[]>(deployments(projectId)),
  create: (projectId: string, input: CreateDeploymentRequest) => post<ApiDeployment>(deployments(projectId), input),
  get: (projectId: string, deploymentId: string) => get<ApiDeployment>(deployment(projectId, deploymentId)),
  update: (projectId: string, deploymentId: string, input: UpdateDeploymentRequest) =>
    patch<ApiDeployment>(deployment(projectId, deploymentId), input),
  remove: (projectId: string, deploymentId: string) => del(deployment(projectId, deploymentId)),
  pause: (projectId: string, deploymentId: string) => post<ApiDeployment>(`${deployment(projectId, deploymentId)}/pause`),
  resume: (projectId: string, deploymentId: string) => post<ApiDeployment>(`${deployment(projectId, deploymentId)}/resume`),
  redeploy: (projectId: string, deploymentId: string) => post<ApiDeployment>(`${deployment(projectId, deploymentId)}/redeploy`),
  getMetrics: (projectId: string, deploymentId: string) => get<ApiDeploymentMetrics>(`${deployment(projectId, deploymentId)}/metrics`),
  getLogs: (projectId: string, deploymentId: string, status?: number) =>
    get<ApiRequestLog[]>(`${deployment(projectId, deploymentId)}/logs${qs({ status })}`),
  getKey: (projectId: string, deploymentId: string) => get<ApiDeploymentKey>(`${deployment(projectId, deploymentId)}/api-key`),
  rotateKey: (projectId: string, deploymentId: string) => post<ApiRotatedKey>(`${deployment(projectId, deploymentId)}/api-key/rotate`),
  test: (projectId: string, deploymentId: string) => post<ApiTestCall>(`${deployment(projectId, deploymentId)}/test`),
};
