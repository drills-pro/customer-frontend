import { Avatar, Badge, Center } from '@chakra-ui/react'
import type { AvatarRootProps, CenterProps } from '@chakra-ui/react'
import type {
  OrgMember,
  OrgPlan,
  OrgRole,
  Organization,
} from '@/features/dashboard/data'

/** The organization's colored initial tile. Size it with `boxSize`. */
export function OrgMark({
  org,
  ...props
}: {
  org: Pick<Organization, 'initial' | 'color'>
} & CenterProps) {
  return (
    <Center
      aria-hidden="true"
      boxSize="8"
      flexShrink={0}
      rounded="l2"
      fontSize="sm"
      fontWeight="semibold"
      color="white"
      // The organization's own color, from the API.
      bg={org.color}
      {...props}
    >
      {org.initial}
    </Center>
  )
}

const planPalettes = {
  Free: { colorPalette: 'gray', variant: 'subtle' },
  Team: { colorPalette: 'info', variant: 'subtle' },
  Enterprise: { colorPalette: 'brand', variant: 'subtle' },
} as const

export function PlanBadge({ plan }: { plan: OrgPlan }) {
  return <Badge {...planPalettes[plan]}>{plan}</Badge>
}

const rolePalettes = {
  Owner: { colorPalette: 'brand', variant: 'subtle' },
  Admin: { colorPalette: 'success', variant: 'subtle' },
  Member: { colorPalette: 'gray', variant: 'subtle' },
  Viewer: { colorPalette: 'gray', variant: 'outline' },
} as const

export function RoleBadge({ role }: { role: OrgRole }) {
  return <Badge {...rolePalettes[role]}>{role}</Badge>
}

export function MemberAvatar({
  member,
  ...props
}: {
  member: Pick<OrgMember, 'initials' | 'color'>
} & AvatarRootProps) {
  return (
    <Avatar.Root
      boxSize="8"
      borderWidth="0"
      color="white"
      // The member's own color, from the API.
      bg={member.color}
      {...props}
    >
      <Avatar.Fallback fontSize="2xs" fontWeight="medium">
        {member.initials}
      </Avatar.Fallback>
    </Avatar.Root>
  )
}
