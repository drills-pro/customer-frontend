/** The signed-in user: profile, security, sessions, notifications, API keys. */
import type {
  ApiCreatedKey,
  ApiNotificationSetting,
  CreateApiKeyRequest,
  UpdateNotificationSettingsRequest,
  UpdateUserRequest,
} from '@/features/account/api/types';
import { notFound, route } from '../router';
import { notificationSettingSeed } from '../seed/account';
import { apiKeys, notificationSettings, notifications, organizations, security, sessions, users } from '../store';
import { bodyOf, conflict, invalid, nowIso, pick, shortId } from './shared';

const me = () => users.get('me') ?? notFound('User');

route('GET', '/v1/users/me', me);

route('PATCH', '/v1/users/me', ({ body }) => {
  const changes = pick(bodyOf<UpdateUserRequest>(body), ['full_name', 'username', 'email', 'job_role', 'bio']);
  if (changes.full_name !== undefined && !changes.full_name.trim()) {
    invalid('Full name is required');
  }
  return users.put({ ...me(), ...changes });
});

route('DELETE', '/v1/users/me/avatar', () => {
  users.put({ ...me(), avatar_url: null });
});

route('DELETE', '/v1/users/me', () => {
  const owned = organizations.all().filter((org) => org.your_role === 'owner');
  if (owned.length > 0) {
    conflict(`Transfer or delete the organizations you own first: ${owned.map((org) => org.name).join(', ')}.`);
  }
  users.remove('me');
});

function securityOf() {
  const { id: _, ...state } = security.get('me') ?? notFound('User');
  return state;
}

route('GET', '/v1/users/me/security', securityOf);

/**
 * In production the identity provider owns passwords; the mock only records
 * that one was changed.
 */
route('POST', '/v1/users/me/password', ({ body }) => {
  const input = bodyOf<{ current_password: string; new_password: string }>(body);
  if (!input.current_password) invalid('Enter your current password.');
  if (input.new_password.length < 8) invalid('Use at least 8 characters.');
  const current = security.get('me') ?? notFound('User');
  security.put({ ...current, password_changed_at: nowIso() });
  return securityOf();
});

route('GET', '/v1/users/me/sessions', () => sessions.all());

route('DELETE', '/v1/users/me/sessions/:sessionId', ({ params }) => {
  const session = sessions.get(params.sessionId) ?? notFound('Session');
  if (session.current) conflict('Sign out instead of ending this session.');
  sessions.remove(session.id);
});

function settingsOf(): ApiNotificationSetting[] {
  const saved = notificationSettings.get('me')?.enabled ?? {};
  return notificationSettingSeed.map((setting) => ({
    ...setting,
    enabled: saved[setting.id] ?? setting.enabled,
  }));
}

route('GET', '/v1/users/me/notification-settings', settingsOf);

route('PATCH', '/v1/users/me/notification-settings', ({ body }) => {
  const changes = bodyOf<UpdateNotificationSettingsRequest>(body);
  const known = new Set(notificationSettingSeed.map((setting) => setting.id));
  const enabled = { ...notificationSettings.get('me')?.enabled };
  for (const [id, value] of Object.entries(changes)) {
    if (known.has(id) && typeof value === 'boolean') enabled[id] = value;
  }
  notificationSettings.put({ id: 'me', enabled });
  return settingsOf();
});

route('GET', '/v1/notifications', () => notifications.all());

route('POST', '/v1/notifications/read', () => {
  for (const item of notifications.all()) {
    if (!item.read) notifications.put({ ...item, read: true });
  }
  return notifications.all();
});

route('GET', '/v1/api-keys', ({ query }) => {
  const projectId = query.get('project_id');
  return apiKeys.all().filter((key) => !projectId || !key.project_id || key.project_id === projectId);
});

route('POST', '/v1/api-keys', ({ body }): ApiCreatedKey => {
  const input = bodyOf<CreateApiKeyRequest>(body);
  const name = input.name.trim();
  if (!name) invalid('Enter a name for this key.');
  if (apiKeys.all().some((key) => key.name === name)) {
    conflict('A key with this name already exists.');
  }
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  const secret = `drl_sk_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
  const created = apiKeys.put({
    id: `key-${shortId()}`,
    name,
    suffix: secret.slice(-4),
    scope: input.scope,
    created_at: nowIso(),
    last_used_at: null,
    project_id: input.project_id ?? null,
  });
  return { ...created, secret };
});

route('DELETE', '/v1/api-keys/:keyId', ({ params }) => {
  if (!apiKeys.get(params.keyId)) notFound('API key');
  apiKeys.remove(params.keyId);
});
