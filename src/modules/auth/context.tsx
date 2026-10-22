import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'oidc-client-ts';
import { manager } from '@/shared/auth/manager';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (returnTo?: string) => void;
  signUp: (returnTo?: string) => void;
  signOut: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const onLoaded = (u: User) => setUser(u);
    const onGone = () => setUser(null);
    manager.events.addUserLoaded(onLoaded);
    manager.events.addUserUnloaded(onGone);
    manager
      .getUser()
      .then((u) => setUser(u && !u.expired ? u : null))
      .finally(() => setLoading(false));
    return () => {
      manager.events.removeUserLoaded(onLoaded);
      manager.events.removeUserUnloaded(onGone);
    };
  }, []);

  const value = useMemo<AuthCtx>(
    () => ({
      user,
      loading,
      signIn: (returnTo = '/') => void manager.signinRedirect({ state: returnTo }),
      signUp: (returnTo = '/') => void manager.signinRedirect({ state: returnTo, extraQueryParams: { prompt: 'create' } }),
      signOut: () => void manager.signoutRedirect({ id_token_hint: user?.id_token }),
    }),
    [user, loading],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
