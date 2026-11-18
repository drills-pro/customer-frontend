import { useState } from 'react';
import { Alert, Box, Button, Card, Checkbox, CloseButton, Dialog, Heading, HStack, Portal, Stack, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SimpleSelect } from '@/components/simple-select';
import { toaster } from '@/components/toaster';
import {
  useAcceptOwnershipOffer,
  useCancelOwnershipOffer,
  useMe,
  useOfferCandidates,
  useOfferOwnership,
  useOwnershipOffer,
  useResendOwnershipOffer,
  type OwnershipOffer,
} from '@/modules/workspaces/api';
import { useCan, useWorkspace } from '@/modules/workspaces/context';
import { errorKey } from '@/shared/api/errors';

const OFFER_PENDING = 'pending' satisfies OwnershipOffer['status'];

/**
 * Ownership transfer as one flow: offer, the open offer with its expiry, Cancel and Resend for the owner, Accept and Decline for the
 * person it was sent to. Everyone else sees nothing (the API hides an offer from people it does not involve).
 */
export function OwnershipCard() {
  const { t, i18n } = useTranslation();
  const { id } = useWorkspace();
  const me = useMe();
  const canTransfer = useCan('tenant.transfer_ownership');
  const { data: offer, isPending } = useOwnershipOffer(id);
  const people = useOfferCandidates(id, canTransfer);
  const cancel = useCancelOwnershipOffer(id);
  const resend = useResendOwnershipOffer(id);
  const accept = useAcceptOwnershipOffer(id);
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'short' });
  const fail = (title: string) => (e: unknown) => toaster.create({ type: 'error', title, description: t(errorKey(e)) });

  if (isPending || (!offer && !canTransfer)) return null;

  const nameOf = (sub: string) => {
    const p = people.data?.find((m) => m.user_sub === sub);
    return p?.display_name ?? p?.email ?? t('ownership.someone');
  };

  let body;
  if (!offer) {
    body = (
      <>
        <Text color="fg.muted">{t('ownership.body')}</Text>
        <OfferDialog />
      </>
    );
  } else {
    const pending = offer.status === OFFER_PENDING;
    const until = date.format(new Date(offer.expires_at));
    const toMe = offer.to_sub === me.sub;
    body = toMe ? (
      <>
        <Alert.Root
          status={pending ? 'info' : 'warning'}
          colorPalette={pending ? 'info' : 'warning'}
          data-testid="ownership-offer"
          data-status={offer.status}
        >
          <Alert.Indicator />
          <Alert.Description>
            {t(pending ? 'ownership.toMe.pending' : 'ownership.toMe.expired', { date: until })}{' '}
            {offer.step_down && t('ownership.toMe.stepDown')}
          </Alert.Description>
        </Alert.Root>
        <HStack gap="3">
          {pending && (
            <Button
              variant="solid"
              loading={accept.isPending}
              data-testid="ownership-accept"
              onClick={() =>
                accept.mutate(undefined, {
                  onSuccess: () => toaster.create({ type: 'success', title: t('ownership.accepted') }),
                  onError: fail(t('ownership.acceptFailed')),
                })
              }
            >
              {t('ownership.accept')}
            </Button>
          )}
          <Button
            loading={cancel.isPending}
            data-testid="ownership-decline"
            onClick={() => cancel.mutate(undefined, { onError: fail(t('ownership.cancelFailed')) })}
          >
            {t(pending ? 'ownership.decline' : 'ownership.dismiss')}
          </Button>
        </HStack>
      </>
    ) : (
      <>
        <Alert.Root
          status={pending ? 'info' : 'warning'}
          colorPalette={pending ? 'info' : 'warning'}
          data-testid="ownership-offer"
          data-status={offer.status}
        >
          <Alert.Indicator />
          <Alert.Description>
            {t(pending ? 'ownership.pending' : 'ownership.expired', { name: nameOf(offer.to_sub), date: until })}{' '}
            {offer.step_down && t('ownership.stepDownNote')}
          </Alert.Description>
        </Alert.Root>
        {canTransfer && (
          <HStack gap="3">
            <Button
              variant={pending ? 'outline' : 'solid'}
              loading={resend.isPending}
              data-testid="ownership-resend"
              onClick={() =>
                resend.mutate(
                  { to_sub: offer.to_sub, step_down: offer.step_down },
                  {
                    onSuccess: () => toaster.create({ type: 'success', title: t('ownership.resent') }),
                    onError: fail(t('ownership.resendFailed')),
                  },
                )
              }
            >
              {t('ownership.resend')}
            </Button>
            <Button
              loading={cancel.isPending}
              data-testid="ownership-cancel"
              onClick={() => cancel.mutate(undefined, { onError: fail(t('ownership.cancelFailed')) })}
            >
              {t('ownership.cancel')}
            </Button>
          </HStack>
        )}
      </>
    );
  }

  return (
    <Card.Root data-testid="settings-ownership">
      <Card.Header>
        <Heading as="h2" textStyle="h2">
          {t('ownership.title')}
        </Heading>
      </Card.Header>
      <Card.Body gap="4">{body}</Card.Body>
    </Card.Root>
  );
}

/** Pick who gets ownership and whether you step down to admin once they accept. */
function OfferDialog() {
  const { t } = useTranslation();
  const { id } = useWorkspace();
  const me = useMe();
  const people = useOfferCandidates(id, true);
  const offer = useOfferOwnership(id);
  const [open, setOpen] = useState(false);
  const [to, setTo] = useState('');
  const [stepDown, setStepDown] = useState(false);
  const items = (people.data ?? [])
    .filter((m) => m.role !== 'owner' && m.user_sub !== me.sub)
    .map((m) => ({ label: m.display_name ?? m.email ?? m.user_sub, value: m.user_sub }));
  const chosen = to || items[0]?.value || '';

  return (
    <Dialog.Root open={open} onOpenChange={(e) => (setOpen(e.open), e.open || offer.reset())}>
      <Dialog.Trigger asChild>
        <Button alignSelf="start" data-testid="ownership-open">
          {t('ownership.open')}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('ownership.dialog.title')}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="4">
                <Text>{t('ownership.dialog.body')}</Text>
                {items.length ? (
                  <Box>
                    <SimpleSelect label={t('ownership.dialog.to')} items={items} value={chosen} onChange={setTo} />
                  </Box>
                ) : (
                  <Text color="fg.muted">{t('ownership.dialog.nobody')}</Text>
                )}
                <Checkbox.Root
                  checked={stepDown}
                  onCheckedChange={(e) => setStepDown(e.checked === true)}
                  data-testid="ownership-step-down"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label>{t('ownership.dialog.stepDown')}</Checkbox.Label>
                </Checkbox.Root>
                {offer.isError && (
                  <Alert.Root status="error" colorPalette="danger">
                    <Alert.Indicator />
                    <Alert.Description>{t(errorKey(offer.error))}</Alert.Description>
                  </Alert.Root>
                )}
              </Stack>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button>{t('workspace.cancel')}</Button>
              </Dialog.ActionTrigger>
              <Button
                variant="solid"
                loading={offer.isPending}
                disabled={!chosen}
                data-testid="ownership-send"
                onClick={() => offer.mutate({ to_sub: chosen, step_down: stepDown }, { onSuccess: () => setOpen(false) })}
              >
                {t('ownership.dialog.send')}
              </Button>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label={t('ownership.dialog.close')} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
