export { FilesTab } from './files-tab';
export { ModelHeader } from './model-header';
export { ModelNotFound } from './model-not-found';
export { OverviewTab } from './overview-tab';
export { PlaygroundTab } from './playground-tab';
export { VersionsTab } from './versions-tab';
export { versionDeltas } from './helpers';

export const tabs = ['overview', 'playground', 'files', 'versions'] as const;
export type ModelTab = (typeof tabs)[number];
