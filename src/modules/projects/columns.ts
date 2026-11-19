import { useState } from 'react';

/** The list view's optional columns; the name and the actions always show. Each id is also its `projects.column.*` key. */
export const PROJECT_COLUMNS = ['task', 'status', 'datasets', 'models', 'deployments', 'created', 'id'] as const;
export type ProjectColumn = (typeof PROJECT_COLUMNS)[number];
/** The columns, and the card's stats, that count a project's live datasets, models and deployments. */
export const COUNT_COLUMNS = ['datasets', 'models', 'deployments'] as const;
export type CountColumn = (typeof COUNT_COLUMNS)[number];

const NONE = '-';
/** Zero and a count the API did not send both read as a dash. */
export const countText = (n: number | undefined) => n || NONE;

// v2: choices saved before the defaults hid Deployments, Created and Project ID do not count.
export const PROJECT_COLUMNS_KEY = 'drills-project-columns-v2';
/** Hidden until a person turns them on from the Columns menu. */
export const DEFAULT_HIDDEN: readonly ProjectColumn[] = ['deployments', 'created', 'id'];

/** The hidden ones are saved, not the shown ones, so a column added later starts out visible. Nothing saved means the defaults. */
function readHidden(): ProjectColumn[] {
  try {
    const raw = localStorage.getItem(PROJECT_COLUMNS_KEY);
    const saved: unknown = raw === null ? DEFAULT_HIDDEN : JSON.parse(raw);
    return Array.isArray(saved) ? PROJECT_COLUMNS.filter((c) => saved.includes(c)) : [...DEFAULT_HIDDEN];
  } catch {
    return [...DEFAULT_HIDDEN];
  }
}

/** Which list columns this browser hides. Only the view changes; no data does. */
export function useProjectColumns() {
  const [hidden, setHidden] = useState(readHidden);
  const save = (next: ProjectColumn[]) => {
    setHidden(next);
    try {
      localStorage.setItem(PROJECT_COLUMNS_KEY, JSON.stringify(next));
    } catch {
      /* private mode: the choice lasts for this page only */
    }
  };
  return {
    hidden,
    isDefault: hidden.length === DEFAULT_HIDDEN.length && DEFAULT_HIDDEN.every((c) => hidden.includes(c)),
    toggle: (column: ProjectColumn) => save(hidden.includes(column) ? hidden.filter((c) => c !== column) : [...hidden, column]),
    reset: () => save([...DEFAULT_HIDDEN]),
  };
}
