import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/organizations_/$orgId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/organizations/$orgId/overview',
      params,
      replace: true,
    })
  },
})
