import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import { ChakraProvider } from '@chakra-ui/react'
import * as React from 'react'
import type { ReactNode } from 'react'
import { Toaster, toaster } from '@/components/toaster'
import { system } from '@/theme'
import '@/fonts'
import { themeBootScript } from '@/features/dashboard/theme'
import { ApiError } from '@/api/client'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'DRILLS — No-Code ML Platform' },
      {
        name: 'description',
        content: 'Monitor projects, training runs, and deployments in DRILLS.',
      },
    ],
    links: [
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    ],
  }),
  component: RootComponent,
})

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** The caller shows the failure itself; no toast. */
      quiet?: boolean
      /** The caller shows a 409 next to the field it is about; no toast. */
      inlineConflict?: boolean
    }
  }
}

function createQueryClient() {
  return new QueryClient({
    // One place reports a failed change, so no action can fail silently.
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        const { meta } = mutation
        if (meta?.quiet) return
        const conflict = error instanceof ApiError && error.status === 409
        if (meta?.inlineConflict && conflict) return
        toaster.create({ type: 'error', title: error.message })
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 10_000,
        // One retry for a server hiccup. A 4xx, a missing tenant id or an
        // unreachable API will not fix itself, so show the error right away.
        retry: (failureCount, error) =>
          failureCount < 1 && error instanceof ApiError && error.status >= 500,
      },
    },
  })
}

function RootComponent() {
  // Created per mount, not at module scope: on the server a shared client
  // would leak one request's cache into the next.
  const [queryClient] = React.useState(createQueryClient)

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    // The boot script sets the theme class before hydration, so React must not
    // treat that attribute as a mismatch.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        <HeadContent />
      </head>
      <body>
        <ChakraProvider value={system}>
          {children}
          <Toaster />
        </ChakraProvider>
        <Scripts />
      </body>
    </html>
  )
}
