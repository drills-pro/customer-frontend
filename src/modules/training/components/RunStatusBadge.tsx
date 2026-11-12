import { Badge } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { isStatus, statusUi } from '@/modules/training/status';

/** Status always shows a glyph and a word. */
export function RunStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const ui = statusUi(status);
  return (
    <Badge colorPalette={ui.palette} variant="subtle" gap="1" data-testid="training-status" data-status={status}>
      <ui.icon width={12} height={12} />
      {t(isStatus(status) ? `training.status.${status}` : 'training.status.unknown')}
    </Badge>
  );
}
