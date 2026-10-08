import { registerAs } from '@nestjs/config';

const withoutTrailingSlash = (value: string): string =>
  value.replace(/\/+$/, '');

const DEFAULT_SCOPES = [
  'organization.read',
  'organization.update',
  'organization.archive',
  'membership.read',
  'membership.invite',
  'membership.suspend',
  'membership.revoke',
  'role.read',
  'role.assign',
  'role.revoke',
  'product_access.read',
  'product_access.enable',
  'product_access.suspend',
  'product_access.disable',
].join(' ');

export default registerAs('accessAdmin', () => {
  const issuer = withoutTrailingSlash(
    process.env.SSO_ISSUER ??
      process.env.HEMIA_ID_BASE_URL ??
      'http://localhost:4000',
  );

  return {
    apiBaseUrl: withoutTrailingSlash(
      process.env.ACCESS_API_URL ?? 'http://localhost:3019',
    ),
    clientId: process.env.ACCESS_CLIENT_ID ?? 'console-access-admin',
    clientSecret: process.env.ACCESS_CLIENT_SECRET,
    scopes: process.env.ACCESS_SCOPES ?? DEFAULT_SCOPES,
    timeoutMs: Number(process.env.ACCESS_TIMEOUT_MS) || 5000,
    tokenUrl:
      process.env.ACCESS_TOKEN_URL ??
      process.env.SSO_TOKEN_URL ??
      `${issuer}/oauth/token`,
  };
});
