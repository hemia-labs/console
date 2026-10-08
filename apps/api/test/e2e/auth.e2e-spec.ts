import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { SsoCore, type SsoConfig, type Session } from '@hemia/auth';
import { ConsoleSsoExceptionFilter } from '../../src/modules/auth/console-sso-exception.filter';
import { generateKeyPairSync, sign } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { Redis } from 'ioredis';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { IdentityAccessModule } from '../../src/modules/identity-access/identity-access.module';
import { AccessModule } from '../../src/modules/access/access.module';
import { AuditContextModule } from '../../src/common/audit/audit-context.module';
import {
  REDIS,
  RedisSessionStore,
} from '../../src/modules/auth/redis-session-store';

const issuer = 'http://identity.test';
const subject = 'review-superadministrator';
const sessionId = 'opaque-console-session';
const oauthClient = {
  clientId: 'integration-test',
  audience: 'integration-api',
  type: 'confidential',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const organization = () => ({
  organization_id: 'organization-1',
  membership_id: 'membership-1',
  organization_status: 'active',
  membership_status: 'active',
  roles: ['platform_super_admin'],
  permissions: ['*'],
  product: { code: 'console', status: 'enabled' },
});
const accessContext = () => ({
  identity: {
    issuer,
    subject_id: subject,
    identity_reference_id: 'identity-1',
    type: 'workforce_user',
  },
  organizations: [organization()],
});

describe('Console SSO authorization (real SDK and guards)', () => {
  let app: INestApplication;
  let jwksServer: Server;
  let cfg: SsoConfig;
  let redis: Redis;
  let store: RedisSessionStore;
  let context: unknown;
  let contextStatus: number;
  let contextDown: boolean;
  let tokenScope: string;
  let refreshCalls: number;
  let adminCalls: number;
  let serviceTokenStatus: number;
  let adminStatus: number;
  let resolveCalls: number;
  let resolveStatus: number;
  let resolveDown: boolean;
  let signedClaims: Record<string, unknown>;
  let signedToken: string | undefined;
  let deniedOrganizations: Set<string>;
  let fetchMock: jest.SpyInstance;
  const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const accessKeys = generateKeyPairSync('rsa', { modulusLength: 2048 });

  function jwt(scope = tokenScope) {
    const header = Buffer.from(
      JSON.stringify({ alg: 'RS256', kid: 'test-key' }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iss: issuer,
        aud: 'console-api',
        sub: subject,
        email: 'admin@example.test',
        name: 'Admin',
        scope,
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url');
    const body = `${header}.${payload}`;
    return `${body}.${sign('RSA-SHA256', Buffer.from(body), keys.privateKey).toString('base64url')}`;
  }

  function contextJwt(
    overrides: Record<string, unknown> = signedClaims,
    headerOverrides: Record<string, unknown> = {},
    signingKey = accessKeys.privateKey,
  ) {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({
        alg: 'RS256',
        kid: 'access-key',
        typ: 'hemia-context+jwt',
        ...headerOverrides,
      }),
    ).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        iss: 'http://access.test',
        aud: 'console-api',
        sub: subject,
        iat: now,
        nbf: now,
        exp: now + 300,
        jti: 'signed-context-id',
        identity_issuer: issuer,
        identity_reference_id: 'identity-1',
        organization_id: 'organization-1',
        organization_status: 'active',
        membership_id: 'membership-1',
        membership_status: 'active',
        product_code: 'console',
        product_status: 'enabled',
        contract_version: 1,
        context_version: 3,
        global_roles: ['platform_super_admin'],
        permissions: ['*'],
        ...overrides,
      }),
    ).toString('base64url');
    const body = `${header}.${payload}`;
    return `${body}.${sign('RSA-SHA256', Buffer.from(body), signingKey).toString('base64url')}`;
  }

  beforeAll(async () => {
    const jwk = keys.publicKey.export({ format: 'jwk' });
    const accessJwk = accessKeys.publicKey.export({ format: 'jwk' });
    jwksServer = createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          keys:
            req.url === '/access/jwks'
              ? [{ ...accessJwk, kid: 'access-key', alg: 'RS256', use: 'sig' }]
              : [{ ...jwk, kid: 'test-key', alg: 'RS256', use: 'sig' }],
        }),
      );
    });
    await new Promise<void>((resolve) =>
      jwksServer.listen(0, '127.0.0.1', resolve),
    );
    cfg = {
      issuer,
      clientId: 'console',
      clientSecret: 'test-sso-secret',
      audience: 'console-api',
      authorizationUrl: `${issuer}/oauth/authorize`,
      tokenUrl: `${issuer}/oauth/token`,
      revocationUrl: `${issuer}/oauth/revoke`,
      logoutUrl: `${issuer}/oauth/logout`,
      jwksUrl: `http://127.0.0.1:${(jwksServer.address() as AddressInfo).port}/jwks`,
      redirectUri: 'http://console-api.test/auth/callback',
      frontendUrl: 'http://console.test',
      cookieName: 'console_session',
      cookieSecure: true,
      sessionTtlSeconds: 600,
      requireDistributedRefreshLock: true,
      productCode: 'console',
      scope: 'openid profile email offline_access console.access',
      authorize: (claims) =>
        typeof claims.scope === 'string' &&
        claims.scope.split(' ').includes('console.access'),
      access: {
        apiBaseUrl: 'http://access.test',
        jwksUrl: `http://127.0.0.1:${(jwksServer.address() as AddressInfo).port}/access/jwks`,
        audience: 'access-api',
      },
    };
  });

  beforeEach(async () => {
    const values = new Map<string, string>();
    redis = {
      get: (key: string) => Promise.resolve(values.get(key) ?? null),
      set: (
        key: string,
        value: string,
        _ex: string,
        _ttl: number,
        nx?: string,
      ) => {
        if (nx === 'NX' && values.has(key)) return Promise.resolve(null);
        values.set(key, value);
        return Promise.resolve('OK');
      },
      del: (key: string) => Promise.resolve(Number(values.delete(key))),
      eval: (_script: string, _count: number, key: string, token: string) =>
        Promise.resolve(
          values.get(key) === token ? Number(values.delete(key)) : 0,
        ),
      quit: () => Promise.resolve('OK'),
    } as unknown as Redis;
    context = accessContext();
    contextStatus = 200;
    contextDown = false;
    tokenScope = cfg.scope;
    refreshCalls = 0;
    adminCalls = 0;
    serviceTokenStatus = 200;
    adminStatus = 200;
    resolveCalls = 0;
    resolveStatus = 200;
    resolveDown = false;
    signedClaims = {};
    signedToken = undefined;
    deniedOrganizations = new Set();
    fetchMock = jest
      .spyOn(global, 'fetch')
      .mockImplementation(async (input, init) => {
        await Promise.resolve();
        const url =
          typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
        if (url === cfg.tokenUrl) {
          const body = JSON.parse(init?.body as string) as {
            grant_type: string;
            client_id: string;
          };
          if (body.grant_type === 'client_credentials')
            return json(
              { access_token: 'service-admin-token', expires_in: 300 },
              serviceTokenStatus,
            );
          if (body.grant_type === 'refresh_token') refreshCalls++;
          if (body.grant_type.includes('token-exchange'))
            return json({ access_token: 'user-access-token' });
          return json({
            access_token: jwt(),
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
          });
        }
        if (url === 'http://access.test/v1/me/context?product=console') {
          if (contextDown) throw new Error('Transport unavailable');
          return json(context, contextStatus);
        }
        if (url === 'http://access.test/v1/me/context/resolve') {
          resolveCalls++;
          expect(init?.method).toBe('POST');
          expect(new Headers(init?.headers).get('Authorization')).toBe(
            'Bearer user-access-token',
          );
          const body = JSON.parse(init?.body as string) as {
            organization_id: string;
          };
          expect(body).toEqual({
            organization_id: body.organization_id,
            product_code: 'console',
            audience: 'console-api',
          });
          if (resolveDown) throw new Error('Resolve unavailable');
          if (deniedOrganizations.has(body.organization_id))
            return json({}, 403);
          return json(
            { context_token: signedToken ?? contextJwt() },
            resolveStatus,
          );
        }
        if (url === cfg.revocationUrl)
          return new Response(null, { status: 204 });
        if (
          url.startsWith(`${issuer}/api/v1/`) ||
          url === 'http://access.test/v1/organizations'
        ) {
          adminCalls++;
          expect(new Headers(init?.headers).get('Cookie')).toBeNull();
          expect(new Headers(init?.headers).get('Authorization')).toBe(
            'Bearer service-admin-token',
          );
          return json({ id: 'created-resource' }, adminStatus);
        }
        throw new Error('Unexpected outbound request');
      });
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          isGlobal: true,
          load: [
            () => ({
              sso: cfg,
              redis: {},
              hemiaId: {
                baseUrl: issuer,
                adminPrefix: '/api/v1',
                service: {
                  clientId: 'console-identity-admin',
                  clientSecret: 'test-admin-secret',
                  scopes: 'identity.users.read identity.oauth_clients.create',
                  tokenUrl: '/oauth/token',
                },
              },
              accessAdmin: {
                apiBaseUrl: 'http://access.test',
                clientId: 'console-access-admin',
                clientSecret: 'test-access-secret',
                scopes: 'organization.read',
                tokenUrl: cfg.tokenUrl,
              },
            }),
          ],
        }),
        AuditContextModule,
        AuthModule,
        IdentityAccessModule,
        AccessModule,
      ],
    })
      .overrideProvider(REDIS)
      .useValue(redis)
      .compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new ConsoleSsoExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    store = app.get(RedisSessionStore);
    await store.set<Session>(
      `sso:session:${sessionId}`,
      {
        id: sessionId,
        user: {
          sub: subject,
          iss: issuer,
          email: 'admin@example.test',
          name: 'Admin',
        },
        accessToken: jwt(),
        refreshToken: 'stored-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        accessContext: accessContext() as never,
      },
      600,
    );
  });

  afterEach(async () => {
    await app?.close();
    fetchMock?.mockRestore();
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => jwksServer.close(() => resolve()));
  });
  const api = () => request(app.getHttpServer() as Server);

  it.each([
    '/auth/session',
    '/me',
    '/identity-access/oauth-clients',
    '/access/organizations',
  ])('returns 401 without session at %s', async (path) => {
    await api().get(path).expect(401);
    expect(adminCalls).toBe(0);
  });

  it('allows superadministrator and exposes only safe identity fields', async () => {
    const stored = (await store.get<Session>(`sso:session:${sessionId}`))!;
    Object.assign(stored.user, {
      accessToken: 'must-not-leak',
      refreshToken: 'must-not-leak',
      roles: ['admin'],
    });
    await store.set(`sso:session:${sessionId}`, stored, 600);
    const session = await api()
      .get('/auth/session')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    expect(session.body).toEqual({
      authenticated: true,
      user: {
        sub: subject,
        iss: issuer,
        email: 'admin@example.test',
        name: 'Admin',
      },
    });
    expect(session.headers['cache-control']).toBe('no-store');
    const me = await api()
      .get('/me')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    expect(me.body).toEqual((session.body as { user: unknown }).user);
    await api()
      .post('/identity-access/oauth-clients')
      .set('Cookie', `console_session=${sessionId}`)
      .send(oauthClient)
      .expect(201);
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    await api()
      .get('/access/organizations')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    expect(adminCalls).toBe(3);
    expect(resolveCalls).toBe(5);
  });

  it.each([
    { roles: ['organization_owner'] },
    { roles: [] },
    { permissions: [] },
    { organization_status: 'suspended' },
    { membership_status: 'suspended' },
    { product: { code: 'console', status: 'disabled' } },
    { product: { code: 'legal', status: 'enabled' } },
  ])(
    'denies inactive or non-superadministrator context: %j',
    async (change) => {
      context = {
        ...accessContext(),
        organizations: [{ ...organization(), ...change }],
      };
      if ('roles' in change) signedClaims.global_roles = change.roles;
      if ('permissions' in change)
        signedClaims.permissions = change.permissions;
      await api()
        .get('/auth/session')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(403);
      await api()
        .post('/identity-access/oauth-clients')
        .set('Cookie', `console_session=${sessionId}`)
        .send(oauthClient)
        .expect(403);
      expect(adminCalls).toBe(0);
    },
  );

  it('ignores login context and detects revocation between requests', async () => {
    await api()
      .post('/identity-access/oauth-clients')
      .set('Cookie', `console_session=${sessionId}`)
      .send(oauthClient)
      .expect(201);
    context = { ...accessContext(), organizations: [] };
    await api()
      .get('/access/organizations')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    await api()
      .post('/identity-access/oauth-clients')
      .set('Cookie', `console_session=${sessionId}`)
      .send(oauthClient)
      .expect(403);
    expect(adminCalls).toBe(1);
  });

  it.each([{ issuer: 'http://wrong.test' }, { subject_id: 'another-user' }])(
    'denies mismatched identity: %j',
    async (change) => {
      context = {
        ...accessContext(),
        identity: { ...accessContext().identity, ...change },
      };
      await api()
        .get('/me')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(403);
      expect(adminCalls).toBe(0);
    },
  );

  it.each([401, 403, 500])(
    'maps Access %s without starting a new login',
    async (status) => {
      contextStatus = status;
      await api()
        .get('/auth/session')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(status === 500 ? 503 : 403);
      expect(await store.get(`sso:session:${sessionId}`)).not.toBeNull();
      expect(adminCalls).toBe(0);
    },
  );

  it('fails closed when Access goes down after a successful operation', async () => {
    await api()
      .get('/identity-access/oauth-clients')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    contextDown = true;
    await api()
      .get('/identity-access/oauth-clients')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(503);
    expect(adminCalls).toBe(1);
  });

  it.each([
    {},
    { identity: {}, organizations: [] },
    { ...accessContext(), organizations: [null] },
  ])('rejects malformed Access response', async (body) => {
    context = body;
    await api()
      .get('/auth/session')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(503);
  });

  it('service credential errors are 503 and retain the local session', async () => {
    serviceTokenStatus = 401;
    await api()
      .post('/identity-access/oauth-clients')
      .set('Cookie', `console_session=${sessionId}`)
      .send(oauthClient)
      .expect(503);
    expect(await store.get(`sso:session:${sessionId}`)).not.toBeNull();
    expect(adminCalls).toBe(0);
  });

  it.each([401, 403])(
    'service API rejects credentials with %s without expiring the session',
    async (status) => {
      adminStatus = status;
      await api()
        .get('/identity-access/users')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(503);
      await api()
        .get('/access/organizations')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(503);
      expect(await store.get(`sso:session:${sessionId}`)).not.toBeNull();
      expect(adminCalls).toBe(2);
    },
  );

  it('rejects a user without organizations before reading administrative data', async () => {
    context = { ...accessContext(), organizations: [] };
    await api()
      .get('/me')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    await api()
      .get('/access/organizations')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    expect(adminCalls).toBe(0);
  });

  it('detects a revoked platform role on the next request', async () => {
    await api()
      .get('/access/organizations')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    context = {
      ...accessContext(),
      organizations: [{ ...organization(), roles: ['organization_owner'] }],
    };
    signedClaims.global_roles = ['organization_owner'];
    await api()
      .get('/auth/session')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    expect(adminCalls).toBe(1);
  });

  it('uses signed authority even when unsigned discovery omits the role', async () => {
    context = {
      ...accessContext(),
      organizations: [{ ...organization(), roles: [], permissions: [] }],
    };
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    expect(adminCalls).toBe(1);
    expect(resolveCalls).toBe(1);
  });

  it('detects revocation with stale discovery and never reuses the verified JWT', async () => {
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    resolveStatus = 403;
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    expect(adminCalls).toBe(1);
    expect(resolveCalls).toBe(2);
  });

  it('tries another active organization after Access denies the first', async () => {
    context = {
      ...accessContext(),
      organizations: [
        { ...organization(), organization_id: 'denied-organization' },
        organization(),
      ],
    };
    deniedOrganizations.add('denied-organization');
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    expect(resolveCalls).toBe(2);
    expect(adminCalls).toBe(1);
  });

  it('fails closed when resolution fails after a previously authorized request', async () => {
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(200);
    resolveDown = true;
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(503);
    expect(adminCalls).toBe(1);
    expect(resolveCalls).toBe(2);
    expect(await store.get(`sso:session:${sessionId}`)).not.toBeNull();
  });

  it.each([401, 403, 400, 409, 500])(
    'maps signed resolution status %s',
    async (status) => {
      resolveStatus = status;
      await api()
        .get('/auth/session')
        .set('Cookie', `console_session=${sessionId}`)
        .expect([401, 403].includes(status) ? 403 : 503);
      expect(adminCalls).toBe(0);
      expect(await store.get(`sso:session:${sessionId}`)).not.toBeNull();
    },
  );

  it.each([
    { sub: 'another-human' },
    { identity_issuer: 'http://wrong.test' },
    { identity_reference_id: 'another-identity' },
    { organization_id: 'another-org' },
    { membership_id: 'another-member' },
    { product_code: 'legal' },
    { organization_status: 'suspended' },
    { membership_status: 'suspended' },
    { product_status: 'disabled' },
    { global_roles: ['organization_owner'] },
    { permissions: [] },
  ])(
    'rejects signed authority outside the Console session: %j',
    async (claims) => {
      signedClaims = claims;
      await api()
        .get('/identity-access/users')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(403);
      expect(adminCalls).toBe(0);
    },
  );

  it.each([
    { contract_version: 2 },
    { contract_version: undefined },
    { context_version: -1 },
    { context_version: '3' },
    { global_roles: undefined },
    { identity_reference_id: undefined },
    { product_status: undefined },
    { permissions: '*' },
    { iat: Math.floor(Date.now() / 1000) - 600 },
  ])(
    'rejects an unsupported or malformed signed Console contract: %j',
    async (claims) => {
      signedClaims = claims;
      await api()
        .get('/auth/session')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(503);
      expect(adminCalls).toBe(0);
    },
  );

  it.each([
    { iss: issuer },
    { aud: 'billing-api' },
    { aud: ['console-api'] },
    { exp: Math.floor(Date.now() / 1000) - 10 },
    { nbf: Math.floor(Date.now() / 1000) + 600 },
    { jti: undefined },
  ])('rejects a JWT with invalid standard claims: %j', async (claims) => {
    signedClaims = claims;
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    expect(adminCalls).toBe(0);
  });

  it('rejects a context signed by Identity instead of Access', async () => {
    signedToken = contextJwt({}, {}, keys.privateKey);
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    expect(adminCalls).toBe(0);
  });

  it('rejects the generic context JWT without the system token type', async () => {
    signedToken = contextJwt({}, { typ: undefined });
    await api()
      .get('/identity-access/users')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(403);
    expect(adminCalls).toBe(0);
  });

  it('login uses PKCE; callback sets only the opaque secure cookie', async () => {
    const login = await api()
      .get('/auth/login?returnTo=/es/identity/oauth-clients')
      .expect(302);
    const url = new URL(login.headers.location);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('scope')).toContain('console.access');
    const callback = await api()
      .get(
        `/auth/callback?code=test-code&state=${url.searchParams.get('state')}`,
      )
      .expect(302);
    expect(callback.headers.location).toBe(
      'http://console.test/es/identity/oauth-clients',
    );
    const cookies = callback.headers['set-cookie'] as unknown as string[];
    expect(cookies).toHaveLength(1);
    expect(cookies[0]).toMatch(/^console_session=/);
    for (const flag of [
      'HttpOnly',
      'Secure',
      'SameSite=Lax',
      'Path=/',
      'Max-Age=600',
    ])
      expect(cookies[0]).toContain(flag);
    expect(cookies[0]).not.toContain(jwt());
  });

  it('rejects callback tokens without console.access', async () => {
    tokenScope = 'openid profile email';
    const login = await api().get('/auth/login').expect(302);
    const state = new URL(login.headers.location).searchParams.get('state');
    const callback = await api()
      .get(`/auth/callback?code=test-code&state=${state}`)
      .expect(302);
    expect(callback.headers.location).toContain('error=auth_failed');
    expect(callback.headers['set-cookie']).toBeUndefined();
  });

  it.each([401, 403, 503])(
    'maps Access failure %s during refresh without leaking SDK errors',
    async (status) => {
      const session = (await store.get<Session>(`sso:session:${sessionId}`))!;
      session.expiresAt = new Date(Date.now() - 1000).toISOString();
      await store.set(`sso:session:${sessionId}`, session, 600);
      contextStatus = status;
      await api()
        .get('/auth/session')
        .set('Cookie', `console_session=${sessionId}`)
        .expect(status === 503 ? 503 : 403);
      expect(await store.get(`sso:session:${sessionId}`)).not.toBeNull();
      expect(adminCalls).toBe(0);
    },
  );

  it('two SDK instances refresh the expired session once through the shared Redis lock', async () => {
    const session = (await store.get<Session>(`sso:session:${sessionId}`))!;
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    await store.set(`sso:session:${sessionId}`, session, 600);
    const other = new SsoCore(cfg, new RedisSessionStore(redis));
    const sessions = await Promise.all(
      Array.from({ length: 8 }, (_, i) =>
        (i % 2 ? other : app.get(SsoCore)).getSession(sessionId),
      ),
    );
    expect(refreshCalls).toBe(1);
    expect(sessions.every((result) => result.id === sessionId)).toBe(true);
  });

  it('expired non-refreshable session is 401 and logout deletes the session and cookie', async () => {
    const session = (await store.get<Session>(`sso:session:${sessionId}`))!;
    session.expiresAt = new Date(Date.now() - 1000).toISOString();
    delete session.refreshToken;
    await store.set(`sso:session:${sessionId}`, session, 600);
    await api()
      .get('/auth/session')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(401);
    const logout = await api()
      .post('/auth/logout')
      .set('Cookie', `console_session=${sessionId}`)
      .expect(201);
    expect(await store.get(`sso:session:${sessionId}`)).toBeNull();
    expect(logout.headers['set-cookie'][0]).toMatch(/^console_session=;/);
    expect((logout.body as { logoutUrl: string }).logoutUrl).toBe(
      cfg.logoutUrl,
    );
  });
});
