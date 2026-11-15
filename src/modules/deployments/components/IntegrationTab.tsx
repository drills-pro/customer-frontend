import { useState } from 'react';
import { Alert, Card, Clipboard, DataList, Flex, Grid, IconButton, Skeleton, Stack, Tabs, Text } from '@chakra-ui/react';
import { Check, Copy } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { useDeploymentSchema, type Deployment } from '@/modules/deployments/api';
import { CodeBlock } from '@/modules/deployments/components/CodeBlock';
import { JSON_INDENT, SNIPPET_LANGS, type SnippetLang } from '@/modules/deployments/constants';
import { deploymentErrorKey } from '@/modules/deployments/errors';
import { statusUi } from '@/modules/deployments/status';

/** How to call the endpoint: the model it serves, ready-to-paste snippets, and the shape of what goes in and comes out. */
export function IntegrationTab({ deployment }: { deployment: Deployment }) {
  const { t } = useTranslation();
  // The schema needs the served model, which a deploying or failed deployment may not have yet.
  const ready = statusUi(deployment.status).test || statusUi(deployment.status).start;
  const schema = useDeploymentSchema(deployment.project_id, deployment.id, ready);
  const [lang, setLang] = useState<SnippetLang>(SNIPPET_LANGS[0]);

  if (!ready)
    return (
      <Text color="fg.muted" data-testid="deployment-integration-waiting">
        {t('deployments.integration.waiting')}
      </Text>
    );
  if (schema.isError)
    return (
      <Alert.Root status="error" colorPalette="danger" data-testid="deployment-schema-error">
        <Alert.Indicator />
        <Alert.Description>{t(deploymentErrorKey(schema.error))}</Alert.Description>
      </Alert.Root>
    );
  if (schema.isPending) return <Skeleton h="64" />;

  const { snippets, input, output, model_id, model_revision, task_type } = schema.data;
  const code = snippets[lang];
  return (
    <Grid gap="6" alignItems="start" templateColumns={{ lg: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
      <Stack gap="3" minW="0">
        <Card.Root variant="outline" overflow="hidden">
          <Flex wrap="wrap" align="center" gap="3" px="5" py="2" borderBottomWidth="1px" borderColor="border">
            <Tabs.Root size="sm" me="auto" value={lang} onValueChange={(e) => setLang(e.value as SnippetLang)}>
              <Tabs.List aria-label={t('deployments.integration.language')}>
                <Tabs.Indicator />
                {SNIPPET_LANGS.map((id) => (
                  <Tabs.Trigger key={id} value={id} data-testid={`deployment-snippet-${id}`}>
                    {t(`deployments.integration.lang.${id}`)}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
            <Clipboard.Root value={code}>
              <Clipboard.Trigger asChild>
                <IconButton variant="hint" size="xs" aria-label={t('deployments.integration.copy')} data-testid="deployment-snippet-copy">
                  <Clipboard.Indicator copied={<Check />}>
                    <Copy />
                  </Clipboard.Indicator>
                </IconButton>
              </Clipboard.Trigger>
            </Clipboard.Root>
          </Flex>
          <CodeBlock testId="deployment-snippet">{code}</CodeBlock>
        </Card.Root>
        <Text textStyle="body-sm" color="fg.muted">
          {t('deployments.integration.keyHint')}
        </Text>
      </Stack>
      <Stack gap="6" minW="0">
        <Card.Root variant="outline">
          <Card.Header>
            <Card.Title as="h3" textStyle="body" fontWeight="semibold">
              {t('deployments.integration.model')}
            </Card.Title>
          </Card.Header>
          <Card.Body>
            <DataList.Root size="sm" orientation="horizontal">
              <DataList.Item>
                <DataList.ItemLabel>{t('deployments.integration.task')}</DataList.ItemLabel>
                <DataList.ItemValue>{t(`projects.taskType.${task_type}.label`, { defaultValue: task_type })}</DataList.ItemValue>
              </DataList.Item>
              <DataList.Item>
                <DataList.ItemLabel>{t('deployments.integration.modelId')}</DataList.ItemLabel>
                <DataList.ItemValue minW="0">
                  <Text textStyle="mono-sm" truncate>
                    {model_id}
                  </Text>
                </DataList.ItemValue>
              </DataList.Item>
              <DataList.Item>
                <DataList.ItemLabel>{t('deployments.integration.revision')}</DataList.ItemLabel>
                <DataList.ItemValue textStyle="mono-sm">{model_revision}</DataList.ItemValue>
              </DataList.Item>
            </DataList.Root>
          </Card.Body>
        </Card.Root>
        <Shape title={t('deployments.integration.input')} value={input} testId="deployment-input-shape" />
        <Shape title={t('deployments.integration.output')} value={output} testId="deployment-output-shape" />
      </Stack>
    </Grid>
  );
}

function Shape({ title, value, testId }: { title: string; value: unknown; testId: string }) {
  return (
    <Card.Root variant="outline" overflow="hidden">
      <Card.Header pb="3">
        <Card.Title as="h3" textStyle="body" fontWeight="semibold">
          {title}
        </Card.Title>
      </Card.Header>
      <CodeBlock testId={testId}>{JSON.stringify(value, null, JSON_INDENT)}</CodeBlock>
    </Card.Root>
  );
}
