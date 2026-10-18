import type {
  Dataset,
  Deployment,
  Model,
  Organization,
  Project,
  TrainingRun,
} from '@/features/dashboard/domain/types'

export type Crumb = {
  id: string
  label: string
  // Kept untyped on purpose: route files declare resolvers in `staticData`,
  // and the router's typed LinkOptions would reference those routes circularly.
  link?: { to: string; params?: Record<string, string> }
}

/** Data resolved by ancestor routes, handed down to child resolvers. */
export type BreadcrumbData = {
  organization?: Organization
  project?: Project
  dataset?: Dataset
  run?: TrainingRun
  model?: Model
  deployment?: Deployment
}

export type BreadcrumbResolverContext = {
  params: Record<string, string>
  /** Every organization the user belongs to. */
  organizations: Organization[]
  /**
   * The records the route params point at. One is absent until its request
   * has answered, and stays absent when the record does not exist.
   */
  entities: Omit<BreadcrumbData, 'organization'>
  parent: BreadcrumbData
}

/**
 * Returns the crumbs a route contributes on top of its parents, plus any data
 * its children need. Returning `null` stops the chain (e.g. entity not found).
 */
export type BreadcrumbResolver = (
  context: BreadcrumbResolverContext,
) => { items?: Crumb[]; data?: Partial<BreadcrumbData> } | null

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    breadcrumb?: BreadcrumbResolver
  }
}
