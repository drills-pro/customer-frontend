import { Link } from '@tanstack/react-router'
import {
  Building2,
  Check,
  ChevronDown,
  Plus,
  Settings,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { OrgMark } from '@/features/organizations/components/org-ui'
import { plural } from '@/features/organizations/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Organization } from '@/features/dashboard/data'

export type OrgSwitcherEntry = {
  org: Organization
  projects: number
  members: number
}

const itemClass = 'gap-2.5 px-2.5 py-2 [&_svg]:text-muted-foreground'

export function OrgSwitcher({
  org,
  entries,
  onSwitchOrganization,
  onCreateOrganization,
}: {
  org: Organization
  entries: OrgSwitcherEntry[]
  onSwitchOrganization: (orgId: string) => void
  onCreateOrganization: () => void
}) {
  const links: Array<{
    label: string
    icon: LucideIcon
    to:
      | '/organizations'
      | '/organizations/$orgId/members'
      | '/organizations/$orgId/settings'
  }> = [
    { label: 'View all organizations', icon: Building2, to: '/organizations' },
    {
      label: 'Manage members',
      icon: Users,
      to: '/organizations/$orgId/members',
    },
    {
      label: 'Organization settings',
      icon: Settings,
      to: '/organizations/$orgId/settings',
    },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          aria-label={`Current organization: ${org.name}`}
          className="gap-2"
        >
          <OrgMark org={org} className="size-6 rounded-md text-xs" />
          <span className="hidden max-w-40 truncate sm:inline">{org.name}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-0">
        <DropdownMenuLabel className="px-4 pt-3 pb-1 text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">
          Switch organization
        </DropdownMenuLabel>
        <DropdownMenuGroup className="max-h-80 overflow-y-auto p-1.5">
          {entries.map((entry) => {
            const current = entry.org.id === org.id
            return (
              <DropdownMenuItem
                key={entry.org.id}
                onSelect={() => onSwitchOrganization(entry.org.id)}
                aria-current={current || undefined}
                className="gap-3 px-2.5 py-2 aria-[current]:bg-primary-muted/70"
              >
                <OrgMark org={entry.org} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {entry.org.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {entry.org.plan} plan · {plural(entry.projects, 'project')}{' '}
                    · {plural(entry.members, 'member')}
                  </span>
                </span>
                {current && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-0 my-0" />
        <DropdownMenuGroup className="p-1.5">
          {links.map((link) => (
            <DropdownMenuItem key={link.to} asChild className={itemClass}>
              <Link to={link.to} params={{ orgId: org.id }}>
                <link.icon />
                {link.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="mx-0 my-0" />
        <DropdownMenuGroup className="p-1.5">
          <DropdownMenuItem
            className="gap-2.5 px-2.5 py-2 font-medium text-primary focus:text-primary [&_svg]:text-primary"
            onSelect={onCreateOrganization}
          >
            <Plus />
            Create organization
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
