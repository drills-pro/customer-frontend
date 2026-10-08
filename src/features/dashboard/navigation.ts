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

const sectionLinks = {
  Overview: '/projects/$projectId/overview',
  Datasets: '/projects/$projectId/datasets',
  Training: '/projects/$projectId/training',
  Models: '/projects/$projectId/models',
  Deployments: '/projects/$projectId/deployments',
  Settings: '/projects/$projectId/settings',
} as const satisfies Record<ProjectSection, string>

/** Every section has a route. */
export function projectSectionLink<TSection extends ProjectSection>(
  section: TSection,
) {
  return sectionLinks[section]
}
