import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { UserManager, type User } from 'oidc-client-ts';
import { cfg } from './config';

// Zitadel hosted login (code + PKCE): it owns the password, MFA, passkey and registration screens.
// Signup is the same redirect with prompt=create. The `:aud` scope puts the project id in the token's
// audience, which core-api requires.
const manager = new UserManager({
  authority: cfg.issuer,
  client_id: cfg.clientId,
  redirect_uri: `${location.origin}/auth/callback`,
  post_logout_redirect_uri: `${location.origin}/login`,
  response_type: 'code',
  scope: `openid profile email urn:zitadel:iam:org:project:id:${cfg.projectId}:aud`,
  automaticSilentRenew: false, // ponytail: tokens live minutes; a 401 sends the user back to login. Add offline_access + renew if that annoys.
});

interface AuthCtx {
  user: User | null;
  loading: boolean;
  signIn: (returnTo?: string) => void;
  signUp: (returnTo?: string) => void;
  signOut: () => void;
  /** Drop the local session without visiting Zitadel (expired or rejected token). */
  expire: () => void;
}
const Ctx = createContext<AuthCtx | null>(null);

let callback: Promise<User | undefined> | null = null; // StrictMode runs effects twice; the code is single-use.
export const finishLogin = () => (callback ??= manager.signinCallback());

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
      expire: () => void manager.removeUser(),
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
