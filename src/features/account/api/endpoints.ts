/**
 * Calls for the signed-in user. Mocked. core-api serves `/v1/users/me` under
 * app/modules/user/users with a smaller profile; the rest is new.
 */
import { del, get, patch, post, qs } from '@/api/client'
import type {
  ApiCreatedKey,
  ApiKey,
  ApiNotification,
  ApiNotificationSetting,
  ApiSecurity,
  ApiSession,
  ApiUser,
  CreateApiKeyRequest,
  UpdateNotificationSettingsRequest,
  UpdateUserRequest,
} from './types'

export const accountApi = {
  getUser: () => get<ApiUser>('/v1/users/me'),
  updateUser: (input: UpdateUserRequest) =>
    patch<ApiUser>('/v1/users/me', input),
  removeAvatar: () => del('/v1/users/me/avatar'),
  deleteAccount: () => del('/v1/users/me'),

  getSecurity: () => get<ApiSecurity>('/v1/users/me/security'),
  changePassword: (currentPassword: string, newPassword: string) =>
    post<ApiSecurity>('/v1/users/me/password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
  listSessions: () => get<ApiSession[]>('/v1/users/me/sessions'),
  endSession: (sessionId: string) =>
    del(`/v1/users/me/sessions/${encodeURIComponent(sessionId)}`),

  listNotificationSettings: () =>
    get<ApiNotificationSetting[]>('/v1/users/me/notification-settings'),
  updateNotificationSettings: (input: UpdateNotificationSettingsRequest) =>
    patch<ApiNotificationSetting[]>(
      '/v1/users/me/notification-settings',
      input,
    ),

  listNotifications: () => get<ApiNotification[]>('/v1/notifications'),
  markNotificationsRead: () =>
    post<ApiNotification[]>('/v1/notifications/read'),

  /** With a project id: the keys usable in that project. */
  listApiKeys: (projectId?: string) =>
    get<ApiKey[]>(`/v1/api-keys${qs({ project_id: projectId })}`),
  createApiKey: (input: CreateApiKeyRequest) =>
    post<ApiCreatedKey>('/v1/api-keys', input),
  revokeApiKey: (keyId: string) =>
    del(`/v1/api-keys/${encodeURIComponent(keyId)}`),
}
