import { useEffect, useRef } from 'react';
import { Button } from '@chakra-ui/react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useAcceptInvitation } from '@/modules/members/api';
import { Splash } from '@/shared/ui/Splash';
import { StateScreen } from '@/shared/ui/StateScreen';

/** /invite/$token: accept on arrival (the route already required sign-in), then open the workspace. */
export function InvitePage() {
  const { t } = useTranslation();
  const { token } = useParams({ from: '/app/invite/$token' });
  const navigate = useNavigate();
  const accept = useAcceptInvitation();
  const sent = useRef(false); // StrictMode runs effects twice and a token works once

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    accept.mutate(token, {
      onSuccess: (r) => {
        window.setTimeout(() => void navigate({ to: '/w/$slug', params: { slug: r.tenant_id }, replace: true }), 1500);
      },
    });
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
