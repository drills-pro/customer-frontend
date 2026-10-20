import * as React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Trash2, TriangleAlert } from 'lucide-react'
import { toaster } from '@/components/toaster'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import { useComputeOptions } from '@/features/catalog/queries'
import {
  useDeleteDeployment,
  useUpdateDeployment,
} from '@/features/deployments/queries'
import { useCurrentDeployment } from './use-current-deployment'

export function SettingsTab() {
  const { project, deployment, model } = useCurrentDeployment()
  const navigate = useNavigate()
  const update = useUpdateDeployment(project.id, deployment.id)
  const remove = useDeleteDeployment(project.id, deployment.id)
  // The current type stays selectable even if it is no longer offered.
  const instanceTypes = [
    ...new Set([
      deployment.instanceName,
      ...(useComputeOptions('serving').data ?? []).map((item) => item.id),
    ]),
  ]
  const [values, setValues] = React.useState({
    name: deployment.name,
    serving: deployment.serving,
    minReplicas: String(deployment.minReplicas),
    maxReplicas: String(deployment.maxReplicas),
    instanceType: deployment.instanceName,
  })
  const set = (changes: Partial<typeof values>) =>
    setValues((current) => ({ ...current, ...changes }))

  const modelLabel = model
    ? `${model.name} v${model.version}`
    : deployment.modelId

  function save() {
    update.mutate(
      {
        name: values.name,
        serving: values.serving,
        min_replicas: Number(values.minReplicas),
        max_replicas: Number(values.maxReplicas),
        instance_type: values.instanceType,
      },
      {
        onSuccess: () =>
          toaster.create({
            type: 'success',
            title: 'Deployment settings saved.',
          }),
      },
    )
  }

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
                value={values.name}
                onChange={(event) => set({ name: event.target.value })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="deployment-model">Serving model</FieldLabel>
              <Select
                value={values.serving}
                onValueChange={(value) =>
                  set({ serving: value as typeof values.serving })
                }
              >
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
                  min={0}
                  value={values.minReplicas}
                  onChange={(event) => set({ minReplicas: event.target.value })}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="deployment-max">Max replicas</FieldLabel>
                <Input
                  id="deployment-max"
                  type="number"
                  size="lg"
                  min={1}
                  value={values.maxReplicas}
                  onChange={(event) => set({ maxReplicas: event.target.value })}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="deployment-instance">
                Instance type
              </FieldLabel>
              <Select
                value={values.instanceType}
                onValueChange={(value) => set({ instanceType: value })}
              >
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
              disabled={update.isPending}
              onClick={save}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="lg" className="px-3.5">
                  <Trash2 />
                  Delete deployment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {deployment.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The endpoint stops answering immediately. This cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={remove.isPending}
                    onClick={() =>
                      // Leave the page before its deployment disappears.
                      // That unmounts this tab, so the result is read from the
                      // promise; a failure is reported by the global handler.
                      void navigate({
                        to: '/projects/$projectId/deployments',
                        params: { projectId: project.id },
                      })
                        .then(() => remove.mutateAsync())
                        .then(() =>
                          toaster.create({
                            type: 'success',
                            title: `${deployment.name} was deleted.`,
                          }),
                        )
                        .catch(() => undefined)
                    }
                  >
                    Delete deployment
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
