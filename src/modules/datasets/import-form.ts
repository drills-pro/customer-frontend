import type { Schemas } from '@/shared/api/client';
import { HF_REPO, HF_REVISION, ImportSource, isTabular, PARAM_MAX_LENGTH, type Split } from '@/modules/datasets/constants';

type TaskType = Schemas['TaskType'];

export interface ImportFormValues {
  source: ImportSource;
  /** CSV upload: the target column. */
  target: string;
  /** '' tags nothing. */
  split: Split | '';
  repo: string;
  revision: string;
  column: string;
}

export const EMPTY_FORM: ImportFormValues = { source: ImportSource.Upload, target: '', split: '', repo: '', revision: '', column: '' };

export type FormField = 'file' | 'target' | 'repo' | 'revision' | 'column';
export type FormErrors = Partial<Record<FormField, 'required' | 'invalid'>>;

const tooLong = (value: string) => value.length > PARAM_MAX_LENGTH;

/** What the API would refuse, found before the request. Only the fields the chosen source shows are checked. */
export function formErrors(v: ImportFormValues, task: TaskType, hasFile: boolean): FormErrors {
  const errors: FormErrors = {};
  if (v.source === ImportSource.Upload) {
    if (!hasFile) errors.file = 'required';
    if (isTabular(task)) {
      const target = v.target.trim();
      if (!target) errors.target = 'required';
      else if (tooLong(target)) errors.target = 'invalid';
    }
    return errors;
  }
  const repo = v.repo.trim();
  if (!repo) errors.repo = 'required';
  else if (!HF_REPO.test(repo) || tooLong(repo)) errors.repo = 'invalid';
  const revision = v.revision.trim();
  if (revision && (!HF_REVISION.test(revision) || tooLong(revision))) errors.revision = 'invalid';
  if (tooLong(v.column.trim())) errors.column = 'invalid';
  return errors;
}

/** The create request: only the params the source uses, empty ones left out. */
export function toImportBody(v: ImportFormValues, task: TaskType, baseVersionId: string | null): Schemas['ImportCreate'] {
  const text = (value: string) => value.trim() || undefined;
  const split = v.split || undefined;
  const params: Schemas['ImportParams'] =
    v.source === ImportSource.Upload
      ? { target: isTabular(task) ? text(v.target) : undefined, split }
      : { repo: text(v.repo), revision: text(v.revision), column: text(v.column), split };
  return { source: v.source, base_version_id: baseVersionId, params };
}
