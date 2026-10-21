import { createFileRoute } from '@tanstack/react-router';

import { ApiKeysCard } from '@/features/account/components/api-keys-card';
import { PageHeader } from './-components';

export const Route = createFileRoute('/_app/account/api-keys')({
  component: ApiKeysRoute,
});

function ApiKeysRoute() {
  return (
    <>
      <PageHeader title="API keys" description="Keys grant access to the DRILLS API under your account." />
      <ApiKeysCard description="Authenticate scripts and services as you." />
    </>
  );
}
