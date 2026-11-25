import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Center, Field, Heading, HStack, Input, Stack, Steps } from '@chakra-ui/react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { Check } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { toaster } from '@/components/toaster';
import { sendVerificationEmail, slugAvailable, useCreateWorkspace, useEmailVerified, useMe } from '@/modules/workspaces/api';
import { ApiError } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { newIdempotencyKey } from '@/shared/api/idempotency';
import { Bit } from '@/brand/Bit';
import { useAuth } from '@/modules/auth';

// Mirrors core-api's TenantSlug (3-40 chars, lowercase words joined by single hyphens); the server stays the authority.
const SLUG_MIN = 3;
const SLUG_MAX = 40;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MAX = 100;
const VERIFY = 0;
const DETAILS = 1;
const ALREADY_VERIFIED = 'email_already_verified'; // core-api ProblemCode.EMAIL_ALREADY_VERIFIED
type Notice = 'sent' | 'wait' | 'failed';

/** The verify step waits for the link mailed at sign-up to be opened, then signs in again (silently while the identity
 *  session lives) so the new token says the email is verified. A mail goes out only when the user asks: every mail
 *  carries a new code and voids the earlier link, so sending on arrival would break the one already in the inbox. */
function useEmailVerification(active: boolean) {
  const { signIn } = useAuth();
  const [notice, setNotice] = useState<Notice | null>(null);
  const leaving = useRef(false);
  const verified = useEmailVerified(active);

  const continueIn = useCallback(() => {
    if (leaving.current) return;
    leaving.current = true;
    signIn('/');
  }, [signIn]);

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: sendVerificationEmail,
    onSuccess: () => setNotice('sent'),
    onError: (e) => {
      if (e instanceof ApiError && e.code === ALREADY_VERIFIED) return continueIn();
      setNotice(e instanceof ApiError && e.status === 429 ? 'wait' : 'failed');
    },
  });

  useEffect(() => {
    if (verified) continueIn();
  }, [verified, continueIn]);

  return { notice, sending, resend: () => send(), continueIn };
}

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/, '');

function slugProblem(slug: string): 'short' | 'format' | null {
  if (slug.length < SLUG_MIN) return 'short';
  return SLUG_PATTERN.test(slug) && slug.length <= SLUG_MAX ? null : 'format';
}

const SUFFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
/** The handle with a random 5-character ending, for when the name's own handle is taken. Stays within SLUG_MAX. */
function withSuffix(slug: string) {
  const tail = Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => SUFFIX_CHARS[b % SUFFIX_CHARS.length]).join('');
  return `${slug.slice(0, SLUG_MAX - 6).replace(/-+$/, '')}-${tail}`;
}

