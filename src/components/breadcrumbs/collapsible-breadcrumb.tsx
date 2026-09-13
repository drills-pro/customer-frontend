import * as React from 'react'
import { Link } from '@tanstack/react-router'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { getBreadcrumbWindow } from './breadcrumb-window'
import type { Crumb } from './types'

type CollapsibleBreadcrumbProps = {
  items: Crumb[]
  size?: number
  className?: string
}

export function CollapsibleBreadcrumb({
  items,
  size = 3,
  className,
}: CollapsibleBreadcrumbProps) {
  const itemsKey = items.map((item) => item.id).join('/')
  const [state, setState] = React.useState({ key: itemsKey, page: 0 })

  // A different trail (navigation) snaps back to the newest window.
  let page = state.page
  if (state.key !== itemsKey) {
    page = 0
    setState({ key: itemsKey, page })
  }

  const { start, end, hasPrev, hasNext } = getBreadcrumbWindow(
    items.length,
    page,
    size,
  )
  const setPage = (next: number) => setState({ key: itemsKey, page: next })

  const nodes: React.ReactNode[] = []

  if (hasPrev) {
    nodes.push(
      <BreadcrumbItem key="prev">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Show previous breadcrumbs"
          onClick={() => setPage(page + 1)}
        >
          <BreadcrumbEllipsis />
        </Button>
      </BreadcrumbItem>,
    )
  }

  items.slice(start, end).forEach((item, offset) => {
    const isCurrent = start + offset === items.length - 1
    nodes.push(
      <BreadcrumbItem key={item.id}>
        {isCurrent ? (
          <BreadcrumbPage>{item.label}</BreadcrumbPage>
        ) : item.link ? (
          <BreadcrumbLink asChild>
            <Link to={item.link.to as never} params={item.link.params as never}>
              {item.label}
            </Link>
          </BreadcrumbLink>
        ) : (
          item.label
        )}
      </BreadcrumbItem>,
    )
  })

  if (hasNext) {
    nodes.push(
      <BreadcrumbItem key="next">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Show next breadcrumbs"
          onClick={() => setPage(page - 1)}
        >
          <BreadcrumbEllipsis />
        </Button>
      </BreadcrumbItem>,
    )
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {nodes.flatMap((node, index) =>
          index > 0
            ? [<BreadcrumbSeparator key={`separator-${index}`} />, node]
            : [node],
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
