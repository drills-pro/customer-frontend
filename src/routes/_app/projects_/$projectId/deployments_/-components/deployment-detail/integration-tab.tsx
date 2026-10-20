import * as React from 'react'
import { ImageUp, Play } from 'lucide-react'
import { toaster } from '@/components/toaster'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CopyButton } from '@/components/shared/copy-button'
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
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-3">
      <div className="grid min-w-0 gap-6 lg:col-span-2">
        <Card size="flush">
          <CardHeader className="flex-row items-center border-b [--card-section:--spacing(2.5)]">
            <Tabs
              value={language}
              onValueChange={(value) => setLanguage(value as Language)}
              className="mr-auto"
            >
              <TabsList aria-label="Code language">
                {languages.map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {item}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <CopyButton value={code} label={`Copy ${language} snippet`} />
          </CardHeader>
          <CardContent className="p-0">
            <pre className="overflow-x-auto bg-terminal p-5 text-xs leading-relaxed text-terminal-foreground">
              {code}
            </pre>
          </CardContent>
        </Card>

        <Card size="flush">
          <CardHeader className="flex-row items-center border-b [--card-section:--spacing(3.5)]">
            <CardTitle className="mr-auto">Send a test request</CardTitle>
            <Badge variant="neutral">Example result</Badge>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 sm:grid-cols-2">
            <div>
              <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-5 text-center">
                <div className="flex size-9 items-center justify-center rounded-lg bg-card text-muted-foreground ring-1 ring-border">
                  <ImageUp className="size-4" />
                </div>
                <p className="text-[13px] font-medium">Drop an image here</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG up to 10 MB
                </p>
              </div>
              <Button
                size="lg"
                className="mt-3 w-full"
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
            </div>
            <div>
              <div className="flex items-center justify-between gap-3 rounded-lg bg-success-muted px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium tracking-widest text-success uppercase">
                    200 OK
                  </p>
                  <p className="truncate font-mono text-[15px] font-semibold text-success">
                    beverages_cola_330ml
                  </p>
                </div>
                <p className="shrink-0 text-2xl font-semibold tabular-nums text-success">
                  96.4%
                </p>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-terminal p-3.5 text-[11px] leading-relaxed text-terminal-foreground">
                {`{
  "label": "beverages_cola_330ml",
  "confidence": 0.964,
  "latency_ms": ${Number.parseFloat(deployment.latencyP95) || 140},
  "model": "${modelLabel}"
}`}
              </pre>
              <p className="mt-2 text-xs text-muted-foreground">
                Billed as one prediction against this deployment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card size="flush">
          <CardHeader className="border-b [--card-section:--spacing(3.5)]">
            <CardTitle>Endpoint</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">
                {deployment.endpoint}
              </code>
              <CopyButton
                value={deployment.endpoint}
                label="Copy endpoint URL"
              />
            </div>
            <dl className="mt-4 divide-y text-[13px]">
              {(
                [
                  ['Method', 'POST'],
                  ['Auth', 'Bearer token'],
                  ['Rate limit', '600 req/min'],
                  ['Max payload', '10 MB'],
                  ['Region', deployment.region],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3 py-2">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="font-mono font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card size="flush">
          <CardHeader className="border-b [--card-section:--spacing(3.5)]">
            <CardTitle>API key</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <code className="block truncate rounded bg-muted px-2 py-1.5 text-xs">
              {freshKey ?? key?.masked_key}
            </code>
            <p className="mt-2.5 text-xs text-muted-foreground">
              {freshKey
                ? 'Copy this key now. It will not be shown again.'
                : key &&
                  `Created ${relativeTimeLong(key.created_at)} · ${
                    key.last_used_at
                      ? `last used ${relativeTimeLong(key.last_used_at)}`
                      : 'never used'
                  }.`}
            </p>
            <Button
              variant="outline"
              className="mt-3 w-full"
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
