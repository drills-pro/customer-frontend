import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { ProjectMark } from '@/components/dashboard/project-ui'
import { startMethods } from './types'
import type { NewProjectDraft } from './use-new-project-draft'

export function StartMethodStep({
  draft,
  orgName,
}: {
  draft: NewProjectDraft
  orgName: string
}) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold">Start method</h2>
        <p className="mt-1 text-sm text-slate-500">
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
            <item.icon className="mt-0.5 size-5 shrink-0 text-indigo-600" />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{item.label}</span>
              <span className="block text-xs text-slate-500">
                {item.description}
              </span>
            </span>
            {draft.startMethod === item.id && (
              <span className="ml-auto text-indigo-600">●</span>
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
                    <span className="block text-xs text-slate-500">
                      {template.description}
                    </span>
                    <span className="mt-1 block text-[11px] font-medium text-slate-400">
                      {template.items.toLocaleString('en-US')} items ·{' '}
                      {template.size}
                    </span>
                  </span>
                  {draft.templateId === template.id && (
                    <span className="text-indigo-600">●</span>
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
                    <span className="block text-xs text-slate-500">
                      {candidate.task}
                    </span>
                  </span>
                  {draft.sourceProjectId === candidate.id && (
                    <span className="text-indigo-600">●</span>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <Empty className="min-h-40 border">
              <EmptyHeader>
                <EmptyTitle>No compatible projects to clone</EmptyTitle>
                <EmptyDescription>
                  There are no other {draft.task} projects in {orgName} yet.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
          <p className="mt-3 text-xs text-slate-400">
            Cloning copies project setup only — datasets, runs, models, and
            deployments are not duplicated.
          </p>
        </div>
      )}
    </section>
  )
}
