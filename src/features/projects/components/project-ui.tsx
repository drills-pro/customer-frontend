import { Avatar, Box, Center, Flex } from '@chakra-ui/react'
import type { CenterProps, FlexProps } from '@chakra-ui/react'

import type { Project, ProjectOverview } from '@/features/dashboard/data'

/** The project's colored tile. Size it with `boxSize`. */
export function ProjectMark({
  project,
  ...props
}: { project: Project } & CenterProps) {
  return (
    <Center
      boxSize="9"
      flexShrink={0}
      rounded="l2"
      // The project's own color, from the API.
      bg={project.color}
      aria-hidden="true"
      {...props}
    >
      <Box boxSize="2" rotate="45deg" rounded="1px" bg="surface-raised" />
    </Center>
  )
}

type Person = Pick<
  ProjectOverview['team'][number],
  'name' | 'initials' | 'color'
>

// Placeholder collaborators until the API returns a project's team.
const demoTeam: Person[] = [
  { name: 'Alex Rivera', initials: 'AR', color: '#8b5cf6' }, // lint-ok
  { name: 'Priya Nair', initials: 'PN', color: '#d946ef' }, // lint-ok
  { name: 'Sam Cole', initials: 'SC', color: '#6366f1' }, // lint-ok
]

export function Collaborators({
  team,
  overflow = 2,
  ...props
}: {
  team?: Person[]
  overflow?: number
} & FlexProps) {
  const people = team ?? demoTeam

  return (
    <Flex
      align="center"
      css={{ '& > * + *': { marginInlineStart: '-2' } }}
      aria-label={`${people.length + overflow} collaborators`}
      {...props}
    >
      {people.slice(0, 3).map((person) => (
        <Avatar.Root
          key={person.name}
          boxSize="7"
          rounded="full"
          borderWidth="2px"
          borderColor="surface-raised"
          color="white"
          // The person's own color, from the API.
          bg={person.color}
        >
          <Avatar.Fallback fontSize="9px">{person.initials}</Avatar.Fallback>
        </Avatar.Root>
      ))}
      {overflow > 0 && (
        <Center
          position="relative"
          boxSize="7"
          rounded="full"
          borderWidth="2px"
          borderColor="surface-raised"
          bg="bg.muted"
          fontSize="10px"
          fontWeight="medium"
          color="fg.muted"
        >
          +{overflow}
        </Center>
      )}
    </Flex>
  )
}
