import { createFileRoute } from '@tanstack/react-router'
import { CreditCard, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CardError, CardLoading } from '@/components/shared/query-states'
import { useDashboardLayout } from '@/features/dashboard/context'
import { useBilling, useInvoices } from '@/features/organizations/queries'
import { formatCount, formatUsd } from '@/lib/format'
import { unavailable } from '@/lib/unavailable'
import { PageHeader, SettingRow } from './-components/page-header'

export const Route = createFileRoute('/_app/account/billing')({
  component: BillingRoute,
})

function BillingRoute() {
  return (
    <>
      <PageHeader
        title="Billing & usage"
        description="Manage your plan, payment method, and resource usage."
      />
      <PlanCard />
      <PaymentMethodCard />
      <InvoicesCard />
    </>
  )
}

const monthDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

/** Billing belongs to the organization the user is working in. */
function useCurrentBilling() {
  return useBilling(useDashboardLayout().org.id)
}

function PlanCard() {
  const { data: billing, error, refetch } = useCurrentBilling()

  if (error) {
    return (
      <Card size="flush">
        <CardError
          title="Could not load billing"
          error={error}
          onRetry={() => void refetch()}
        />
      </Card>
    )
  }
  if (!billing) {
    return (
      <Card size="flush">
        <CardLoading rows={2} />
      </Card>
    )
  }

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>{billing.plan_name}</CardTitle>
        <CardDescription>
          {formatCount(billing.credits_total)} credits / month · renews{' '}
          {monthDay(billing.renews_at)}
        </CardDescription>
        <CardAction>
          <Button
            variant="outline"
            onClick={() => unavailable('Changing plans')}
          >
            Change plan
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-2 p-5">
        <div className="flex justify-between text-[13px]">
          <span>Credits used</span>
          <span className="font-semibold tabular-nums">
            {formatCount(billing.credits_used)} /{' '}
            {formatCount(billing.credits_total)}
          </span>
        </div>
        <Progress
          value={Math.round(
            (billing.credits_used / billing.credits_total) * 100,
          )}
          aria-label="Credits used"
          className="h-2"
        />
        <p className="text-xs text-muted-foreground">
          GPU hours are billed separately — see Resource usage on your project.
        </p>
      </CardContent>
    </Card>
  )
}

function PaymentMethodCard() {
  const paymentMethod = useCurrentBilling().data?.payment_method

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>Payment method</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <SettingRow
          icon={CreditCard}
          title={
            paymentMethod
              ? `${paymentMethod.brand} ending in ${paymentMethod.last4}`
              : 'No payment method'
          }
          description={
            paymentMethod
              ? `Expires ${paymentMethod.expires}`
              : 'Add a card to move to a paid plan.'
          }
        >
          <Button
            variant="ghost"
            onClick={() => unavailable('Updating the payment method')}
          >
            Update
          </Button>
        </SettingRow>
      </CardContent>
    </Card>
  )
}

function InvoicesCard() {
  const invoices = useInvoices(useDashboardLayout().org.id).data ?? []

  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {invoices.map((invoice) => (
          <SettingRow
            key={invoice.id}
            title={monthYear(invoice.period_start)}
            description={formatUsd(invoice.amount_usd)}
          >
            <Button
              variant="ghost"
              aria-label={`Download ${monthYear(invoice.period_start)} invoice`}
              onClick={() => unavailable('Downloading invoices')}
            >
              <Download />
              Download
            </Button>
          </SettingRow>
        ))}
      </CardContent>
    </Card>
  )
}
