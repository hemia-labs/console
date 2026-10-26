import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { SystemOAuthService } from '../../../../apps/api/src/modules/legal-system-catalog/system-oauth.service';
import type { ConsoleRequest } from '../../../../apps/api/src/modules/auth/authorization/console-authorization.service';
const req = {} as ConsoleRequest;
const client = {
  id: 'uuid',
  clientId: 'portal',
  status: 'active',
  type: 'confidential',
  grantTypes: ['client_credentials'],
  audience: 'notifications-api',
  serviceDestinations: [],
};
const draft = {
  code: 'portal',
  name: 'Portal',
  enabled: true,
  configuration: { notifications: {} },
  services: [],
  clients: [
    {
      oauthIssuer: 'https://identity.test',
      clientId: 'portal',
      capabilityCode: 'notifications',
      roles: ['read', 'send'],
      enabled: true,
    },
  ],
};
function setup() {
  const legal = {
    request: jest.fn((method: string, path: string): Promise<unknown> =>
      Promise.resolve(
        (() => {
          if (path === 'capabilities')
            return [
              {
                code: 'notifications',
                functions: ['read', 'send'].map((code) => ({
                  code,
                  scopes: [
                    {
                      code: `notifications.${code}`,
                      audience: 'notifications-api',
                    },
                  ],
                })),
              },
            ];
          if (path === 'choices')
            return { oauthIssuer: 'https://identity.test' };
          if (path === 'systems' && method === 'GET') return [];
          if (path === 'systems/validate') return { validated: true };
          if (method === 'POST' && path === 'systems')
            return { ...draft, id: 'saved' };
          return [];
        })(),
      ),
    ),
  };
  const destinations: {
    resource: string;
    audience: string;
    scopes: string[];
  }[] = [];
  const identity = {
    requestService: jest.fn(
      ({
        path,
        body,
      }: {
        path: string;
        body?: { resource: string; audience: string; scopes: string[] };
      }): Promise<unknown> =>
        Promise.resolve(
          (() => {
            if (path === '/oauth-clients')
              return [{ ...client, serviceDestinations: destinations }];
            if (path === '/oauth-apis')
              return [
                {
                  id: 'notifications',
                  name: 'Notifications',
                  audience: 'notifications-api',
                  resource: 'https://notifications.test',
                  enabled: true,
                  scopes: ['notifications.read', 'notifications.send'],
                },
              ];
            if (path === '/oauth-scopes')
              return ['read', 'send'].map((code) => ({
                code: `notifications.${code}`,
                kind: 'api',
                audience: 'notifications-api',
                resource: 'https://notifications.test',
                enabled: true,
              }));
            if (body) {
              destinations.push(body);
              return { ...client, serviceDestinations: destinations };
            }
          })(),
        ),
    ),
  };
  const assertHeld = jest.fn(() => Promise.resolve());
  return {
    legal,
    identity,
    destinations,
    assertHeld,
    service: new SystemOAuthService(
      legal as never,
      identity as never,
      {
        request: jest.fn(() =>
          Promise.resolve({ service: { clientId: 'billing' } }),
        ),
      } as never,
      new ConfigService({ hemiaId: { service: { clientId: 'console' } } }),
      {
        run: (work: (assert: () => Promise<void>) => Promise<unknown>) =>
          work(assertHeld),
      } as never,
    ),
  };
}
test('two functions reuse one identity and save only after both grants are confirmed', async () => {
  const f = setup();
  await expect(f.service.save(req, draft)).resolves.toMatchObject({
    id: 'saved',
  });
  expect(
    f.identity.requestService.mock.calls.filter(([arg]) =>
      arg.path.includes('/service-destinations'),
    ),
  ).toHaveLength(2);
  expect(f.legal.request.mock.calls.at(-1)?.slice(0, 2)).toEqual([
    'POST',
    'systems',
  ]);
});
test('grant failure leaves the system unwritten and a retry uses the same client', async () => {
  const f = setup();
  const real = f.identity.requestService.getMockImplementation()!;
  f.identity.requestService.mockImplementation(async (arg) => {
    if (arg.path.includes('/service-destinations'))
      throw new Error('Identity unavailable');
    return real(arg);
  });
  await expect(f.service.save(req, draft)).rejects.toThrow(
    'Identity unavailable',
  );
  expect(
    f.legal.request.mock.calls.some(
      ([m, p]) => m === 'POST' && p === 'systems',
    ),
  ).toBe(false);
  f.identity.requestService.mockImplementation(real);
  await f.service.save(req, draft);
  expect(
    f.identity.requestService.mock.calls.some(
      ([arg]) => arg.path === '/oauth-clients' && 'body' in arg,
    ),
  ).toBe(false);
});
test('invalid capability or draft causes no Identity mutation', async () => {
  const f = setup();
  f.legal.request.mockRejectedValueOnce(new Error('Invalid draft'));
  await expect(f.service.save(req, draft)).rejects.toThrow('Invalid draft');
  expect(f.identity.requestService).not.toHaveBeenCalled();
});

