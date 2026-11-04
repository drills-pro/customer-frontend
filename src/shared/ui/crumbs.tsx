import type { ComponentType } from 'react';
import { Skeleton } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** This route's label in the shell breadcrumb. It renders only while the route is matched, so it may read the route's params. */
    crumb?: ComponentType;
    /** Search the crumb just above this route's links with, so going up returns to the view this page was opened from (a tab). */
    parentSearch?: Record<string, string>;
  }
}

/** Stands in for a name that failed to load; the page itself shows the error. */
const UNKNOWN_NAME = '…';

/** A crumb with a fixed label, for routes that are not named after their data. */
export function textCrumb(key: string): ComponentType {
  return function TextCrumb() {
    const { t } = useTranslation();
    return t(key);
  };
}

/** A crumb named after loaded data: a placeholder while it loads. */
export function CrumbName({ name, pending }: { name: string | undefined; pending: boolean }) {
  if (name !== undefined) return name;
  return pending ? <Skeleton as="span" display="inline-block" h="4" w="24" /> : UNKNOWN_NAME;
}