/** Name and handle on one screen; Create checks the handle and creates the workspace, then opens it. A taken handle gets an ending. */
export function NewWorkspacePage() {
  const { t } = useTranslation();
  const me = useMe();
  const navigate = useNavigate();
  const create = useCreateWorkspace();
  // Verified at sign-up or later: only the details step is left, and the verify step is not shown.
  const step = me.email_verified ? DETAILS : VERIFY;
  const verify = useEmailVerification(step === VERIFY);
  // One key per attempt: a double click or a retry replays the first answer instead of making a second workspace.
  const key = useRef(newIdempotencyKey());
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = name.trim();
  const problem = slugProblem(slug);
  const detailsOk = trimmed.length > 0 && problem === null;

  const onName = (v: string) => {
    setName(v);
    if (!slugEdited) setSlug(slugify(v));
  };
  const onSlug = (v: string) => {
    setSlugEdited(true);
    setSlug(v.toLowerCase());
  };

  async function submit() {
    setError(null);
    setChecking(true);
    // A failed check keeps the typed handle: the create still reports a real problem.
    const free = await slugAvailable(slug).catch(() => true);
    setChecking(false);
    const handle = free ? slug : withSuffix(slug);
    try {
      const made = await create.mutateAsync({ name: trimmed, slug: handle, key: key.current });
      toaster.create({
        type: 'success',
        title: t('workspace.done.title', { name: made.name }),
        description: handle === slug ? undefined : t('workspace.review.suffixed', { from: slug }),
      });
      void navigate({ to: '/w/$slug', params: { slug: made.slug } });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return; // the query client already sent the user to sign in
      key.current = newIdempotencyKey(); // a refused attempt is over: the next click is a new one
      setError(t(e instanceof ApiError && e.status === 409 ? 'workspace.error.conflict' : errorKey(e)));
    }
  }
  const busy = create.isPending || checking;

  return (
    <Center p="4" minH="100vh">
      <Card.Root w="full" maxW="3xl">
        <Card.Header gap="5">
          <HStack gap="4">
            <Bit pose="idle" size={128} label={t('workspace.label')} data-testid="wizard-bit" data-pose="idle" />
            <Heading as="h1" textStyle="h1">
              {t('workspace.title')}
            </Heading>
          </HStack>
          {!me.email_verified && (
            <Steps.Root count={2} step={step} linear>
              <Steps.List>
                {(['verify', 'details'] as const).map((s, i) => (
                  <Steps.Item key={s} index={i}>
                    <Steps.Indicator>
                      <Steps.Status complete={<Check />} incomplete={<Steps.Number />} current={<Steps.Number />} />
                    </Steps.Indicator>
                    <Steps.Title>{t(`workspace.step.${s}`)}</Steps.Title>
                    <Steps.Separator />
                  </Steps.Item>
                ))}
              </Steps.List>
            </Steps.Root>
          )}
        </Card.Header>

        <Card.Body
          key={step}
          data-testid="wizard-step"
          data-step={step === VERIFY ? 'verify' : 'details'}
          gap="5"
          animationName="slide-from-right, fade-in" // the slide-fade-in style only animates popovers (it needs data-placement)
          animationDuration="bounce-gentle"
          animationTimingFunction="bounce-gentle-in-out" // moving between two steps
          css={{ '--slide-from-right-distance': '1.5rem' }}
          _motionReduce={{ animationName: 'fade-in' }}
        >
          {step === VERIFY && (
            <Alert.Root status="warning" colorPalette="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('workspace.verify.title')}</Alert.Title>
                <Alert.Description>{t('workspace.verify.body', { email: me.email ?? '' })}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          {step === VERIFY && verify.notice && (
            <Alert.Root
              size="sm"
              status={verify.notice === 'failed' ? 'error' : 'info'}
              colorPalette={verify.notice === 'failed' ? 'danger' : 'info'}
              data-testid="wizard-verify-notice"
              data-notice={verify.notice}
            >
              <Alert.Indicator />
              <Alert.Title>{t(`workspace.verify.notice.${verify.notice}`)}</Alert.Title>
            </Alert.Root>
          )}

          {step === DETAILS && (
            <Stack gap="5" maxW="md">
              <Field.Root required invalid={name.length > 0 && !trimmed}>
                <Field.Label>{t('workspace.details.name')}</Field.Label>
                <Input data-testid="wizard-name" value={name} maxLength={NAME_MAX} onChange={(e) => onName(e.target.value)} />
                <Field.HelperText>{t('workspace.details.nameHelp')}</Field.HelperText>
              </Field.Root>
              <Field.Root required invalid={slug.length > 0 && problem !== null}>
                <Field.Label>{t('workspace.details.slug')}</Field.Label>
                <Input
                  data-testid="wizard-slug"
                  value={slug}
                  fontFamily="mono"
                  maxLength={SLUG_MAX}
                  onChange={(e) => onSlug(e.target.value)}
                />
                <Field.ErrorText>
                  {problem && t(`workspace.details.slugError.${problem}`, { min: SLUG_MIN, max: SLUG_MAX })}
                </Field.ErrorText>
                <Field.HelperText>{t('workspace.details.slugHelp')}</Field.HelperText>
              </Field.Root>
              {error && (
                <Alert.Root status="error" colorPalette="danger">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{t('workspace.error.title')}</Alert.Title>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}
            </Stack>
          )}
        </Card.Body>

        <Card.Footer justifyContent="space-between">
          {me.tenants.length === 0 ? (
            <span />
          ) : (
            <Button asChild variant="outline" disabled={busy}>
              <Link to="/">{t('workspace.cancel')}</Link>
            </Button>
          )}
          <HStack gap="3">
            {step === VERIFY && (
              <Button variant="outline" onClick={verify.resend} loading={verify.sending} data-testid="wizard-resend">
                {t('workspace.verify.resend')}
              </Button>
            )}
            {step === VERIFY && (
              <Button onClick={verify.continueIn} data-testid="wizard-verify">
                {t('workspace.verify.cta')}
              </Button>
            )}
            {step === DETAILS && (
              <Button onClick={() => void submit()} loading={busy} disabled={!detailsOk} data-testid="wizard-create">
                {t('workspace.review.create')}
              </Button>
            )}
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Center>
  );
}
