import { test, expect } from '@playwright/test';
import { canImport, HF_REPO, HF_REVISION, ImportSource, ImportStatus, isTabular, Split } from '@/modules/datasets/constants';
import { EMPTY_FORM, formErrors, toImportBody, type ImportFormValues } from '@/modules/datasets/import-form';
import { nextPoll, POLL_BASE_MS, POLL_MAX_MS, pollDelay, STATUS_UI } from '@/modules/datasets/status';

const ALL = Object.values(ImportStatus);

test.describe('status to UI', () => {
  test('every status has an entry', () => {
    expect(Object.keys(STATUS_UI).sort()).toEqual([...ALL].sort());
  });

  test('only a moving import is polled', () => {
    const polled = ALL.filter((s) => STATUS_UI[s].poll);
    expect(polled.sort()).toEqual([ImportStatus.Committing, ImportStatus.Queued, ImportStatus.Running].sort());
  });

  test('a terminal status is never polled, cancellable or in review', () => {
    for (const s of ALL.filter((x) => STATUS_UI[x].terminal)) {
      expect(STATUS_UI[s]).toMatchObject({ poll: false, cancel: false, review: false, active: false });
    }
  });

  test('only awaiting_review offers the review actions', () => {
    expect(ALL.filter((s) => STATUS_UI[s].review)).toEqual([ImportStatus.AwaitingReview]);
  });

  test('cancel is offered until the import reaches review', () => {
    expect(ALL.filter((s) => STATUS_UI[s].cancel).sort()).toEqual(
      [ImportStatus.AwaitingUpload, ImportStatus.Queued, ImportStatus.Running].sort(),
    );
  });

  test('the five active statuses match the backend cap', () => {
    expect(ALL.filter((s) => STATUS_UI[s].active)).toHaveLength(5);
  });
});

test.describe('polling schedule', () => {
  test('gives a delay while moving and stops otherwise', () => {
    for (const s of ALL) {
      const next = nextPoll(s, 0);
      if (STATUS_UI[s].poll) expect(next).toBe(POLL_BASE_MS);
      else expect(next).toBe(false);
    }
    expect(nextPoll(undefined, 0)).toBe(false);
  });

  test('backs off and caps', () => {
    const delays = [0, 1, 2, 3, 4, 5, 6, 20].map(pollDelay);
    expect(delays[1]).toBeGreaterThan(delays[0]);
    expect(delays.every((d, i) => i === 0 || d >= delays[i - 1])).toBe(true);
    expect(delays.at(-1)).toBe(POLL_MAX_MS);
  });
});

test.describe('import form', () => {
  const upload = (patch: Partial<ImportFormValues> = {}): ImportFormValues => ({ ...EMPTY_FORM, ...patch });
  const hf = (patch: Partial<ImportFormValues> = {}): ImportFormValues => upload({ source: ImportSource.HuggingFace, ...patch });

  test('a tabular upload needs a file and a target', () => {
    expect(formErrors(upload(), 'tabular-classification', false)).toEqual({ file: 'required', target: 'required' });
    expect(formErrors(upload({ target: ' y ' }), 'tabular-classification', true)).toEqual({});
  });

  test('an image upload needs no target', () => {
    expect(formErrors(upload(), 'image-classification', true)).toEqual({});
  });

  test('a Hugging Face import needs a well-formed repo and revision', () => {
    expect(formErrors(hf(), 'tabular-classification', false)).toEqual({ repo: 'required' });
    expect(formErrors(hf({ repo: 'a/b/c' }), 'tabular-classification', false).repo).toBe('invalid');
    expect(formErrors(hf({ repo: '../x' }), 'tabular-classification', false).repo).toBe('invalid');
    expect(formErrors(hf({ repo: 'user/data', revision: 'refs/pr/1' }), 'tabular-classification', false)).toEqual({});
    expect(formErrors(hf({ repo: 'user/data', revision: '..' }), 'tabular-classification', false).revision).toBe('invalid');
    expect(HF_REPO.test('imdb')).toBe(true);
    expect(HF_REVISION.test('main')).toBe(true);
  });

  test('the request carries only what the source uses', () => {
    expect(toImportBody(upload({ target: ' y ', split: Split.Train, repo: 'ignored' }), 'tabular-classification', 'v1')).toEqual({
      source: 'upload',
      base_version_id: 'v1',
      params: { target: 'y', split: 'train' },
    });
    expect(toImportBody(upload({ target: 'ignored' }), 'image-classification', null).params.target).toBeUndefined();
    expect(toImportBody(hf({ repo: 'user/data', revision: ' ', column: 'label' }), 'tabular-classification', null)).toEqual({
      source: 'huggingface',
      base_version_id: null,
      params: { repo: 'user/data', revision: undefined, column: 'label', split: undefined },
    });
  });

  test('task types decide what can import', () => {
    expect(canImport(null)).toBe(false);
    expect(canImport('text-classification')).toBe(false);
    expect(canImport('tabular-regression')).toBe(true);
    expect(isTabular('object-detection')).toBe(false);
  });
});
