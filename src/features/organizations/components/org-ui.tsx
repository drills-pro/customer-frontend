import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from 'cn'
import type {
  OrgMember,
  OrgPlan,
  OrgRole,
  Organization,
} from '@/features/dashboard/data'

/** The organization's colored initial tile. Size it with `className`. */
export function OrgMark({
  org,
  className,
}: {
  org: Pick<Organization, 'initial' | 'color'>
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white',
        className,
      )}
      style={{ backgroundColor: org.color }}
    >
      {org.initial}
    </span>
  )
}

const planVariants = {
  Free: 'neutral',
  Team: 'info',
  Enterprise: 'accent',
} as const

export function PlanBadge({ plan }: { plan: OrgPlan }) {
  return <Badge variant={planVariants[plan]}>{plan}</Badge>
}

const roleVariants = {
  Owner: 'accent',
  Admin: 'success',
  Member: 'neutral',
  Viewer: 'outline',
} as const

export function RoleBadge({ role }: { role: OrgRole }) {
  return <Badge variant={roleVariants[role]}>{role}</Badge>
}

export function MemberAvatar({
  member,
  className,
}: {
  member: Pick<OrgMember, 'initials' | 'color'>
  className?: string
}) {
  return (
    <Avatar className={cn('size-8', className)}>
      <AvatarFallback
        className="text-[11px] font-medium text-white"
        style={{ backgroundColor: member.color }}
      >
        {member.initials}
      </AvatarFallback>
    </Avatar>
  )
}
