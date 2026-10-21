export type View = 'grid' | 'list';

export type ProjectFiltersState = {
  query: string;
  task: string;
  status: string;
  sort: string;
  view: View;
};
