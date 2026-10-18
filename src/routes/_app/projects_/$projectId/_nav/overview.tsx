import * as React from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Check } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge, BadgeDot } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { useProjectDetail } from '@/features/dashboard/context'
import { useUpdateProject } from '@/features/projects/queries'
import { useInView } from '@/hooks/use-in-view'
import { unavailable } from '@/lib/unavailable'
import { FactList, serializeReadme } from '../-components/project-overview'
import { ReadmeCard } from '../-components/readme-editor'
import { ResourceUsageCard } from '../-components/resource-usage-card'

export const Route = createFileRoute(
  '/_app/projects_/$projectId/_nav/overview',
)({
  component: ProjectOverviewRoute,
})

function ProjectOverviewRoute() {
  const { project, details, organization } = useProjectDetail()
  const { ref: usageCardRef, inView: usageChartsInView } =
    useInView<HTMLDivElement>()
  const bestModel = details.bestModel
  const updateProject = useUpdateProject(project.id)

  const pipeline = [
    {
      title: 'Data',
      description: `${project.datasets} datasets ready`,
    },
    {
      title: 'Train',
      description: `${details.pipeline.runs} runs · ${details.pipeline.running} running`,
    },
    {
      title: 'Evaluate',
      description: bestModel
        ? `Best ${bestModel.accuracy.toFixed(1)}% acc`
        : 'No evaluations yet',
    },
    {
      title: 'Deploy',
      description: `${project.deployed} live endpoints`,
    },
  ]

  return (
    <>
      <Card size="flush" className="mt-6">
        <CardHeader className="pt-5 pb-4">
          <CardTitle>Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 pb-5 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
          {pipeline.map((stage, index) => {
            const completed = details.pipeline.completeThrough > index + 1
            return (
              <React.Fragment key={stage.title}>
                <Item
                  asChild
                  className={`min-w-0 flex-nowrap p-3 ${
                    completed
                      ? 'border-success/30 bg-success-muted/50 hover:bg-success-muted/50'
                      : 'border-border bg-card hover:bg-card'
                  } hover:border-primary/40`}
                >
                  <Button
                    variant="outline"
                    className="h-auto justify-start whitespace-normal"
                    onClick={() => unavailable(stage.title)}
                  >
                    <ItemMedia>
                      <span
                        className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold ${
                          completed
                            ? 'bg-success text-background'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {completed ? <Check className="size-4" /> : index + 1}
                      </span>
                    </ItemMedia>
                    <ItemContent className="min-w-0">
                      <ItemTitle>{stage.title}</ItemTitle>
                      <ItemDescription className="truncate">
                        {stage.description}
                      </ItemDescription>
                    </ItemContent>
                  </Button>
                </Item>
                {index < pipeline.length - 1 && (
                  <ArrowRight className="hidden size-4 text-muted-foreground/60 lg:block" />
                )}
              </React.Fragment>
            )
          })}
        </CardContent>
      </Card>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="grid min-w-0 gap-6">
          {bestModel ? (
            <Card size="flush">
              <CardHeader className="border-b">
                <CardTitle>Best model</CardTitle>
                <CardAction>
                  <Badge variant="success">
                    <BadgeDot />
                    Completed
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
                <div className="min-w-44">
                  <h2>{bestModel.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    From run {bestModel.run} · {bestModel.updated}
                  </p>
                </div>
                <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    ['Accuracy', `${bestModel.accuracy.toFixed(1)}%`],
                    ['F1', bestModel.f1.toFixed(3)],
                    ['Latency', bestModel.latency],
                    ['Size', bestModel.size],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <small className="block">{label}</small>
                      <strong className="text-lg font-semibold">{value}</strong>
                    </div>
                  ))}
                </div>
                <Button asChild>
                  <Link
                    to="/projects/$projectId/models"
                    params={{ projectId: project.id }}
                  >
                    Deploy →
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card size="flush">
              <CardContent className="flex min-h-40 flex-col items-center justify-center p-6 text-center">
                <h2 className="font-semibold">No trained models yet</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a ready dataset, then start this project's first training
                  run.
                </p>
                <Button asChild className="mt-4">
                  <Link
                    to="/projects/$projectId/training/new"
                    params={{ projectId: project.id }}
                  >
                    New Training
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <ReadmeCard
            readme={
              details.readme && bestModel ? (
                <div className="grid gap-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success" className="font-mono">
                      status: production
                    </Badge>
                    <Badge variant="accent" className="font-mono">
                      pytorch 2.4
                    </Badge>
                    <Badge variant="warning" className="font-mono">
                      acc {bestModel.accuracy.toFixed(1)}%
                    </Badge>
                    <Badge className="border-0 bg-info-muted font-mono text-info">
                      {details.region}
                    </Badge>
                  </div>

                  <section>
                    <h3 className="border-b pb-2 font-semibold">About</h3>
                    <p className="pt-2 text-muted-foreground">
                      {details.readme.about}
                    </p>
                  </section>

                  <section>
                    <h3 className="border-b pb-2 font-semibold">Model</h3>
                    <dl className="divide-y text-sm">
                      {[
                        ['Architecture', details.readme.architecture],
                        [
                          'Accuracy / F1',
                          `${bestModel.accuracy.toFixed(1)}% / ${bestModel.f1.toFixed(3)}`,
                        ],
                        ['Latency', `${bestModel.latency} (p50, GPU)`],
                        ['Size', bestModel.size],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="grid grid-cols-2 gap-4 py-2"
                        >
                          <dt className="font-medium">{label}</dt>
                          <dd className="text-muted-foreground">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>

                  <section>
                    <h3 className="border-b pb-2 font-semibold">Quickstart</h3>
                    <p className="py-2 text-muted-foreground">
                      Call the live endpoint with a base64-encoded shelf image:
                    </p>
                    <pre className="overflow-x-auto rounded-xl bg-terminal p-4 text-xs leading-5 text-terminal-foreground">
                      <code>{details.readme.quickstart}</code>
                    </pre>
                  </section>

                  <section>
                    <h3 className="border-b pb-2 font-semibold">Notes</h3>
                    <ul className="grid gap-1 pt-2 text-muted-foreground">
                      {details.readme.notes.map((note) => (
                        <li key={note.label}>
                          <strong className="font-semibold text-foreground">
                            {note.label}:
                          </strong>{' '}
                          {note.text}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : undefined
            }
            initialMarkdown={
              details.readme && bestModel
                ? serializeReadme(details.readme, bestModel, details.region)
                : undefined
            }
            markdown={details.readmeMarkdown}
            onSave={(markdown) =>
              updateProject.mutate({ readme_markdown: markdown })
            }
          />
        </div>

        <aside className="grid min-w-0 gap-6">
          <Card size="lg">
            <CardHeader>
              <CardTitle>Project info</CardTitle>
            </CardHeader>
            <CardContent>
              <FactList
                items={[
                  ['Created', details.created],
                  ['Owner', organization.name],
                  ['Task', project.task],
                  ['Framework', details.framework],
                  ['Region', details.region],
                  ['Visibility', details.visibility],
                ]}
              />
            </CardContent>
          </Card>

          <ResourceUsageCard ref={usageCardRef} inView={usageChartsInView} />

          <Card size="lg">
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {details.team.map((member) => (
                <Item key={member.name} className="flex-nowrap border-0 p-0">
                  <ItemMedia>
                    <Avatar className="size-9">
                      <AvatarFallback
                        className="text-xs text-white"
                        style={{ backgroundColor: member.color }}
                      >
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                  </ItemMedia>

                  <ItemContent className="min-w-0">
                    <ItemTitle>{member.name}</ItemTitle>
                    <ItemDescription>{member.role}</ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  )
}