test('removing a function revokes only its unused scopes and preserves a second system', async () => {
  const f = setup();
  f.destinations.push({
    resource: 'https://notifications.test',
    audience: 'notifications-api',
    scopes: ['notifications.read', 'notifications.send'],
  });
  const original = f.legal.request.getMockImplementation()!;
  const prior = { ...draft, id: 'one' };
  const other = {
    ...draft,
    id: 'two',
    clients: [{ ...draft.clients[0], roles: ['read'] }],
  };
  f.legal.request.mockImplementation(async (m, p) =>
    p === 'systems' && m === 'GET' ? [prior, other] : original(m, p),
  );
  const identity = f.identity.requestService.getMockImplementation()!;
  f.identity.requestService.mockImplementation(async (arg) =>
    arg.path.includes('service-destinations') &&
    (arg as { method?: string }).method === 'DELETE'
      ? { ...client, serviceDestinations: [] }
      : identity(arg),
  );
  await f.service.save(req, { ...draft, clients: [] }, 'one');
  const removals = f.identity.requestService.mock.calls.filter(
    ([arg]) => (arg as { method?: string }).method === 'DELETE',
  );
  expect(removals).toHaveLength(1);
  expect(removals[0][0].body?.scopes).toEqual(['notifications.send']);
});

test('retiring the final payment connection revokes receiver and probe grants but preserves shared receivers', async () => {
  const f = setup();
  const service = {
    code: 'receiver',
    name: 'Receiver',
    url: 'https://portal.test/events',
    resource: 'https://portal.test',
    audience: 'portal-api',
    enabled: true,
  };
  const prior = {
    ...draft,
    id: 'one',
    clients: [
      {
        ...draft.clients[0],
        capabilityCode: 'payments',
        roles: ['catalog', 'checkout', 'receiver'],
      },
    ],
    configuration: {
      payments: { receiverService: 'receiver', checkService: 'receiver' },
    },
    services: [service],
  };
  const other = { ...prior, id: 'two' };
  let records = [prior, other];
  const original = f.legal.request.getMockImplementation()!;
  f.legal.request.mockImplementation((m, p) =>
    p === 'systems' && m === 'GET' ? Promise.resolve(records) : original(m, p),
  );
  const identity = f.identity.requestService.getMockImplementation()!;
  f.identity.requestService.mockImplementation((arg) =>
    arg.path === '/oauth-clients'
      ? Promise.resolve(
          ['billing', 'console'].map((id) => ({
            ...client,
            id,
            clientId: id,
            serviceDestinations: [
              {
                resource: service.resource,
                audience: service.audience,
                scopes: [
                  id === 'billing'
                    ? 'billing.webhooks.deliver'
                    : 'billing.connections.check',
                ],
              },
            ],
          })),
        )
      : identity(arg),
  );
  await f.service.save(req, { ...prior, enabled: false }, 'one');
  expect(
    f.identity.requestService.mock.calls.filter(
      ([arg]) => (arg as { method?: string }).method === 'DELETE',
    ),
  ).toHaveLength(0);
  records = [prior];
  await f.service.save(req, { ...prior, enabled: false }, 'one');
  const removals = f.identity.requestService.mock.calls.filter(
    ([arg]) => (arg as { method?: string }).method === 'DELETE',
  );
  expect(removals.map(([arg]) => arg.body?.scopes[0]).sort()).toEqual([
    'billing.connections.check',
    'billing.webhooks.deliver',
  ]);
});

