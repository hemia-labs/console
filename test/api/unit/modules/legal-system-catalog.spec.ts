import 'reflect-metadata';
import { ConsoleServiceClient } from '../../../../apps/api/src/modules/legal-system-catalog/console-service.client';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ConsoleAdminGuard } from '../../../../apps/api/src/modules/auth/authorization/console-admin.guard';
import { LegalSystemCatalogClient } from '../../../../apps/api/src/modules/legal-system-catalog/legal-system-catalog.client';
import { LegalSystemCatalogController } from '../../../../apps/api/src/modules/legal-system-catalog/legal-system-catalog.controller';
import type { ConsoleRequest } from '../../../../apps/api/src/modules/auth/authorization/console-authorization.service';
const original = global.fetch;
afterEach(() => {
  global.fetch = original;
});
const req = {
  user: { sub: randomUUID(), iss: 'http://localhost:4000' },
} as ConsoleRequest;
function fixture() {
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
  global.fetch = fetchMock as typeof fetch;
  const config = new ConfigService({
    legalAdmin: { baseUrl: 'http://localhost:3017' },
    hemiaId: {
      baseUrl: 'http://localhost:4000',
      service: {
        tokenUrl: '/oauth/token',
        clientId: 'console-identity-admin',
        clientSecret: 'private-secret',
      },
    },
  });
  const client = new LegalSystemCatalogClient(
    config,
    new ConsoleServiceClient(config),
  );
  return { client, fetchMock };
}
function token(scope = 'legal.systems.read') {
  return Response.json({
    access_token: 'machine-token',
    token_type: 'Bearer',
    expires_in: 300,
    scope,
  });
}
it('all catalog routes are guarded by Console platform administrator authorization', () => {
  expect(
    Reflect.getMetadata(GUARDS_METADATA, LegalSystemCatalogController),
  ).toContain(ConsoleAdminGuard);
});
it('forwards only a service token and the authenticated actor to Legal', async () => {
  const f = fixture();
  f.fetchMock
    .mockResolvedValueOnce(token())
    .mockResolvedValueOnce(Response.json([]));
  await expect(f.client.request('GET', 'systems', req)).resolves.toEqual([]);
  const tokenBody = f.fetchMock.mock.calls[0][1]?.body as URLSearchParams;
  expect(tokenBody.get('scope')).toBe('legal.systems.read');
  expect(tokenBody.get('resource')).toBe('http://localhost:3017');
  const headers = new Headers(f.fetchMock.mock.calls[1][1]?.headers);
  expect(headers.get('authorization')).toBe('Bearer machine-token');
  expect(headers.get('x-console-actor-subject')).toBe(req.user!.sub);
  expect(headers.get('x-console-actor-issuer')).toBe(req.user!.iss);
});
it('requests write privileges for mutations and preserves the JSON payload', async () => {
  const f = fixture();
  const body = {
    code: 'balanz',
    configuration: { future: { enabled: false, count: 0 } },
  };
  f.fetchMock
    .mockResolvedValueOnce(token('legal.systems.write'))
    .mockResolvedValueOnce(Response.json(body));
  await expect(f.client.request('POST', 'systems', req, body)).resolves.toEqual(
    body,
  );
  expect(
    (f.fetchMock.mock.calls[0][1]?.body as URLSearchParams).get('scope'),
  ).toBe('legal.systems.write');
  expect(f.fetchMock.mock.calls[1][1]?.body).toBe(JSON.stringify(body));
});
it('does not expire the user session when machine credentials are rejected upstream', async () => {
  const f = fixture();
  f.fetchMock
    .mockResolvedValueOnce(token())
    .mockResolvedValueOnce(
      Response.json({ message: 'Denied' }, { status: 401 }),
    );
  await expect(f.client.request('GET', 'systems', req)).rejects.toMatchObject({
    status: 503,
  });
});
it('does not call Legal with an insufficient token grant', async () => {
  const f = fixture();
  f.fetchMock.mockResolvedValueOnce(token('unrelated.scope'));
  await expect(f.client.request('GET', 'systems', req)).rejects.toMatchObject({
    status: 503,
  });
  expect(f.fetchMock).toHaveBeenCalledTimes(1);
});
it('caches tokens by scope and rejects missing user identity', async () => {
  const f = fixture();
  f.fetchMock
    .mockResolvedValueOnce(token())
    .mockResolvedValueOnce(Response.json([]))
    .mockResolvedValueOnce(Response.json([]));
  await f.client.request('GET', 'systems', req);
  await f.client.request('GET', 'capabilities', req);
  expect(f.fetchMock).toHaveBeenCalledTimes(3);
  await expect(
    f.client.request('GET', 'systems', {} as ConsoleRequest),
  ).rejects.toMatchObject({ status: 401 });
});
