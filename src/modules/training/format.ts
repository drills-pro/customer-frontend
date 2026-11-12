import { useTranslation } from 'react-i18next';
import { MS_PER_SECOND } from '@/modules/training/constants';

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

/** Whole days, then the hours and minutes left over, from milliseconds; a negative span (clock skew) reads as none. */
export function elapsedParts(ms: number): { days: number; hours: number; minutes: number } {
  const minutes = Math.floor(Math.max(0, ms) / MS_PER_SECOND / SECONDS_PER_MINUTE);
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  return { days: Math.floor(hours / HOURS_PER_DAY), hours: hours % HOURS_PER_DAY, minutes: minutes % MINUTES_PER_HOUR };
}

/** How long a run has taken: from its start to its end, or to now while it has not ended. */
export function useDuration() {
  const { t } = useTranslation();
  return (from: string, to: string | null): string => {
    const { days, hours, minutes } = elapsedParts((to ? Date.parse(to) : Date.now()) - Date.parse(from));
    if (days > 0) return t('training.duration.days', { days, hours });
    if (hours > 0) return t('training.duration.hours', { hours, minutes });
    return minutes > 0 ? t('training.duration.minutes', { count: minutes }) : t('training.duration.underMinute');
  };
}
