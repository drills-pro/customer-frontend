/** React Query hooks for the signed-in user. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { accountApi } from './api';
import type { CreateApiKeyRequest, UpdateNotificationSettingsRequest, UpdateUserRequest } from './api';
import { toCurrentUser } from './mappers';

export const accountKeys = {
  user: ['account', 'user'] as const,
  security: ['account', 'security'] as const,
  sessions: ['account', 'sessions'] as const,
  notificationSettings: ['account', 'notification-settings'] as const,
  notifications: ['notifications'] as const,
  apiKeys: (projectId?: string) => ['api-keys', projectId ?? 'all'] as const,
  allApiKeys: ['api-keys'] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: accountKeys.user,
    queryFn: accountApi.getUser,
    select: toCurrentUser,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserRequest) => accountApi.updateUser(input),
    onSuccess: (user) => queryClient.setQueryData(accountKeys.user, user),
  });
}

export function useDeleteAccount() {
  return useMutation({ mutationFn: accountApi.deleteAccount });
}

export function useSecurity() {
  return useQuery({
    queryKey: accountKeys.security,
    queryFn: accountApi.getSecurity,
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) => accountApi.changePassword(current, next),
    onSuccess: (state) => queryClient.setQueryData(accountKeys.security, state),
  });
}

export function useSessions() {
  return useQuery({
    queryKey: accountKeys.sessions,
    queryFn: accountApi.listSessions,
  });
}

export function useEndSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => accountApi.endSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.sessions }),
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: accountKeys.notificationSettings,
    queryFn: accountApi.listNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateNotificationSettingsRequest) => accountApi.updateNotificationSettings(input),
    onSuccess: (settings) => queryClient.setQueryData(accountKeys.notificationSettings, settings),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: accountKeys.notifications,
    queryFn: accountApi.listNotifications,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: accountApi.markNotificationsRead,
    onSuccess: (items) => queryClient.setQueryData(accountKeys.notifications, items),
  });
}

/** With a project id: the keys usable in that project. */
export function useApiKeys(projectId?: string) {
  return useQuery({
    queryKey: accountKeys.apiKeys(projectId),
    queryFn: () => accountApi.listApiKeys(projectId),
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineConflict: true },
    mutationFn: (input: CreateApiKeyRequest) => accountApi.createApiKey(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.allApiKeys }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => accountApi.revokeApiKey(keyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.allApiKeys }),
  });
}