test('losing the catalog lease prevents subsequent grants and persistence', async () => {
  const f = setup();
  f.assertHeld.mockRejectedValue(new Error('Lease lost'));
  await expect(f.service.save(req, draft)).rejects.toThrow('Lease lost');
  expect(
    f.identity.requestService.mock.calls.some(([arg]) =>
      arg.path.includes('/service-destinations'),
    ),
  ).toBe(false);
  expect(
    f.legal.request.mock.calls.some(
      ([m, p]) => m === 'POST' && p === 'systems',
    ),
  ).toBe(false);
});

test.each([
  ['missing', undefined],
  ['unrestricted', null],
  ['empty', []],
  [
    'different audience',
    [
      {
        resource: 'https://portal.test',
        audience: 'other-api',
        scopes: ['legal.consumer_context.read'],
      },
    ],
  ],
  [
    'different resource',
    [
      {
        resource: 'https://other.test',
        audience: '',
        scopes: ['legal.consumer_context.read'],
      },
    ],
  ],
])(
  'repairs incomplete previous service metadata without revoking a nonexistent exact grant (%s)',
  async (_label, serviceDestinations) => {
    const f = setup();
    const previous = {
      ...draft,
      id: 'one',
      configuration: { legalAcceptances: { contextService: 'context' } },
      clients: [
        {
          ...draft.clients[0],
          capabilityCode: 'legalAcceptances',
          roles: ['collector'],
        },
      ],
      services: [
        {
          code: 'context',
          name: 'Context',
          url: 'https://portal.test/context',
          resource: 'https://portal.test',
          audience: '',
          enabled: true,
        },
      ],
    };
    const original = f.legal.request.getMockImplementation()!;
    f.legal.request.mockImplementation((method, path) => {
      if (method === 'GET' && path === 'systems')
        return Promise.resolve([previous]);
      if (path === 'choices')
        return Promise.resolve({
          oauthIssuer: 'https://identity.test',
          verificationClientId: 'legal',
        });
      return original(method, path);
    });
    const identity = f.identity.requestService.getMockImplementation()!;
    f.identity.requestService.mockImplementation((arg) =>
      arg.path === '/oauth-clients'
        ? Promise.resolve([
            { ...client, clientId: 'legal', serviceDestinations },
          ])
        : identity(arg),
    );
    await f.service.save(req, { ...previous, enabled: false }, 'one');
    expect(
      f.identity.requestService.mock.calls.some(
        ([arg]) => (arg as { method?: string }).method === 'DELETE',
      ),
    ).toBe(false);
    expect(f.legal.request.mock.calls.at(-1)?.slice(0, 2)).toEqual([
      'PUT',
      'systems/one',
    ]);
  },
);

test('retiring a missing scope preserves unrelated scopes in the exact destination', async () => {
  const f = setup();
  f.destinations.push({
    resource: 'https://notifications.test',
    audience: 'notifications-api',
    scopes: ['notifications.other'],
  });
  const original = f.legal.request.getMockImplementation()!;
  f.legal.request.mockImplementation((method, path) =>
    method === 'GET' && path === 'systems'
      ? Promise.resolve([{ ...draft, id: 'one' }])
      : original(method, path),
  );
  await f.service.save(req, { ...draft, clients: [] }, 'one');
  expect(
    f.identity.requestService.mock.calls.some(
      ([arg]) => (arg as { method?: string }).method === 'DELETE',
    ),
  ).toBe(false);
  expect(f.destinations[0].scopes).toEqual(['notifications.other']);
});

