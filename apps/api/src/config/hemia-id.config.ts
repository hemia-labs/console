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
  external: {
    clientId: process.env.HEMIA_ID_EXTERNAL_CLIENT_ID,
    clientSecret: process.env.HEMIA_ID_EXTERNAL_CLIENT_SECRET,
    scopes: process.env.HEMIA_ID_EXTERNAL_SCOPES,
    tokenUrl: withLeadingSlash(
      process.env.HEMIA_ID_EXTERNAL_TOKEN_URL ?? '/oauth/token',
    ),
  },
}));
