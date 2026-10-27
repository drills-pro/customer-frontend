/**
 * Query keys that more than one module reads. A module owns its own keys; one lands here only when a module that cannot import the owner
 * needs to sit under it, so the owner's invalidations reach both.
 */

/** Every dataset query hangs off the project, so one invalidation covers a project's datasets. */
export const projectDatasetsKey = (projectId: string) => ['project', projectId, 'datasets'] as const;
/** The dataset list. The projects overview keeps its dataset count under it, so creating, deleting or restoring one refreshes the count. */
export const datasetListKey = (projectId: string) => [...projectDatasetsKey(projectId), 'list'] as const;
