import { UserManager, type User } from 'oidc-client-ts';
import { cfg } from '@/config';

// Zitadel hosted login (code + PKCE): it owns the password, MFA, passkey and registration screens.
// Signup is the same redirect with prompt=create. The `:aud` scope puts the project id in the token's
// audience, which core-api requires.
export const manager = new UserManager({
  authority: cfg.issuer,
  client_id: cfg.clientId,
  redirect_uri: `${location.origin}/auth/callback`,
  post_logout_redirect_uri: `${location.origin}/login`,
  response_type: 'code',
  scope: `openid profile email urn:zitadel:iam:org:project:id:${cfg.projectId}:aud`,
  automaticSilentRenew: false, // ponytail: tokens live minutes; a 401 sends the user back to login. Add offline_access + renew if that annoys.
});

let callback: Promise<User | undefined> | null = null; // StrictMode runs effects twice; the code is single-use.
export const finishLogin = () => (callback ??= manager.signinCallback());

/** The access token of a live session, or null. Route guards and the API client read it outside React. */
export async function getToken() {
  const u = await manager.getUser();
  return u && !u.expired ? u.access_token : null;
}
