import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { useDashboardLayout } from '@/features/dashboard/context'
import { ProjectMark } from '@/features/projects/components/project-ui'
import { startMethods } from './types'
import type { NewProjectDraft } from './use-new-project-draft'

export function StartMethodStep({ draft }: { draft: NewProjectDraft }) {
  const orgName = useDashboardLayout().org.name
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold">Start method</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how this project&apos;s first dataset gets created.
        </p>
      </div>
      <div className="mt-5 grid gap-2.5">
        {startMethods.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => draft.selectStartMethod(item.id)}
            aria-pressed={draft.startMethod === item.id}
            className="w-full items-start justify-start gap-3"
          >
            <item.icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-muted-foreground">
                {item.description}
              </span>
            </span>
            {draft.startMethod === item.id && (
              <span className="ml-auto text-primary">●</span>
            )}
          </Button>
        ))}
      </div>

      {draft.startMethod === 'template' && (
        <div className="mt-5">
          {draft.templates.length ? (
            <div className="grid gap-2.5">
              {draft.templates.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="option"
                  onClick={() => draft.setTemplateId(template.id)}
                  aria-pressed={draft.templateId === template.id}
                  className="w-full justify-between gap-4"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">
                      {template.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {template.description}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-muted-foreground/80">
                      {template.items.toLocaleString('en-US')} items ·{' '}
                      {template.size}
                    </span>
                  </span>
                  {draft.templateId === template.id && (
                    <span className="text-primary">●</span>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <Empty className="min-h-40 border">
              <EmptyHeader>
                <EmptyTitle>No templates for this task yet</EmptyTitle>
                <EmptyDescription>
                  Choose a different task type or start by uploading your own
                  dataset instead.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      )}

      {draft.startMethod === 'clone' && (
        <div className="mt-5">
          {draft.cloneCandidates.length ? (
            <div className="grid gap-2.5">
              {draft.cloneCandidates.map((candidate) => (
                <Button
                  key={candidate.id}
                  type="button"
                  variant="option"
                  onClick={() => draft.setSourceProjectId(candidate.id)}
                  aria-pressed={draft.sourceProjectId === candidate.id}
                  className="w-full justify-start gap-3"
                >
                  <ProjectMark project={candidate} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                      {candidate.name}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {candidate.task}
                    </span>
                  </span>
                  {draft.sourceProjectId === candidate.id && (
                    <span className="text-primary">●</span>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <Empty className="min-h-40 border">
              <EmptyHeader>
                <EmptyTitle>No compatible projects to clone</EmptyTitle>
                <EmptyDescription>
                  There are no other {draft.taskLabel} projects in {orgName}{' '}
                  yet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          <p className="mt-3 text-xs text-muted-foreground/80">
            Cloning copies project setup only — datasets, runs, models, and
            deployments are not duplicated.
          </p>
        </div>
      )}
    </section>
  )
}
