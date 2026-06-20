import { registerAs } from '@nestjs/config';
import type { SsoConfig } from '@hemia/auth';

const withoutTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

// Cada URL OAuth puede fijarse por env; si falta, se deriva de SSO_ISSUER / HEMIA_ID_BASE_URL.
export default registerAs('sso', (): SsoConfig => {
  const issuer = withoutTrailingSlash(
    process.env.SSO_ISSUER ??
      process.env.HEMIA_ID_BASE_URL ??
      'http://localhost:3000',
  );

  return {
    issuer,
    clientId: process.env.SSO_CLIENT_ID || 'hemia-console',
    clientSecret: process.env.SSO_CLIENT_SECRET || undefined,
    audience: process.env.SSO_AUDIENCE || 'hemia-console',
    jwksUrl: process.env.SSO_JWKS_URL ?? `${issuer}/.well-known/jwks.json`,
    authorizationUrl:
      process.env.SSO_AUTHORIZATION_URL ?? `${issuer}/oauth/authorize`,
    tokenUrl: process.env.SSO_TOKEN_URL ?? `${issuer}/oauth/token`,
    revocationUrl: process.env.SSO_REVOCATION_URL ?? `${issuer}/oauth/revoke`,
    logoutUrl: process.env.SSO_LOGOUT_URL ?? `${issuer}/oauth/logout`,
    redirectUri:
      process.env.SSO_REDIRECT_URI ?? 'http://localhost:3001/auth/callback',
    frontendUrl: process.env.SSO_FRONTEND_URL ?? 'http://localhost:3000',
    scope: process.env.SSO_SCOPE ?? 'openid profile email offline_access',
    cookieName: 'hemia_session',
    sessionTtlSeconds: 7 * 24 * 3600,
    cookieSecure: process.env.NODE_ENV === 'production',
  };
});
