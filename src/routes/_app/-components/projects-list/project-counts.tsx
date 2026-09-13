import type { Project } from '@/features/dashboard/data'

export function ProjectCounts({ project }: { project: Project }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span>
        <strong className="font-semibold text-foreground">
          {project.datasets}
        </strong>{' '}
        datasets
      </span>
      <span>
        <strong className="font-semibold text-foreground">
          {project.models}
        </strong>{' '}
        models
      </span>
      <span>
        <strong className="font-semibold text-foreground">
          {project.deployed}
        </strong>{' '}
        deployed
      </span>
    </div>
  )
}
