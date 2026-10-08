import { cn } from 'cn'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { Project, ProjectOverview } from '@/features/dashboard/data'

export function ProjectMark({
  project,
  className,
}: {
  project: Project
  className?: string
}) {
  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg text-white',
        className,
      )}
      style={{ backgroundColor: project.color }}
      aria-hidden="true"
    >
      <span className="size-2 rotate-45 rounded-[1px] bg-card" />
    </span>
  )
}

export function Collaborators({
  team,
  overflow = 2,
  className,
}: {
  team?: ProjectOverview['team']
  overflow?: number
  className?: string
}) {
  const people = team ?? [
    { name: 'Alex Rivera', initials: 'AR', color: '#8b5cf6' },
    { name: 'Priya Nair', initials: 'PN', color: '#d946ef' },
    { name: 'Sam Cole', initials: 'SC', color: '#6366f1' },
  ]

  return (
    <div
      className={cn('flex items-center -space-x-2', className)}
      aria-label={`${people.length + overflow} collaborators`}
    >
      {people.slice(0, 3).map((person) => (
        <Avatar key={person.name} className="size-7 border-2 border-card">
          <AvatarFallback
            className="text-[9px] text-white"
            style={{ backgroundColor: person.color }}
          >
            {person.initials}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <span className="relative flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
          +{overflow}
        </span>
      )}
    </div>
  )
}
