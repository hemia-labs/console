import ssoConfig from 'src/config/sso.config';
import hemiaIdConfig from 'src/config/hemia-id.config';
import { envVarsSchema } from 'src/config/env.validation';

describe('Console SSO configuration', () => {
  const environment = process.env;
  beforeEach(() => {
    process.env = { NODE_ENV: 'test' };
  });
  afterEach(() => {
    process.env = environment;
  });

  it('uses the registered development client and endpoints', () => {
    expect(ssoConfig()).toMatchObject({
      issuer: 'http://localhost:4000',
      clientId: 'console',
      audience: 'console-api',
      redirectUri: 'http://localhost:3016/auth/callback',
      frontendUrl: 'http://localhost:5176',
      cookieName: 'console_session',
      requireDistributedRefreshLock: true,
    });
    expect(hemiaIdConfig().service.clientId).toBe('console-identity-admin');
  });

  it.each([
    ['openid profile email console.access', true],
    ['openid\tconsole.access', true],
    ['openid profile email', false],
    ['console.access-extra', false],
    ['console.access console.disabled', false],
  ])('requires the exact console.access scope: %s', (scope, allowed) => {
    expect(ssoConfig().authorize?.({ scope })).toBe(allowed);
  });

  it('requires each dedicated credential in production before boot', () => {
    const { error } = envVarsSchema.validate(
      {
        NODE_ENV: 'production',
        DB_HOST: 'db',
        DB_USERNAME: 'console',
        DB_PASSWORD: 'dummy',
        DB_DATABASE: 'console',
        SSO_CLIENT_ID: 'console',
        SSO_AUDIENCE: 'console-api',
      },
      { abortEarly: false },
    );
    expect(error?.details.map((detail) => detail.path[0])).toEqual(
      expect.arrayContaining([
        'SSO_CLIENT_SECRET',
        'IDENTITY_ADMIN_CLIENT_SECRET',
        'ACCESS_CLIENT_SECRET',
      ]),
    );
  });

  it('does not reuse the old administrative secret', () => {
    process.env.SSO_IDENTITY_ADMIN_SERVICE_SECRET = 'old-secret';
    expect(hemiaIdConfig().service.clientSecret).toBeUndefined();
  });
});
