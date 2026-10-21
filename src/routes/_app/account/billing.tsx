import type * as React from 'react';
import { Box, Button, Card, Flex, Progress, Stack, Text } from '@chakra-ui/react';
import { createFileRoute } from '@tanstack/react-router';
import { CreditCard, Download } from 'lucide-react';

import { SectionCard } from '@/components/shared/section-card';
import { CardError, CardLoading } from '@/components/shared/query-states';
import { useDashboardLayout } from '@/features/dashboard/context';
import { useBilling, useInvoices } from '@/features/organizations/queries';
import { formatCount, formatUsd } from '@/lib/format';
import { unavailable } from '@/lib/unavailable';
import { PageHeader, SettingRow } from './-components/page-header';

export const Route = createFileRoute('/_app/account/billing')({
  component: BillingRoute,
});

function BillingRoute() {
  return (
    <>
      <PageHeader title="Billing & usage" description="Manage your plan, payment method, and resource usage." />
      <PlanCard />
      <PaymentMethodCard />
      <InvoicesCard />
    </>
  );
}

const monthDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const monthYear = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

/** Billing belongs to the organization the user is working in. */
function useCurrentBilling() {
  return useBilling(useDashboardLayout().org.id);
}

/** Rows in a card, ruled off from each other. */
function RowList({ children }: { children: React.ReactNode }) {
  return <Box css={{ '& > * + *': { borderTopWidth: '1px', borderColor: 'border' } }}>{children}</Box>;
}

function PlanCard() {
  const { data: billing, error, refetch } = useCurrentBilling();

  if (error) {
    return (
      <Card.Root variant="outline">
        <CardError title="Could not load billing" error={error} onRetry={() => void refetch()} />
      </Card.Root>
    );
  }
  if (!billing) {
    return (
      <Card.Root variant="outline">
        <CardLoading rows={2} />
      </Card.Root>
    );
  }

  return (
    <SectionCard
      title={billing.plan_name}
      description={`${formatCount(billing.credits_total)} credits / month · renews ${monthDay(billing.renews_at)}`}
      action={
        <Button variant="outline" size="sm" onClick={() => unavailable('Changing plans')}>
          Change plan
        </Button>
      }
    >
      <Stack gap="2" p="5">
        <Flex justify="space-between" fontSize="13px">
          <span>Credits used</span>
          <Text as="span" fontWeight="semibold" fontVariantNumeric="tabular-nums">
            {formatCount(billing.credits_used)} / {formatCount(billing.credits_total)}
          </Text>
        </Flex>
        <Progress.Root size="sm" value={Math.round((billing.credits_used / billing.credits_total) * 100)}>
          <Progress.Track aria-label="Credits used">
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
        <Text fontSize="xs" color="fg.muted">
          GPU hours are billed separately — see Resource usage on your project.
        </Text>
      </Stack>
    </SectionCard>
  );
}

function PaymentMethodCard() {
  const paymentMethod = useCurrentBilling().data?.payment_method;

  return (
    <SectionCard title="Payment method">
      <SettingRow
        icon={CreditCard}
        title={paymentMethod ? `${paymentMethod.brand} ending in ${paymentMethod.last4}` : 'No payment method'}
        description={paymentMethod ? `Expires ${paymentMethod.expires}` : 'Add a card to move to a paid plan.'}
      >
        <Button variant="ghost" colorPalette="gray" size="sm" onClick={() => unavailable('Updating the payment method')}>
          Update
        </Button>
      </SettingRow>
    </SectionCard>
  );
}

function InvoicesCard() {
  const invoices = useInvoices(useDashboardLayout().org.id).data ?? [];

  return (
    <SectionCard title="Invoices">
      <RowList>
        {invoices.map((invoice) => (
          <SettingRow key={invoice.id} title={monthYear(invoice.period_start)} description={formatUsd(invoice.amount_usd)}>
            <Button
              variant="ghost"
              colorPalette="gray"
              size="sm"
              aria-label={`Download ${monthYear(invoice.period_start)} invoice`}
              onClick={() => unavailable('Downloading invoices')}
            >
              <Download />
              Download
            </Button>
          </SettingRow>
        ))}
      </RowList>
    </SectionCard>
  );
}
