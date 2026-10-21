export { DeploymentHeader } from './deployment-header';
export { DeploymentNotFound } from './deployment-not-found';
export { IntegrationTab } from './integration-tab';
export { LogsTab } from './logs-tab';
export { MonitoringTab } from './monitoring-tab';
export { SettingsTab } from './settings-tab';

export const tabs = ['monitoring', 'integration', 'logs', 'settings'] as const;
export type DeploymentTab = (typeof tabs)[number];
