import { Center } from '@chakra-ui/react';
import { Briefcase } from 'pixelarticons/react';
import type { ProjectSummary } from '@/modules/projects/api';
import { TASK_ICONS } from '@/modules/projects/constants';

/** The project's tile: the icon of what it trains for. */
export function ProjectMark({ taskType }: { taskType: ProjectSummary['task_type'] }) {
  const Icon = taskType in TASK_ICONS ? TASK_ICONS[taskType as keyof typeof TASK_ICONS] : Briefcase;
  return (
    <Center boxSize="9" flexShrink={0} borderRadius="l2" bg="brand.subtle" color="brand.fg" aria-hidden="true">
      <Icon width={18} height={18} />
    </Center>
  );
}
