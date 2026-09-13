import { FolderKanban } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { projectTaskTypes } from '@/features/dashboard/data'
import type { NewProjectDraft } from './use-new-project-draft'

export function TaskStep({ draft }: { draft: NewProjectDraft }) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold">Task type</h2>
        <p className="mt-1 text-sm text-slate-500">
          Choose what this project is trained to do.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {projectTaskTypes.map((item) => (
          <Button
            key={item}
            type="button"
            variant="option"
            onClick={() => draft.selectTask(item)}
            aria-pressed={draft.task === item}
            className="flex-col items-stretch justify-start"
          >
            <div className="flex items-start justify-between">
              <FolderKanban className="size-5 text-indigo-600" />
              {draft.task === item && (
                <span className="text-indigo-600">●</span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium">{item}</p>
          </Button>
        ))}
      </div>
    </section>
  )
}
