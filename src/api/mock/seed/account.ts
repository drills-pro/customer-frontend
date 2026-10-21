import type { ApiKey, ApiNotification, ApiNotificationSetting, ApiSecurity, ApiSession, ApiUser } from '@/features/account/api/types';
import type { ApiBilling, ApiInvoice } from '@/features/organizations/api/types';
import { daysAgo, hoursAgo, minutesAgo, onDate, weeksAgo } from './units';

export const userSeed: ApiUser = {
  id: 'me',
  full_name: 'Alex Rivera',
  username: 'alexrivera',
  email: 'alex@acme.ai',
  job_role: 'ML Engineer',
  bio: 'Building retail vision models.',
  color: '#8b5cf6',
  avatar_url: null,
};

export const securitySeed: ApiSecurity = {
  password_changed_at: weeksAgo(18),
  two_factor_enabled: false,
  sso: [{ provider: 'Google', connected: true }],
};

export const sessionSeed = (): ApiSession[] => [
  {
    id: 'session-mac',
    device: 'Chrome on macOS',
    location: 'Bangkok, TH',
    kind: 'desktop',
    last_active_at: minutesAgo(0),
    current: true,
  },
  {
    id: 'session-iphone',
    device: 'Safari on iPhone',
    location: 'Bangkok, TH',
    kind: 'mobile',
    last_active_at: hoursAgo(2),
    current: false,
  },
];

export const notificationSettingSeed: ApiNotificationSetting[] = [
  {
    id: 'training-completed',
    title: 'Training run completed',
    description: 'When a run finishes or fails.',
    enabled: true,
  },
  {
    id: 'deployment-status',
    title: 'Deployment status changes',
    description: 'When a live endpoint goes up or down.',
    enabled: true,
  },
  {
    id: 'weekly-usage',
    title: 'Weekly usage summary',
    description: 'Credits and GPU hours, every Monday.',
    enabled: false,
  },
  {
    id: 'product-updates',
    title: 'Product updates',
    description: 'New features and changes to DRILLS.',
    enabled: true,
  },
];

export const notificationSeed = (): ApiNotification[] => [
  {
    id: 'notification-resnet50-v3',
    title: 'Training complete',
    body: 'resnet50-v3 reached 94.2% accuracy.',
    created_at: minutesAgo(12),
    read: false,
  },
];

export const apiKeySeed: ApiKey[] = [
  {
    id: 'key-prod',
    name: 'prod-inference',
    suffix: '3f9c',
    scope: 'inference:read',
    created_at: onDate('2026-08-02'),
    last_used_at: minutesAgo(2),
    project_id: null,
  },
  {
    id: 'key-ci',
    name: 'ci-pipeline',
    suffix: 'a71b',
    scope: 'train:write',
    created_at: onDate('2026-06-18'),
    last_used_at: daysAgo(3),
    project_id: null,
  },
];

/** The same card and invoices for every organization on a paid plan. */
export const billingSeed: Pick<ApiBilling, 'plan_name' | 'credits_total' | 'renews_at' | 'payment_method'> = {
  plan_name: 'Team plan',
  credits_total: 2000,
  renews_at: onDate('2026-10-12'),
  payment_method: { brand: 'Visa', last4: '4417', expires: '08/28' },
};

export const invoiceSeed: ApiInvoice[] = [
  { id: 'inv-2026-09', period_start: onDate('2026-09-01'), amount_usd: 249 },
  { id: 'inv-2026-08', period_start: onDate('2026-08-01'), amount_usd: 249 },
  { id: 'inv-2026-07', period_start: onDate('2026-07-01'), amount_usd: 249 },
];
