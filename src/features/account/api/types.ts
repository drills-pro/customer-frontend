/**
 * Request and response shapes for the signed-in user, as the API sends them:
 * snake_case fields, lower-case enums and ISO timestamp strings.
 */

export type ApiUser = {
  id: string;
  full_name: string;
  username: string;
  email: string;
  /** Job title shown on the profile, e.g. `ML Engineer`. */
  job_role: string;
  bio: string;
  /** Avatar background when there is no photo. */
  color: string;
  avatar_url: string | null;
};

/** `PATCH /v1/users/me`. */
export type UpdateUserRequest = Partial<Pick<ApiUser, 'full_name' | 'username' | 'email' | 'job_role' | 'bio'>>;

/** `GET /v1/users/me/security`. */
export type ApiSecurity = {
  password_changed_at: string;
  two_factor_enabled: boolean;
  sso: Array<{ provider: string; connected: boolean }>;
};

export type ApiSession = {
  id: string;
  device: string;
  location: string;
  kind: 'desktop' | 'mobile';
  last_active_at: string;
  /** The session making this request. */
  current: boolean;
};

export type ApiNotificationSetting = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

/** `PATCH /v1/users/me/notification-settings`: setting id to its new state. */
export type UpdateNotificationSettingsRequest = Record<string, boolean>;

export type ApiNotification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read: boolean;
};

export type ApiKeyScope = 'inference:read' | 'train:write' | 'datasets:write' | 'admin';

export type ApiKey = {
  id: string;
  name: string;
  /** The last characters of the secret, to tell keys apart. */
  suffix: string;
  scope: ApiKeyScope;
  created_at: string;
  last_used_at: string | null;
  /** Set when the key is limited to one project. */
  project_id: string | null;
};

/** `POST /v1/api-keys`. */
export type CreateApiKeyRequest = {
  name: string;
  scope: ApiKeyScope;
  project_id?: string;
};

/** The answer to creating a key: the only time `secret` is readable. */
export type ApiCreatedKey = ApiKey & { secret: string };
