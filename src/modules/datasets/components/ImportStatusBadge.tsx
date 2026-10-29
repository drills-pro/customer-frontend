import { Badge } from '@chakra-ui/react';
import { Check, Clock, Close, Eye, Hourglass, Loader, Trash, Upload, WarningDiamond } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';
import { ImportStatus } from '@/modules/datasets/constants';
import { STATUS_UI } from '@/modules/datasets/status';
import type { PixelIcon } from '@/shared/ui/icons';

const ICONS: Record<ImportStatus, PixelIcon> = {
  [ImportStatus.AwaitingUpload]: Upload,
  [ImportStatus.Queued]: Clock,
  [ImportStatus.Running]: Loader,
  [ImportStatus.AwaitingReview]: Eye,
  [ImportStatus.Committing]: Loader,
  [ImportStatus.Succeeded]: Check,
  [ImportStatus.Failed]: WarningDiamond,
  [ImportStatus.Cancelled]: Close,
  [ImportStatus.Expired]: Hourglass,
  [ImportStatus.Discarded]: Trash,
};

/** Status always shows a glyph and a word. */
export function ImportStatusBadge({ status }: { status: ImportStatus }) {
  const { t } = useTranslation();
  const Icon = ICONS[status];
  return (
    <Badge colorPalette={STATUS_UI[status].palette} variant="subtle" gap="1" data-testid="import-status" data-status={status}>
      <Icon width={12} height={12} />
      {t(`datasets.status.${status}`)}
    </Badge>
  );
}
