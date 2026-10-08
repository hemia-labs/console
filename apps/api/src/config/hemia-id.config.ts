import { registerAs } from '@nestjs/config';

export default registerAs('hemiaId', () => ({
  baseUrl: (process.env.HEMIA_ID_BASE_URL ?? 'http://localhost:4000').replace(
    /\/+$/,
    '',
  ),
  adminPrefix: process.env.HEMIA_ID_ADMIN_PREFIX ?? '/api/v1',
  timeoutMs: Number(process.env.HEMIA_ID_TIMEOUT_MS) || 5000,
  service: {
    clientId: 'console-identity-admin',
    clientSecret: process.env.IDENTITY_ADMIN_CLIENT_SECRET,
    scopes: [
      'identity.users.read',
      'identity.users.create',
      'identity.users.update',
      'identity.users.lock',
      'identity.users.unlock',
      'identity.users.delete',
      'identity.oauth_clients.read',
      'identity.oauth_clients.create',
      'identity.oauth_clients.update',
      'identity.oauth_clients.delete',
    ].join(' '),
    tokenUrl: '/oauth/token',
  },
}));
