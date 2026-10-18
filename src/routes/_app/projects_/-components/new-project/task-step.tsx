import { FolderKanban } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { NewProjectDraft } from './use-new-project-draft'

export function TaskStep({ draft }: { draft: NewProjectDraft }) {
  return (
    <section>
      <div>
        <h2 className="text-lg font-semibold">Task type</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose what this project is trained to do.
        </p>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {draft.taskTypes.map((item) => (
          <Button
            key={item.id}
            type="button"
            variant="option"
            onClick={() => draft.selectTask(item.id)}
            aria-pressed={draft.task === item.id}
            className="flex-col items-stretch justify-start"
          >
            <div className="flex items-start justify-between">
              <FolderKanban className="size-5 text-primary" />
              {draft.task === item.id && (
                <span className="text-primary">●</span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium">{item.label}</p>
          </Button>
        ))}
      </div>
    </section>
  )
}