test('a suspended client still loses only retired scopes in its exact destination', async () => {
  const f = setup();
  const original = f.legal.request.getMockImplementation()!;
  f.legal.request.mockImplementation((method, path) =>
    method === 'GET' && path === 'systems'
      ? Promise.resolve([
          {
            ...draft,
            id: 'one',
            clients: [{ ...draft.clients[0], roles: ['send'] }],
          },
        ])
      : original(method, path),
  );
  const destinations = [
    {
      resource: 'https://notifications.test',
      audience: 'notifications-api',
      scopes: ['notifications.send', 'notifications.other'],
    },
  ];
  const identity = f.identity.requestService.getMockImplementation()!;
  f.identity.requestService.mockImplementation((arg) => {
    if (arg.path === '/oauth-clients')
      return Promise.resolve([
        { ...client, status: 'suspended', serviceDestinations: destinations },
      ]);
    if ((arg as { method?: string }).method === 'DELETE') {
      destinations[0].scopes = destinations[0].scopes.filter(
        (scope) => !arg.body?.scopes.includes(scope),
      );
      return Promise.resolve({
        ...client,
        status: 'suspended',
        serviceDestinations: destinations,
      });
    }
    return identity(arg);
  });
  await f.service.save(req, { ...draft, enabled: false }, 'one');
  const removals = f.identity.requestService.mock.calls.filter(
    ([arg]) => (arg as { method?: string }).method === 'DELETE',
  );
  expect(removals.map(([arg]) => arg.body)).toEqual([
    {
      resource: 'https://notifications.test',
      audience: 'notifications-api',
      scopes: ['notifications.send'],
    },
  ]);
  expect(destinations[0].scopes).toEqual(['notifications.other']);
  expect(f.legal.request.mock.calls.at(-1)?.slice(0, 2)).toEqual([
    'PUT',
    'systems/one',
  ]);
});

test('subscription management independently generates only manage and its two required read scopes', async () => {
  const f = setup();
  const required = [
    'billing.subscriptions.manage',
    'billing.integration.catalog.read',
    'billing.integration.checkout.read',
  ];
  const realLegal = f.legal.request.getMockImplementation()!;
  f.legal.request.mockImplementation(async (method, path) =>
    path === 'capabilities'
      ? [
          {
            code: 'payments',
            functions: [
              {
                code: 'subscriptions',
                scopes: required.map((code) => ({
                  code,
                  audience: 'billing-api',
                })),
              },
            ],
          },
        ]
      : realLegal(method, path),
  );
  const realIdentity = f.identity.requestService.getMockImplementation()!;
  f.identity.requestService.mockImplementation(async (arg) =>
    arg.path === '/oauth-apis'
      ? [
          {
            id: 'billing',
            name: 'Billing',
            audience: 'billing-api',
            resource: 'https://billing.test',
            enabled: true,
            scopes: required,
          },
        ]
      : arg.path === '/oauth-scopes'
        ? required.map((code) => ({
            code,
            kind: 'api',
            audience: 'billing-api',
            resource: 'https://billing.test',
            enabled: true,
          }))
        : realIdentity(arg),
  );
  await f.service.save(req, {
    ...draft,
    configuration: { payments: {} },
    clients: [
      {
        ...draft.clients[0],
        capabilityCode: 'payments',
        roles: ['subscriptions'],
      },
    ],
  });
  expect(f.destinations).toEqual(
    required.map((code) => ({
      resource: 'https://billing.test',
      audience: 'billing-api',
      scopes: [code],
    })),
  );
  expect(JSON.stringify(f.destinations)).not.toContain(
    'billing.integration.checkout.create',
  );
});
