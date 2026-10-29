import { Badge } from '@chakra-ui/react';
import { Archive, CheckboxOn, Trash } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import type { ProjectStatus } from '@/modules/projects/api';
import type { PixelIcon } from '@/shared/ui/icons';

/** Status always shows a glyph and a word. */
const STATUS_LOOK: Record<ProjectStatus, { icon: PixelIcon; palette: string }> = {
  active: { icon: CheckboxOn, palette: 'success' },
  archived: { icon: Archive, palette: 'gray' },
  pending_delete: { icon: Trash, palette: 'danger' },
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation();
  const look = STATUS_LOOK[status];
  return (
    <Badge colorPalette={look.palette} variant="subtle" gap="1" data-testid="project-status" data-status={status}>
      <look.icon width={12} height={12} />
      {t(`projects.status.${status}`)}
    </Badge>
  );
}
