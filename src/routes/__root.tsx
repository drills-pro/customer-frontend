import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { DemoProvider } from '../features/drills/store'
import { Shell } from '../features/drills/Shell'
import { Empty, Missing } from '../features/drills/components/display'
import { Button } from '../features/drills/components/forms'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'DRILLS — No-Code ML Platform' },
      {
        name: 'description',
        content:
          'Your workspace for building, training, and deploying machine learning models.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  component: () => (
    <DemoProvider>
      <Shell />
    </DemoProvider>
  ),
  notFoundComponent: Missing,
  errorComponent: ({ error, reset }) => (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Empty title="Something went wrong" description={error.message}>
        <Button onClick={reset}>Try again</Button>
      </Empty>
    </main>
  ),
  shellComponent: RootDocument,
})
function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="light">
      <head>
        <HeadContent />
      </head>
      <body>
        {children || <Outlet />}
        <Scripts />
      </body>
    </html>
  )
}
