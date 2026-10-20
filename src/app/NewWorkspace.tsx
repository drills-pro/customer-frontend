import { useRef, useState } from 'react';
import { Alert, Button, Card, Field, Heading, HStack, Input, Stack, Steps, Text } from '@chakra-ui/react';
import { Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ApiError, createTenant, type TenantCreated } from './api';
import { useAuth } from './auth';

// Mirrors core-api's TenantSlug (3-40 chars, lowercase words joined by single hyphens); the server stays the authority.
const SLUG_MIN = 3;
const SLUG_MAX = 40;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MAX = 100;
const STEPS = ['verify', 'details', 'review', 'done'] as const;

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

interface Props {
  emailVerified: boolean;
  /** Called when the wizard closes; `created` is set when a workspace was made, so the caller can reload. */
  onClose: (created: boolean) => void;
}

/** Four-step "new workspace" wizard: verify email, name and handle, review, done. */
export function NewWorkspace({ emailVerified, onClose }: Props) {
  const { t } = useTranslation();
  const { user, signIn, expire } = useAuth();
  const [step, setStep] = useState(emailVerified ? 1 : 0);
  const go = (to: number) => {
    if (to === 2) key.current = crypto.randomUUID(); // a fresh attempt gets a fresh key, else the server would replay the first answer
    setStep(to);
  };
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<TenantCreated | null>(null);
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

  async function create() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      setCreated(await createTenant(user.access_token, { name: trimmed, slug }, key.current));
      go(3);
    } catch (e) {
      if (!(e instanceof ApiError)) setError(t('workspace.error.network'));
      else if (e.status === 401) return expire();
      else if (e.status === 403) setError(t('workspace.error.unverified'));
      else if (e.status === 409) setError(t('workspace.error.conflict'));
      else if (e.status === 429) setError(t('workspace.error.rateLimited'));
      else setError(t('workspace.error.generic'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card.Root>
      <Card.Header gap="5">
        <Heading as="h2" textStyle="h2">
          {t('workspace.title')}
        </Heading>
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
              <Alert.Description>{t('workspace.verify.body')}</Alert.Description>
            </Alert.Content>
          </Alert.Root>
        )}

        {step === 1 && (
          <Stack gap="5" maxW="md">
            <Field.Root required invalid={name.length > 0 && !trimmed}>
              <Field.Label>{t('workspace.details.name')}</Field.Label>
              <Input value={name} maxLength={NAME_MAX} onChange={(e) => onName(e.target.value)} />
              <Field.HelperText>{t('workspace.details.nameHelp')}</Field.HelperText>
            </Field.Root>
            <Field.Root required invalid={slug.length > 0 && problem !== null}>
              <Field.Label>{t('workspace.details.slug')}</Field.Label>
              <Input value={slug} fontFamily="mono" maxLength={SLUG_MAX} onChange={(e) => onSlug(e.target.value)} />
              <Field.ErrorText>{problem && t(`workspace.details.slugError.${problem}`, { min: SLUG_MIN, max: SLUG_MAX })}</Field.ErrorText>
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
        {step === 3 ? (
          <span />
        ) : (
          <Button variant="outline" onClick={() => onClose(false)} disabled={busy}>
            {t('workspace.cancel')}
          </Button>
        )}
        <HStack gap="3">
          {step === 2 && (
            <Button variant="outline" onClick={() => go(1)} disabled={busy}>
              {t('workspace.back')}
            </Button>
          )}
          {step === 0 && <Button onClick={() => signIn('/')}>{t('workspace.verify.cta')}</Button>}
          {step === 1 && (
            <Button onClick={() => go(2)} disabled={!detailsOk}>
              {t('workspace.next')}
            </Button>
          )}
          {step === 2 && (
            <Button onClick={create} loading={busy}>
              {t('workspace.review.create')}
            </Button>
          )}
          {step === 3 && <Button onClick={() => onClose(true)}>{t('workspace.done.cta')}</Button>}
        </HStack>
      </Card.Footer>
    </Card.Root>
  );
}
