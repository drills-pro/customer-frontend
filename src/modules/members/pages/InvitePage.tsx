import { useEffect, useRef } from 'react';
import { Button } from '@chakra-ui/react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAcceptInvitation } from '@/modules/members/api';
import { Splash } from '@/shared/ui/Splash';
import { StateScreen } from '@/shared/ui/StateScreen';

const OPEN_DELAY_MS = 1500; // long enough to read "You have joined"

/** /invite/$token: accept on arrival (the route already required sign-in), then open the workspace. Opening a link
 * already accepted by this person opens the workspace too (the API answers it again). */
export function InvitePage() {
  const { t } = useTranslation();
  const { token } = useParams({ from: '/app/invite/$token' });
  const navigate = useNavigate();
  const accept = useAcceptInvitation();
  const sent = useRef(false); // StrictMode runs effects twice

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // mutateAsync, not mutate's per-call onSuccess: that one is dropped if the page remounts, and the redirect with it.
    accept
      .mutateAsync(token)
      .then((r) => {
        // The id resolves to the workspace's slug in the workspace route.
        window.setTimeout(() => void navigate({ to: '/w/$slug', params: { slug: r.tenant_id }, replace: true }), OPEN_DELAY_MS);
      })
      .catch(() => undefined); // accept.isError renders the failure
  }, [accept, token, navigate]);

  if (accept.isError)
    return (
      <StateScreen pose="oops" label={t('invite.failedLabel')} title={t('invite.failedTitle')} body={t('invite.failedBody')} page>
        <Button asChild>
          <Link to="/">{t('notFound.cta')}</Link>
        </Button>
      </StateScreen>
    );
  if (accept.isSuccess)
    return <StateScreen pose="ship" label={t('invite.doneLabel')} title={t('invite.doneTitle')} body={t('invite.doneBody')} page />;
  return <Splash />;
}
