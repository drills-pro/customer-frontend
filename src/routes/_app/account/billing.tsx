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
import { unavailable } from '@/lib/unavailable'
import {
  creditsLabel,
  creditsPercent,
  invoices,
  paymentMethod,
  plan,
} from './-components/account-data'
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

function PlanCard() {
  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>
          {plan.creditsTotal.toLocaleString('en-US')} credits / month · renews{' '}
          {plan.renews}
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
          <span className="font-semibold tabular-nums">{creditsLabel()}</span>
        </div>
        <Progress
          value={creditsPercent()}
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
  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>Payment method</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <SettingRow
          icon={CreditCard}
          title={`${paymentMethod.brand} ending in ${paymentMethod.last4}`}
          description={`Expires ${paymentMethod.expires}`}
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
  return (
    <Card size="flush">
      <CardHeader className="border-b [--card-section:--spacing(3.5)]">
        <CardTitle>Invoices</CardTitle>
      </CardHeader>
      <CardContent className="divide-y p-0">
        {invoices.map((invoice) => (
          <SettingRow
            key={invoice.id}
            title={invoice.period}
            description={invoice.amount}
          >
            <Button
              variant="ghost"
              aria-label={`Download ${invoice.period} invoice`}
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
