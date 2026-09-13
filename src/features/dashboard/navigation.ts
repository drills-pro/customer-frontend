/** The project sections, shared by the sidebar submenu and the section tabs. */
export const projectSections = [
  'Overview',
  'Datasets',
  'Training',
  'Models',
  'Deployments',
  'Settings',
] as const

export type ProjectSection = (typeof projectSections)[number]

/** Sections that have a route today; the rest are demo placeholders. */
export function projectSectionLink(section: ProjectSection) {
  if (section === 'Overview') return '/projects/$projectId/overview' as const
  if (section === 'Datasets') return '/projects/$projectId/datasets' as const
  return undefined
}
