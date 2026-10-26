import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CapabilityClientsService } from '../../../../apps/api/src/modules/legal-system-catalog/capability-clients.service';
import { CreateCapabilityClientDto } from '../../../../apps/api/src/modules/legal-system-catalog/capability-client.dto';
import type { ConsoleRequest } from '../../../../apps/api/src/modules/auth/authorization/console-authorization.service';
const req = {} as ConsoleRequest;
const scope = {
  kind: 'api',
  code: 'notifications.messages.send',
  audience: 'notifications-api',
  resource: 'https://notifications.example',
  enabled: true,
};
const dto = {
  capabilityCode: 'notifications',
  roles: ['sender'],
  clientId: 'portal-notifications',
};
function fixture(catalog = [scope]) {
  const legal = {
    request: jest.fn((_method: string, path: string) =>
      Promise.resolve(
        path === 'capabilities'
          ? [
              {
                code: 'notifications',
                functions: [
                  {
                    code: 'sender',
                    scopes: [{ code: scope.code, audience: scope.audience }],
                  },
                ],
              },
            ]
          : { oauthIssuer: 'https://identity.example' },
      ),
    ),
  };
  const identity = {
    requestService: jest.fn((arg: { method: string; path: string }) =>
      Promise.resolve(
        arg.method === 'GET'
          ? arg.path === '/oauth-scopes'
            ? catalog
            : catalog.map((s) => ({
                id: 'notifications',
                name: 'Notifications',
                audience: s.audience,
                resource: s.resource,
                enabled: true,
                scopes: [s.code],
              }))
          : {
              id: 'created-id',
              clientId: dto.clientId,
              clientSecret: 'one-time-secret',
              clientSecretHash: 'never-expose',
            },
      ),
    ),
  };
  return {
    legal,
    identity,
    service: new CapabilityClientsService(legal as never, identity as never),
  };
}
test('generic capability selects scopes and destinations on the server and exposes only the one-time credential', async () => {
  const f = fixture();
  const result = await f.service.create(req, dto);
  expect(f.identity.requestService).toHaveBeenLastCalledWith({
    method: 'POST',
    path: '/oauth-clients',
    body: {
      clientId: dto.clientId,
      audience: 'notifications-api',
      type: 'confidential',
      grantTypes: ['client_credentials'],
      responseTypes: [],
      redirectUris: [],
      requiresConsent: false,
      status: 'active',
      scopes: [],
      serviceDestinations: [
        {
          resource: scope.resource,
          audience: scope.audience,
          scopes: [scope.code],
        },
      ],
    },
  });
  expect(result.client).toMatchObject({
    clientId: dto.clientId,
    oauthIssuer: 'https://identity.example',
  });
  expect(result.clientSecret).toBe('one-time-secret');
  expect(result).not.toHaveProperty('clientSecretHash');
  expect(JSON.stringify(result)).not.toContain('never-expose');
});
test('unknown functions, disabled scopes and missing resource metadata prevent client creation', async () => {
  for (const catalog of [
    [],
    [{ ...scope, enabled: false }],
    [{ ...scope, resource: null }],
  ]) {
    const f = fixture(catalog as (typeof scope)[]);
    await expect(f.service.create(req, dto)).rejects.toThrow();
    expect(f.identity.requestService).toHaveBeenCalledTimes(2);
  }
  const f = fixture();
  await expect(
    f.service.create(req, { ...dto, roles: ['admin'] }),
  ).rejects.toThrow();
  expect(f.identity.requestService).toHaveBeenCalledTimes(2);
});
test('caller cannot override scopes, destinations, client type or audience', () => {
  const value = plainToInstance(CreateCapabilityClientDto, {
    ...dto,
    scopes: ['admin'],
    serviceDestinations: [],
    audience: 'identity-api',
    type: 'public',
  });
  expect(
    validateSync(value, { whitelist: true, forbidNonWhitelisted: true }),
  ).toHaveLength(4);
});
test('a failed Identity create is reported without returning a false association', async () => {
  const f = fixture();
  f.identity.requestService
    .mockImplementationOnce(() => Promise.resolve([scope]))
    .mockRejectedValueOnce(new Error('Identity unavailable'));
  await expect(f.service.create(req, dto)).rejects.toThrow(
    'Identity unavailable',
  );
});
