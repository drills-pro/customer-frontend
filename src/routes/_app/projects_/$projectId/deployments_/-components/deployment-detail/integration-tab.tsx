import * as React from 'react'
import {
  Box,
  Button,
  Card,
  Center,
  Code,
  Flex,
  Grid,
  SimpleGrid,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { ImageUp, Play } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { CopyButton } from '@/components/shared/copy-button'
import { SectionCard } from '@/components/shared/section-card'
import { ToneBadge } from '@/components/shared/tone-badge'
import {
  useDeploymentKey,
  useRotateDeploymentKey,
  useTestDeployment,
} from '@/features/deployments/queries'
import { relativeTimeLong } from '@/lib/format'
import { useCurrentDeployment } from './use-current-deployment'

const languages = ['cURL', 'Python', 'JavaScript', 'Go'] as const
type Language = (typeof languages)[number]

function snippet(language: Language, endpoint: string, apiKey: string) {
  if (language === 'cURL') {
    return `curl -X POST "${endpoint}" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -F "image=@shelf.jpg"`
  }
  if (language === 'Python') {
    return `import requests

url  = "${endpoint}"
head = {"Authorization": "Bearer ${apiKey}"}

with open("shelf.jpg", "rb") as f:
    r = requests.post(url, headers=head, files={"image": f})

print(r.json())`
  }
  if (language === 'JavaScript') {
    return `const body = new FormData()
body.append("image", file)

const res = await fetch("${endpoint}", {
  method: "POST",
  headers: { Authorization: "Bearer ${apiKey}" },
  body,
})

console.log(await res.json())`
  }
  return `req, _ := http.NewRequest("POST",
    "${endpoint}", body)
req.Header.Set("Authorization", "Bearer ${apiKey}")
req.Header.Set("Content-Type", writer.FormDataContentType())

res, err := http.DefaultClient.Do(req)`
}

export function IntegrationTab() {
  const { project, deployment, model } = useCurrentDeployment()
  const [language, setLanguage] = React.useState<Language>('Python')
  const testCall = useTestDeployment(project.id, deployment.id)
  const key = useDeploymentKey(project.id, deployment.id).data
  const rotate = useRotateDeploymentKey(project.id, deployment.id)
  // A rotated key is readable once, in the answer to the rotation.
  const freshKey = rotate.data?.key
  // The samples carry the masked key: enough to recognise, useless to copy.
  const code = snippet(language, deployment.endpoint, key?.masked_key ?? '')
  const modelLabel = model
    ? `${model.name} v${model.version}`
    : deployment.modelId

  return (
    <Grid
      minW="0"
      alignItems="start"
      gap="6"
      templateColumns={{ lg: 'repeat(3, minmax(0, 1fr))' }}
    >
      <Grid minW="0" gap="6" gridColumn={{ lg: 'span 2' }}>
        <Card.Root variant="outline" overflow="hidden">
          <Flex
            align="center"
            gap="2"
            px="5"
            py="2.5"
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Tabs.Root
              variant="subtle"
              size="sm"
              me="auto"
              value={language}
              onValueChange={(event) => setLanguage(event.value as Language)}
            >
              <Tabs.List aria-label="Code language">
                {languages.map((item) => (
                  <Tabs.Trigger key={item} value={item}>
                    {item}
                  </Tabs.Trigger>
                ))}
              </Tabs.List>
            </Tabs.Root>
            <CopyButton value={code} label={`Copy ${language} snippet`} />
          </Flex>
          <Box
            as="pre"
            overflowX="auto"
            bg="night"
            color="on-night"
            p="5"
            fontFamily="mono"
            fontSize="xs"
            lineHeight="relaxed"
          >
            {code}
          </Box>
        </Card.Root>

        <SectionCard
          title="Send a test request"
          action={<ToneBadge tone="neutral">Example result</ToneBadge>}
        >
          <SimpleGrid columns={{ base: 1, sm: 2 }} gap="5" p="5">
            <Box>
              <Flex
                minH="140px"
                direction="column"
                align="center"
                justify="center"
                gap="2"
                rounded="l2"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="border.emphasized"
                px="5"
                textAlign="center"
              >
                <Center
                  boxSize="9"
                  rounded="l2"
                  bg="surface-raised"
                  color="fg.muted"
                  borderWidth="1px"
                  borderColor="border"
                >
                  <ImageUp size={16} />
                </Center>
                <Text fontSize="13px" fontWeight="medium">
                  Drop an image here
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  JPG, PNG up to 10 MB
                </Text>
              </Flex>
              <Button
                variant="solid"
                size="sm"
                mt="3"
                w="full"
                disabled={testCall.isPending}
                onClick={() =>
                  testCall.mutate(undefined, {
                    onSuccess: (result) =>
                      toaster.create({
                        type: 'success',
                        title: `${result.status} OK in ${result.latency_ms} ms.`,
                      }),
                  })
                }
              >
                <Play />
                Send request
              </Button>
            </Box>
            <Box>
              <Flex
                align="center"
                justify="space-between"
                gap="3"
                rounded="l2"
                bg="bg.success"
                color="fg.success"
                px="4"
                py="3"
              >
                <Box minW="0">
                  <Text
                    fontSize="11px"
                    fontWeight="medium"
                    letterSpacing="widest"
                    textTransform="uppercase"
                  >
                    200 OK
                  </Text>
                  <Text
                    truncate
                    fontFamily="mono"
                    fontSize="15px"
                    fontWeight="semibold"
                  >
                    beverages_cola_330ml
                  </Text>
                </Box>
                <Text
                  flexShrink={0}
                  fontSize="2xl"
                  fontWeight="semibold"
                  fontVariantNumeric="tabular-nums"
                >
                  96.4%
                </Text>
              </Flex>
              <Box
                as="pre"
                mt="3"
                overflowX="auto"
                rounded="l2"
                bg="night"
                color="on-night"
                p="3.5"
                fontFamily="mono"
                fontSize="11px"
                lineHeight="relaxed"
              >
                {`{
  "label": "beverages_cola_330ml",
  "confidence": 0.964,
  "latency_ms": ${Number.parseFloat(deployment.latencyP95) || 140},
  "model": "${modelLabel}"
}`}
              </Box>
              <Text mt="2" fontSize="xs" color="fg.muted">
                Billed as one prediction against this deployment.
              </Text>
            </Box>
          </SimpleGrid>
        </SectionCard>
      </Grid>

      <Grid gap="6">
        <SectionCard title="Endpoint">
          <Box p="5">
            <Flex align="center" gap="2">
              <Code size="sm" minW="0" flex="1" truncate>
                {deployment.endpoint}
              </Code>
              <CopyButton
                value={deployment.endpoint}
                label="Copy endpoint URL"
              />
            </Flex>
            <Box as="dl" mt="4" fontSize="13px">
              {(
                [
                  ['Method', 'POST'],
                  ['Auth', 'Bearer token'],
                  ['Rate limit', '600 req/min'],
                  ['Max payload', '10 MB'],
                  ['Region', deployment.region],
                ] as const
              ).map(([label, value]) => (
                <Flex
                  key={label}
                  justify="space-between"
                  gap="3"
                  py="2"
                  borderTopWidth="1px"
                  borderColor="border"
                  _first={{ borderTopWidth: '0' }}
                >
                  <Box as="dt" color="fg.muted">
                    {label}
                  </Box>
                  <Box as="dd" fontFamily="mono" fontWeight="medium">
                    {value}
                  </Box>
                </Flex>
              ))}
            </Box>
          </Box>
        </SectionCard>

        <SectionCard title="API key">
          <Box p="5">
            <Code size="sm" display="block" truncate>
              {freshKey ?? key?.masked_key}
            </Code>
            <Text mt="2.5" fontSize="xs" color="fg.muted">
              {freshKey
                ? 'Copy this key now. It will not be shown again.'
                : key &&
                  `Created ${relativeTimeLong(key.created_at)} · ${
                    key.last_used_at
                      ? `last used ${relativeTimeLong(key.last_used_at)}`
                      : 'never used'
                  }.`}
            </Text>
            <Button
              variant="outline"
              size="sm"
              mt="3"
              w="full"
              disabled={rotate.isPending}
              onClick={() =>
                rotate.mutate(undefined, {
                  onSuccess: () =>
                    toaster.create({
                      type: 'success',
                      title: 'Key rotated. The old key no longer works.',
                    }),
                })
              }
            >
              Rotate key
            </Button>
          </Box>
        </SectionCard>
      </Grid>
    </Grid>
  )
}
