import { useSyncExternalStore } from 'react';

// Four routes (/, /login, /signup, /auth/callback) do not need a router library.
const subscribe = (cb: () => void) => { addEventListener('popstate', cb); return () => removeEventListener('popstate', cb); };
export const usePath = () => useSyncExternalStore(subscribe, () => location.pathname);
export function navigate(to: string) {
  history.pushState(null, '', to);
  dispatchEvent(new PopStateEvent('popstate'));
}
