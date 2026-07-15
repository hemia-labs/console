import { registerAs } from '@nestjs/config';
import { validateConfig, type SsoConfig } from '@hemia/auth';

const withoutTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

const env = (name: string): string | undefined =>
  process.env[name] || undefined;

// Cada URL OAuth puede fijarse por env; si falta, se deriva de SSO_ISSUER / HEMIA_ID_BASE_URL.
export default registerAs('sso', (): SsoConfig => {
  const issuer = withoutTrailingSlash(
    env('SSO_ISSUER') ??
      process.env.HEMIA_ID_BASE_URL ??
      'http://localhost:3000',
  );
  const accessApiUrl = withoutTrailingSlash(
    env('ACCESS_API_URL') ?? 'http://localhost:3019',
  );
  const productCode = env('PRODUCT_CODE') ?? 'console';

  return validateConfig({
    issuer,
    clientId: env('SSO_CLIENT_ID') ?? 'hemia-console',
    clientSecret: env('SSO_CLIENT_SECRET'),
    audience: env('SSO_AUDIENCE') ?? 'hemia-console',
    jwksUrl: env('SSO_JWKS_URL') ?? `${issuer}/.well-known/jwks.json`,
    authorizationUrl:
      env('SSO_AUTHORIZATION_URL') ?? `${issuer}/oauth/authorize`,
    tokenUrl: env('SSO_TOKEN_URL') ?? `${issuer}/oauth/token`,
    revocationUrl: env('SSO_REVOCATION_URL') ?? `${issuer}/oauth/revoke`,
    logoutUrl: env('SSO_LOGOUT_URL') ?? `${issuer}/oauth/logout`,
    redirectUri:
      env('SSO_REDIRECT_URI') ?? 'http://localhost:3001/auth/callback',
    frontendUrl: env('SSO_FRONTEND_URL') ?? 'http://localhost:3000',
    scope:
      env('SSO_SCOPE') ??
      `openid profile email offline_access ${productCode}.access`,
    cookieName: env('SSO_COOKIE_NAME') ?? `${productCode}_session`,
    sessionTtlSeconds: Number(env('SSO_SESSION_TTL_SECONDS') ?? 604800),
    cookieSecure:
      process.env.SSO_COOKIE_SECURE === 'true' ||
      process.env.NODE_ENV === 'production',
    access: {
      apiBaseUrl: accessApiUrl,
      jwksUrl:
        env('ACCESS_JWKS_URI') ?? `${accessApiUrl}/.well-known/jwks.json`,
      audience: env('ACCESS_AUDIENCE') ?? 'access-api',
    },
  });
});
