import { createFileRoute, Outlet } from '@tanstack/react-router'

import { AccountNav } from './-components'

export const Route = createFileRoute('/_app/account')({
  component: AccountLayout,
})

function AccountLayout() {
  return (
    <main
      id="dashboard-main"
      className="mx-auto w-full max-w-[1448px] flex-1 p-4 sm:p-6"
    >
      <p className="mb-4 text-sm text-muted-foreground">Account settings</p>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <AccountNav />
        <div className="grid min-w-0 max-w-4xl content-start gap-5">
          <Outlet />
        </div>
      </div>
    </main>
  )
}
