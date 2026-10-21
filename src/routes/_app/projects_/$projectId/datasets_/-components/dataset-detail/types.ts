export const tabs = ['preview', 'statistics', 'quality', 'versions'] as const;
export type DatasetTab = (typeof tabs)[number];
