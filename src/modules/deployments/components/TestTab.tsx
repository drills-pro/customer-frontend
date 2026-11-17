import { useState } from 'react';
import { Alert, Badge, Button, Card, Field, Flex, Grid, Skeleton, Stack, Text, Textarea } from '@chakra-ui/react';
import { Send } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDeploymentSchema, useTestCalls, useTestDeployment, type Deployment, type TestCall } from '@/modules/deployments/api';
import { CodeBlock } from '@/modules/deployments/components/CodeBlock';
import { JSON_INDENT } from '@/modules/deployments/constants';
import { deploymentErrorKey } from '@/modules/deployments/errors';
import { statusUi } from '@/modules/deployments/status';

const BODY_ROWS = 8;
const pretty = (value: unknown) => JSON.stringify(value, null, JSON_INDENT);

/** The body the snippets send, with each input field left empty to fill in. */
const starterBody = (input: Record<string, unknown> | undefined) => ({
  input: Object.fromEntries(Object.keys(input ?? {}).map((field) => [field, ''])),
});

/** What the text parses to: a JSON object, or the locale key of why it is not one. */
function parseBody(text: string): { body: Record<string, unknown> } | { error: string } {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { error: 'deployments.test.notJson' };
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { error: 'deployments.test.notObject' };
  return { body: value as Record<string, unknown> };
}

/** Try the endpoint from here, signed in (no key needed), and see the latest calls anyone on the project made the same way. */
export function TestTab({ deployment }: { deployment: Deployment }) {
  const { t } = useTranslation();
  const serving = statusUi(deployment.status).test;
  const schema = useDeploymentSchema(deployment.project_id, deployment.id, serving);
  const test = useTestDeployment(deployment.project_id, deployment.id);
  // Starts from the schema's fields once they load; the person's edits win from then on.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? pretty(starterBody(schema.data?.input));
  const parsed = parseBody(text);
  const invalid = 'error' in parsed;

  return (
    <Grid gap="6" alignItems="start" templateColumns={{ lg: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
      <Card.Root variant="outline" minW="0">
        <Card.Header>
          <Card.Title as="h3" textStyle="body" fontWeight="semibold">
            {t('deployments.test.title')}
          </Card.Title>
        </Card.Header>
        <Card.Body>
          <Stack gap="4">
            {!serving && (
              <Alert.Root status="info" colorPalette="info" data-testid="deployment-test-unavailable">
                <Alert.Indicator />
                <Alert.Description>{t('deployments.test.notServing')}</Alert.Description>
              </Alert.Root>
            )}
            <Field.Root invalid={invalid}>
              <Field.Label>{t('deployments.test.body')}</Field.Label>
              <Textarea
                value={text}
                onChange={(e) => setDraft(e.target.value)}
                rows={BODY_ROWS}
                fontFamily="mono"
                textStyle="mono-sm"
                spellCheck={false}
                data-testid="deployment-test-body"
              />
              {invalid ? (
                <Field.ErrorText>{t(parsed.error)}</Field.ErrorText>
              ) : (
                <Field.HelperText>{t('deployments.test.bodyHelp')}</Field.HelperText>
              )}
            </Field.Root>
            <Flex>
              {/* Outline: the project header holds the screen's one solid button. */}
              <Button
                size="sm"
                disabled={!serving || invalid}
                loading={test.isPending}
                onClick={() => !invalid && test.mutate(parsed.body)}
                data-testid="deployment-test-send"
              >
                <Send />
                {t('deployments.test.send')}
              </Button>
            </Flex>
            {test.isError && (
              <Alert.Root status="error" colorPalette="danger" data-testid="deployment-test-error">
                <Alert.Indicator />
                <Alert.Description>{t(deploymentErrorKey(test.error))}</Alert.Description>
              </Alert.Root>
            )}
            {test.data && (
              <Stack gap="2" data-testid="deployment-test-result">
                <Flex align="center" justify="space-between" gap="2">
                  <Text fontWeight="semibold">{t('deployments.test.response')}</Text>
                  <Latency ms={test.data.latency_ms} />
                </Flex>
                <CodeBlock>{pretty(test.data.response)}</CodeBlock>
              </Stack>
            )}
          </Stack>
        </Card.Body>
      </Card.Root>
      <RecentCalls deployment={deployment} />
    </Grid>
  );
}

function Latency({ ms }: { ms: number | null }) {
  const { t, i18n } = useTranslation();
  if (ms === null) return null;
  const value = new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: 0 }).format(ms);
  return (
    <Badge variant="subtle" fontFamily="mono">
      {t('deployments.test.latency', { value })}
    </Badge>
  );
}

function RecentCalls({ deployment }: { deployment: Deployment }) {
  const { t } = useTranslation();
  const calls = useTestCalls(deployment.project_id, deployment.id);
  return (
    <Card.Root variant="outline" minW="0" data-testid="deployment-test-calls">
      <Card.Header>
        <Card.Title as="h3" textStyle="body" fontWeight="semibold">
          {t('deployments.test.recent')}
        </Card.Title>
      </Card.Header>
      <Card.Body>
        {calls.isError ? (
          <Text color="fg.muted">{t(deploymentErrorKey(calls.error))}</Text>
        ) : calls.isPending ? (
          <Skeleton h="24" />
        ) : calls.data.length === 0 ? (
          <Text color="fg.muted" data-testid="deployment-test-calls-empty">
            {t('deployments.test.noCalls')}
          </Text>
        ) : (
          <Stack gap="4">
            {calls.data.map((call) => (
              <Call key={call.id} call={call} />
            ))}
          </Stack>
        )}
      </Card.Body>
    </Card.Root>
  );
}

function Call({ call }: { call: TestCall }) {
  const { i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: 'medium', timeStyle: 'medium' });
  return (
    <Stack gap="2" data-testid="deployment-test-call">
      <Flex align="center" justify="space-between" gap="2">
        <Text textStyle="body-sm" color="fg.muted">
          {date.format(new Date(call.created_at))}
        </Text>
        <Latency ms={call.latency_ms} />
      </Flex>
      <CodeBlock maxH="40">{pretty(call.response)}</CodeBlock>
    </Stack>
  );
}
