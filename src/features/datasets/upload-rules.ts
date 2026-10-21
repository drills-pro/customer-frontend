/** Which files the dashboard's upload dialog can send, and to which projects. */

export type UploadKind = 'zip' | 'csv';

/**
 * Mirrors `_SHAPE_GATE` in core-api/app/modules/user/datasets/routes.py.
 * Checked in the browser first so a file the server would reject does not
 * leave an empty dataset behind.
 */
const uploadByTask: Record<string, UploadKind[]> = {
  image_classification: ['zip'],
  tabular_classification: ['csv'],
  legacy_untyped: ['zip', 'csv'],
};

export function acceptedUploads(taskType: string) {
  return uploadByTask[taskType] ?? [];
}

export function uploadKind(file: File): UploadKind | undefined {
  if (/\.zip$/i.test(file.name)) return 'zip';
  if (/\.csv$/i.test(file.name)) return 'csv';
  return undefined;
}
