/** The dataset page's tabs; the active one lives in the URL (`?tab=`). */
export const DATASET_TABS = { versions: 'versions', imports: 'imports' } as const;
export type DatasetTab = (typeof DATASET_TABS)[keyof typeof DATASET_TABS];
