import * as React from 'react'
import { Breadcrumb, IconButton } from '@chakra-ui/react'
import type { BreadcrumbRootProps } from '@chakra-ui/react'
import { Link } from '@tanstack/react-router'
import { Ellipsis } from 'lucide-react'
import { getBreadcrumbWindow } from './breadcrumb-window'
import type { Crumb } from './types'

type CollapsibleBreadcrumbProps = {
  items: Crumb[]
  size?: number
} & Omit<BreadcrumbRootProps, 'children' | 'size'>

export function CollapsibleBreadcrumb({
  items,
  size = 3,
  ...props
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
      <Breadcrumb.Item key="prev">
        <IconButton
          type="button"
          variant="ghost"
          colorPalette="gray"
          size="2xs"
          aria-label="Show previous breadcrumbs"
          onClick={() => setPage(page + 1)}
        >
          <Ellipsis />
        </IconButton>
      </Breadcrumb.Item>,
    )
  }

  items.slice(start, end).forEach((item, offset) => {
    const isCurrent = start + offset === items.length - 1
    nodes.push(
      <Breadcrumb.Item key={item.id}>
        {isCurrent ? (
          <Breadcrumb.CurrentLink>{item.label}</Breadcrumb.CurrentLink>
        ) : item.link ? (
          <Breadcrumb.Link asChild>
            <Link to={item.link.to as never} params={item.link.params as never}>
              {item.label}
            </Link>
          </Breadcrumb.Link>
        ) : (
          item.label
        )}
      </Breadcrumb.Item>,
    )
  })

  if (hasNext) {
    nodes.push(
      <Breadcrumb.Item key="next">
        <IconButton
          type="button"
          variant="ghost"
          colorPalette="gray"
          size="2xs"
          aria-label="Show next breadcrumbs"
          onClick={() => setPage(page - 1)}
        >
          <Ellipsis />
        </IconButton>
      </Breadcrumb.Item>,
    )
  }

  return (
    <Breadcrumb.Root size="sm" {...props}>
      <Breadcrumb.List>
        {nodes.flatMap((node, index) =>
          index > 0
            ? [<Breadcrumb.Separator key={`separator-${index}`} />, node]
            : [node],
        )}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  )
}
