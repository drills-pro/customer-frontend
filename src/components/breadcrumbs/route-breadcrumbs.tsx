import * as React from 'react'
import { useMatches } from '@tanstack/react-router'

import { useDashboardLayout } from '@/features/dashboard/context'
import { CollapsibleBreadcrumb } from './collapsible-breadcrumb'
import type { BreadcrumbData, Crumb } from './types'

/**
 * Builds the trail from every matched route's `staticData.breadcrumb`, parent
 * first, so each route only declares its own crumbs.
 */
export function RouteBreadcrumbs({ className }: { className?: string }) {
  const matches = useMatches()
  const { preferences, hydrated } = useDashboardLayout()

  const items = React.useMemo(() => {
    const crumbs: Crumb[] = []
    let data: BreadcrumbData = {}

    for (const match of matches) {
      const resolve = match.staticData.breadcrumb
      if (!resolve) continue

      const result = resolve({
        params: match.params,
        preferences,
        parent: data,
      })
      if (!result) break

      crumbs.push(...(result.items ?? []))
      data = { ...data, ...result.data }
    }

    return crumbs
  }, [matches, preferences])

  if (!hydrated) return null

  return <CollapsibleBreadcrumb items={items} className={className} />
}
