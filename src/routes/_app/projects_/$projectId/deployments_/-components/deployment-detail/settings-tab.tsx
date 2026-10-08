import { Trash2, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCurrentDeployment } from './use-current-deployment'

const instanceTypes = ['a10g-1', 't4-1', 'cpu-4', 'edge-arm64']

export function SettingsTab() {
  const { deployment, model } = useCurrentDeployment()
  const modelLabel = model
    ? `${model.name} v${model.version}`
    : deployment.modelId

  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-3">
      <div className="grid min-w-0 gap-6 lg:col-span-2">
        <Card size="flush">
          <CardHeader className="border-b [--card-section:--spacing(3.5)]">
            <CardTitle>Deployment settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 p-5">
            <Field>
              <FieldLabel htmlFor="deployment-name">Deployment name</FieldLabel>
              <Input
                id="deployment-name"
                size="lg"
                defaultValue={deployment.name}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="deployment-model">Serving model</FieldLabel>
              <Select defaultValue="pinned">
                <SelectTrigger
                  id="deployment-model"
                  size="lg"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pinned">{modelLabel} (pinned)</SelectItem>
                  <SelectItem value="latest">
                    {model?.name ?? deployment.modelId} (always latest)
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                Pinning a version means promoting a new model will not change
                what this endpoint serves.
              </FieldDescription>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="deployment-min">Min replicas</FieldLabel>
                <Input
                  id="deployment-min"
                  type="number"
                  size="lg"
                  defaultValue={deployment.minReplicas}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="deployment-max">Max replicas</FieldLabel>
                <Input
                  id="deployment-max"
                  type="number"
                  size="lg"
                  defaultValue={deployment.maxReplicas}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="deployment-instance">
                Instance type
              </FieldLabel>
              <Select defaultValue={deployment.instanceName}>
                <SelectTrigger
                  id="deployment-instance"
                  size="lg"
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {instanceTypes.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
          <div className="flex justify-end border-t px-5 py-4">
            <Button
              size="lg"
              className="px-3.5"
              onClick={() =>
                toast.info(
                  'Saving deployment settings is not available in this demo.',
                )
              }
            >
              Save settings
            </Button>
          </div>
        </Card>

        <Card size="flush">
          <CardHeader className="border-b border-destructive/20 bg-destructive-muted/50 [--card-section:--spacing(3.5)]">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <TriangleAlert className="size-4" />
              Danger zone
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4 p-5">
            <div className="mr-auto min-w-0">
              <p className="text-[13px] font-medium">Delete this deployment</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                The endpoint stops answering immediately. The model itself is
                not deleted.
              </p>
            </div>
            <Button
              variant="destructive"
              size="lg"
              className="px-3.5"
              onClick={() =>
                toast.info(
                  'Deleting a deployment is not available in this demo.',
                )
              }
            >
              <Trash2 />
              Delete deployment
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card size="flush">
        <CardHeader className="border-b [--card-section:--spacing(3.5)]">
          <CardTitle>Deployment history</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {(
            [
              [`${modelLabel} promoted`, deployment.deployed, true],
              [
                `Scaled max replicas to ${deployment.maxReplicas}`,
                '2 weeks ago',
                false,
              ],
              ['Created', '5 weeks ago', false],
            ] as const
          ).map(([label, when, current]) => (
            <div key={label} className="flex gap-3 rounded-lg px-2 py-2.5">
              <span
                aria-hidden="true"
                className={`mt-1.5 size-1.5 shrink-0 rounded-full ${current ? 'bg-success' : 'bg-border'}`}
              />
              <div className="min-w-0">
                <p className="text-[13px]">{label}</p>
                <p className="text-xs text-muted-foreground">{when}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
