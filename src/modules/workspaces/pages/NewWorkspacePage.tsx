import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Center, Field, Heading, HStack, Input, Stack, Steps, Text } from '@chakra-ui/react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Check } from 'pixelarticons/react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { sendVerificationEmail, useEmailVerified, useMe } from '@/modules/workspaces/api';
import { ApiError, type Schemas } from '@/shared/api/client';
import { errorKey } from '@/shared/api/errors';
import { useCreateWorkspace } from '@/modules/workspaces/api';
import { Bit } from '@/brand/Bit';
import { useAuth } from '@/modules/auth';

// Mirrors core-api's TenantSlug (3-40 chars, lowercase words joined by single hyphens); the server stays the authority.
const SLUG_MIN = 3;
const SLUG_MAX = 40;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MAX = 100;
const STEPS = ['verify', 'details', 'review', 'done'] as const;
const ALREADY_VERIFIED = 'email_already_verified'; // core-api ProblemCode.EMAIL_ALREADY_VERIFIED
const SENT_KEY = 'drills-verify-sent';
type Notice = 'sent' | 'wait' | 'failed';

/** Whether this tab already had the automatic mail sent; storage that throws (private mode) counts as not sent. */
function sentBefore(key: string): boolean {
  try {
    return sessionStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}
function markSent(key: string, sent: boolean) {
  try {
    if (sent) sessionStorage.setItem(key, '1');
    else sessionStorage.removeItem(key);
  } catch {
    /* private mode: the next visit sends again */
  }
}

/** The verify step: the API has the identity provider mail a link on arrival, then this waits for the link to be opened
 *  and signs in again (silently while the identity session lives) so the new token says the email is verified. */
function useEmailVerification(active: boolean, sub: string) {
  const { signIn } = useAuth();
  const sentKey = `${SENT_KEY}:${sub}`;
  const [notice, setNotice] = useState<Notice | null>(() => (sentBefore(sentKey) ? 'sent' : null));
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
      const tooSoon = e instanceof ApiError && e.status === 429;
      if (!tooSoon) markSent(sentKey, false); // nothing went out: a reload may try again
      setNotice(tooSoon ? 'wait' : 'failed');
    },
  });

  useEffect(() => {
    if (verified) continueIn();
  }, [verified, continueIn]);

  // One automatic mail per tab and user: a reload would otherwise replace the link that is already on its way.
  useEffect(() => {
    if (!active || sentBefore(sentKey)) return;
    markSent(sentKey, true);
    send();
  }, [active, sentKey, send]);

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

/** Four-step "new workspace" wizard: verify email, name and handle, review, done. */
export function NewWorkspacePage() {
  const { t } = useTranslation();
  const me = useMe();
  const navigate = useNavigate();
  const create = useCreateWorkspace();
  const [step, setStep] = useState(me.email_verified ? 1 : 0);
  const verify = useEmailVerification(step === 0, me.sub);
  const go = (to: number) => {
    if (to === 2) key.current = crypto.randomUUID(); // a fresh attempt gets a fresh key, else the server would replay the first answer
    setStep(to);
  };
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Schemas['TenantCreated'] | null>(null);
  const key = useRef(crypto.randomUUID());

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

  function submit() {
    setError(null);
    create.mutate(
      { name: trimmed, slug, key: key.current },
      {
        onSuccess: (made) => {
          setCreated(made);
          go(3);
        },
        onError: (e) => {
          if (e instanceof ApiError && e.status === 401) return; // the query client already sent the user to sign in
          setError(t(e instanceof ApiError && e.status === 409 ? 'workspace.error.conflict' : errorKey(e)));
        },
      },
    );
  }
  const busy = create.isPending;

  return (
    <Center p="4" minH="100vh">
      <Card.Root w="full" maxW="3xl">
        <Card.Header gap="5">
          <HStack gap="4">
            <Bit
              pose={step === 3 ? 'ship' : 'idle'}
              size={128}
              label={step === 3 ? t('workspace.done.label') : t('workspace.label')}
              data-testid="wizard-bit"
              data-pose={step === 3 ? 'ship' : 'idle'}
            />
            <Heading as="h1" textStyle="h1">
              {t('workspace.title')}
            </Heading>
          </HStack>
          <Steps.Root count={STEPS.length} step={step} linear>
            <Steps.List>
              {STEPS.map((s, i) => (
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
        </Card.Header>

        <Card.Body
          key={step}
          data-testid="wizard-step"
          data-step={STEPS[step]}
          gap="5"
          animationName="slide-from-right, fade-in" // the slide-fade-in style only animates popovers (it needs data-placement)
          animationDuration="bounce-gentle"
          animationTimingFunction="bounce-gentle-in-out" // moving between two steps
          css={{ '--slide-from-right-distance': '1.5rem' }}
          _motionReduce={{ animationName: 'fade-in' }}
        >
          {step === 0 && (
            <Alert.Root status="warning" colorPalette="warning">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('workspace.verify.title')}</Alert.Title>
                <Alert.Description>{t('workspace.verify.body', { email: me.email ?? '' })}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
          {step === 0 && verify.notice && (
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

          {step === 1 && (
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
            </Stack>
          )}

          {step === 2 && (
            <Stack gap="4">
              <Stack gap="1">
                <Text textStyle="label" color="fg.muted" textTransform="uppercase">
                  {t('workspace.details.name')}
                </Text>
                <Text>{trimmed}</Text>
              </Stack>
              <Stack gap="1">
                <Text textStyle="label" color="fg.muted" textTransform="uppercase">
                  {t('workspace.details.slug')}
                </Text>
                <Text fontFamily="mono">{slug}</Text>
              </Stack>
              <Text color="fg.muted">{t('workspace.review.owner')}</Text>
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

          {step === 3 && created && (
            <Alert.Root status="success" colorPalette="success">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{t('workspace.done.title', { name: created.name })}</Alert.Title>
                <Alert.Description>{t('workspace.done.body', { slug: created.slug })}</Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
        </Card.Body>

        <Card.Footer justifyContent="space-between">
          {step === 3 || me.tenants.length === 0 ? (
            <span />
          ) : (
            <Button asChild variant="outline" disabled={busy}>
              <Link to="/">{t('workspace.cancel')}</Link>
            </Button>
          )}
          <HStack gap="3">
            {step === 2 && (
              <Button variant="outline" onClick={() => go(1)} disabled={busy}>
                {t('workspace.back')}
              </Button>
            )}
            {step === 0 && (
              <Button variant="outline" onClick={verify.resend} loading={verify.sending} data-testid="wizard-resend">
                {t('workspace.verify.resend')}
              </Button>
            )}
            {step === 0 && (
              <Button onClick={verify.continueIn} data-testid="wizard-verify">
                {t('workspace.verify.cta')}
              </Button>
            )}
            {step === 1 && (
              <Button onClick={() => go(2)} disabled={!detailsOk} data-testid="wizard-next">
                {t('workspace.next')}
              </Button>
            )}
            {step === 2 && (
              <Button onClick={submit} loading={busy} data-testid="wizard-create">
                {t('workspace.review.create')}
              </Button>
            )}
            {step === 3 && created && (
              <Button onClick={() => void navigate({ to: '/w/$slug', params: { slug: created.slug } })} data-testid="wizard-open">
                {t('workspace.done.cta')}
              </Button>
            )}
          </HStack>
        </Card.Footer>
      </Card.Root>
    </Center>
  );
}
