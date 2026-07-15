import { registerAs } from '@nestjs/config';

const withLeadingSlash = (value: string): string =>
  value.startsWith('/') ? value : `/${value}`;

const withoutTrailingSlash = (value: string): string =>
  value.endsWith('/') ? value.slice(0, -1) : value;

export default registerAs('hemiaId', () => ({
  baseUrl: withoutTrailingSlash(
    process.env.HEMIA_ID_BASE_URL ?? 'http://localhost:3000',
  ),
  adminPrefix: withLeadingSlash(process.env.HEMIA_ID_ADMIN_PREFIX ?? '/api/v1'),
  timeoutMs: Number(process.env.HEMIA_ID_TIMEOUT_MS) || 5000,
  service: {
    clientId: 'identity-admin-service',
    clientSecret: process.env.SSO_IDENTITY_ADMIN_SERVICE_SECRET,
    scopes:
      'identity.oauth_clients.read identity.oauth_clients.create identity.oauth_clients.update identity.oauth_clients.delete',
    tokenUrl: '/oauth/token',
  },
}));
