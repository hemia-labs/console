import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { SystemConnectionsService } from '../../../../apps/api/src/modules/legal-system-catalog/system-connections.service';
import type { SystemConnectionDto } from '../../../../apps/api/src/modules/legal-system-catalog/system-connection.dto';
import type { ConsoleRequest } from '../../../../apps/api/src/modules/auth/authorization/console-authorization.service';
import type {
  SystemRecord,
  Capability,
} from '../../../../apps/api/src/modules/legal-system-catalog/system-contracts';
import type { BillingOptions } from '../../../../apps/api/src/modules/legal-system-catalog/billing-admin.client';
const req = {} as ConsoleRequest;
const simple = (
  code = 'reports',
  functions = ['read'],
): SystemConnectionDto => ({
  systemId: 'system',
  capabilities: [{ code, functions }],
});
const full = (): SystemConnectionDto => ({
  systemId: 'system',
  capabilities: [
    {
      code: 'payments',
      functions: ['catalog', 'checkout', 'licenses', 'receiver'],
    },
    { code: 'legalAcceptances', functions: ['collector'] },
  ],
  payments: {
    productCode: 'product',
    organizationScope: 'all_for_allowed_products',
    organizationIds: [],
    successUrl: 'https://portal.test/success',
    cancelUrl: 'https://portal.test/cancel',
    receiverService: 'license',
    checkService: 'check',
  },
  legal: { applicationId: 'application', documentIds: ['doc'] },
});
function fixture() {
  const identity = (clientId: string) => ({
    id: clientId,
    clientId,
    status: 'active',
    type: 'confidential',
    grantTypes: ['client_credentials'],
    serviceDestinations: [] as {
      resource: string;
      audience: string;
      scopes: string[];
    }[],
    audience: 'portal-api',
  });
  const service = (code: string) => ({
    code,
    name: code,
    url: `https://portal.test/${code}`,
    resource: 'https://portal.test',
    audience: 'portal-api',
    enabled: true,
  });
  const system: SystemRecord = {
    id: 'system',
    code: 'portal',
    name: 'Portal',
    enabled: true,
    clients: [
      {
        oauthIssuer: 'https://identity.test',
        clientId: 'portal',
        capabilityCode: 'reports',
        roles: ['read'],
        enabled: true,
      },
    ],
    services: [service('license'), service('check'), service('context')],
    configuration: {
      reports: {},
      legalAcceptances: {
        identityIssuer: 'urn:hemia:portal',
        productCode: 'product',
        contextService: 'context',
      },
    },
  };
  const capabilities: Capability[] = [
    {
      code: 'reports',
      schema: { fields: [{ key: 'channel', functions: ['send'] }] },
      functions: ['read', 'send'].map((code) => ({
        code,
        scopes: [{ code: `reports.${code}`, audience: 'reports-api' }],
      })),
    },
    {
      code: 'payments',
      schema: { fields: [] },
      functions: ['catalog', 'checkout', 'licenses', 'receiver'].map(
        (code) => ({ code, scopes: [] }),
      ),
    },
    {
      code: 'legalAcceptances',
      schema: { fields: [] },
      functions: ['collector', 'validator'].map((code) => ({
        code,
        scopes: [],
      })),
    },
  ];
  const data = {
    systems: [system],
    capabilities,
    choices: {
      scopes: [],
      audiences: [],
      oauthIssuer: 'https://identity.test',
      verificationClientId: 'legal',
      clients: [{ clientId: 'portal' }],
    },
  };
  const billingOptions: BillingOptions = {
    service: { clientId: 'billing', audience: 'billing-api' },
    products: [{ id: 'product', code: 'product', name: 'Product' }],
    organizations: [{ id: 'org', name: 'Org' }],
    policies: [],
    receivers: [],
  };
  const legalOptions = {
    applications: [{ id: 'application', name: 'App' }],
    documents: [{ id: 'doc', applicationId: 'application', name: 'Terms' }],
    integrations: [],
  };
  const legal = {
    request: jest.fn(
      (
        _method: string,
        _path: string,
        _req: unknown,
        _body?: unknown,
      ): Promise<unknown> => {
        void [_method, _path, _req, _body];
        return Promise.resolve({});
      },
    ),
  };
  const billing = {
    baseUrl: () => new URL('https://billing.test'),
    request: jest.fn(
      (
        _req: unknown,
        _method: string,
        _path: string,
        _body?: unknown,
      ): Promise<unknown> => {
        void [_req, _method, _path, _body];
        return Promise.resolve({ ready: true });
      },
    ),
  };
  const oauth = {
    choices: jest.fn(() => Promise.resolve(data.choices)),
    clients: jest.fn(() =>
      Promise.resolve(['portal', 'billing', 'console', 'legal'].map(identity)),
    ),
    activeClient: jest.fn(
      (clients: ReturnType<typeof identity>[], id: string) => {
        const found = clients.find((c) => c.clientId === id);
        if (!found) throw new Error('Unknown client');
        return found;
      },
    ),
    saveWithinLock: jest.fn(
      (
        _req: unknown,
        _draft: unknown,
        _id: string,
        _assert: unknown,
      ): Promise<unknown> => {
        void [_req, _draft, _id, _assert];
        return Promise.resolve(system);
      },
    ),
    validateService: jest.fn(() => Promise.resolve()),
  };
  const connection = {
    issuer: 'https://identity.test',
    tokenUrl: 'https://identity.test/oauth/token',
    clientId: 'portal',
    baseUrl: 'https://billing.test/api/v1',
    resource: 'https://billing.test',
    audience: 'billing-api',
    productCode: 'product',
    successUrl: 'https://portal.test/success',
    cancelUrl: 'https://portal.test/cancel',
    receiver: {
      audience: 'portal-api',
      billingClientId: 'billing',
      consoleClientId: 'console',
    },
    legal: {
      baseUrl: 'https://legal.test',
      audience: 'legal-api',
      resource: 'https://legal.test',
      verificationClientId: 'legal',
    },
  };
  const legalConnection = {
    baseUrl: 'https://legal.test',
    identityIssuer: 'https://identity.test',
    jwksUrl: 'https://identity.test/.well-known/jwks.json',
  };
  const transport = {
    endpoint: (url: string) => new URL(url),
    request: jest.fn(() =>
      Promise.resolve({
        ready: true,
        clientId: 'portal',
        productCode: 'product',
        connection,
        legalConnection,
      }),
    ),
  };
  const held = jest.fn(() => Promise.resolve());
  const lock = {
    run: jest.fn((work: (check: () => Promise<void>) => Promise<unknown>) =>
      work(held),
    ),
  };
  const config = new ConfigService({
    legalAdmin: { baseUrl: 'https://legal.test' },
    hemiaId: { service: { clientId: 'console', tokenUrl: '/oauth/token' } },
  });
  const subject = new SystemConnectionsService(
    legal as never,
    billing as never,
    oauth as never,
    transport as never,
    config,
    lock as never,
  );
  const options = jest.spyOn(subject, 'options').mockResolvedValue(data);
  const paymentOptions = jest
    .spyOn(subject, 'paymentOptions')
    .mockResolvedValue(billingOptions);
  const legalCatalog = jest
    .spyOn(subject, 'legalOptions')
    .mockResolvedValue(legalOptions);
  return {
    subject,
    data,
    system,
    capabilities,
    billingOptions,
    legalOptions,
    legal,
    billing,
    oauth,
    transport,
    held,
    lock,
    options,
    paymentOptions,
    legalCatalog,
  };
}
test('arbitrary capability reuses one registered client, preserves existing functions and never loads Billing or Legal documents', async () => {
  const f = fixture();
  const dto = simple('reports', ['send']);
  dto.capabilities[0].configuration = { channel: 'email' };
  const result = await f.subject.activate(req, dto);
  expect(result.status).toBe('configured');
  expect(result.ready).toBe(false);
  expect(result.configuration).toEqual({});
  expect(f.paymentOptions).not.toHaveBeenCalled();
  expect(f.billing.request).not.toHaveBeenCalled();
  expect(f.legalCatalog).not.toHaveBeenCalled();
  expect(f.transport.request).not.toHaveBeenCalled();
  const saved = f.oauth.saveWithinLock.mock.calls[0][1] as SystemRecord;
  expect(saved.clients[0].clientId).toBe('portal');
  expect(saved.clients[0].roles).toEqual(['read', 'send']);
  expect(saved.configuration.reports.channel).toBe('email');
});
test('base choices do not depend on Billing availability', async () => {
  const f = fixture();
  f.options.mockRestore();
  f.legal.request.mockImplementation((_method, path) =>
    Promise.resolve(path === 'systems' ? [f.system] : f.capabilities),
  );
  await f.subject.options(req);
  expect(f.billing.request).not.toHaveBeenCalled();
});
test('catalog only saves product policy with no organization access, redirects, documents or receiver', async () => {
  const f = fixture();
  const dto = {
    ...simple('payments', ['catalog']),
    payments: { productCode: 'product' },
  };
  const result = await f.subject.activate(req, dto);
  expect(result.status).toBe('configured');
  expect(f.legalCatalog).not.toHaveBeenCalled();
  expect(f.billing.request).toHaveBeenCalledWith(
    req,
    'PUT',
    'clients/portal',
    expect.objectContaining({
      organizationScope: 'organizations',
      organizationIds: [],
      allowedReturnOrigins: [],
    }),
  );
  expect(f.billing.request).toHaveBeenCalledTimes(1);
  expect(f.transport.request).not.toHaveBeenCalled();
  const config = JSON.parse(result.configuration.PAYMENTS_CONNECTION) as Record<
    string,
    unknown
  >;
  expect(config).not.toHaveProperty('successUrl');
  expect(config).not.toHaveProperty('clientSecret');
  expect(result.configuration).not.toHaveProperty('LEGAL_API_BASE_URL');
});
test('license reads require organization scope but no Legal or return URLs', async () => {
  const f = fixture();
  const dto = {
    ...simple('payments', ['licenses']),
    payments: { productCode: 'product' },
  };
  await expect(f.subject.activate(req, dto)).rejects.toThrow('alcance');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
  const result = await f.subject.activate(req, {
    ...dto,
    payments: {
      ...dto.payments,
      organizationScope: 'organizations',
      organizationIds: ['org'],
    },
  });
  expect(result.status).toBe('configured');
  expect(f.legalCatalog).not.toHaveBeenCalled();
});
test('receiver only grants verification and registers receiver without consumer policy or documents', async () => {
  const f = fixture();
  const result = await f.subject.activate(req, {
    ...simple('payments', ['receiver']),
    payments: { productCode: 'product', receiverService: 'license' },
  });
  expect(result.status).toBe('configured');
  expect(
    f.billing.request.mock.calls.some((c) => c[2] === 'clients/portal'),
  ).toBe(false);
  expect(f.billing.request.mock.calls.map((c) => c[2])).toEqual([
    'receivers/product',
    'receivers/product/check',
  ]);
  expect(f.legalCatalog).not.toHaveBeenCalled();
});
test('legal collector and validator do not load Billing and validator does not request documents', async () => {
  const f = fixture();
  await f.subject.activate(req, simple('legalAcceptances', ['validator']));
  expect(f.legalCatalog).not.toHaveBeenCalled();
  await f.subject.activate(req, {
    ...simple('legalAcceptances', ['collector']),
    legal: { applicationId: 'application', documentIds: ['doc'] },
  });
  expect(f.paymentOptions).not.toHaveBeenCalled();
  expect(f.legal.request).toHaveBeenCalledWith(
    'PUT',
    'integrations',
    req,
    expect.objectContaining({ systemId: 'system' }),
  );
});
test('checkout without Legal adds no acceptance integration, validator or Legal configuration', async () => {
  const f = fixture();
  delete f.system.configuration.legalAcceptances;
  const dto = full();
  dto.capabilities = [dto.capabilities[0]];
  delete dto.legal;
  const installed = await f.transport.request();
  delete (installed.connection as Partial<typeof installed.connection>).legal;
  delete (installed as Partial<typeof installed>).legalConnection;
  f.transport.request.mockResolvedValue(installed);
  const result = await f.subject.activate(req, dto);
  expect(result.status).toBe('verified');
  expect(f.legalCatalog).not.toHaveBeenCalled();
  expect(f.legal.request.mock.calls.some((c) => c[1] === 'integrations')).toBe(
    false,
  );
  const saved = f.oauth.saveWithinLock.mock.calls[0][1] as SystemRecord;
  expect(
    saved.clients.some((c) => c.capabilityCode === 'legalAcceptances'),
  ).toBe(false);
  expect(saved.configuration).not.toHaveProperty('legalAcceptances');
  expect(
    JSON.parse(result.configuration.PAYMENTS_CONNECTION),
  ).not.toHaveProperty('legal');
  expect(result.configuration).not.toHaveProperty('LEGAL_API_BASE_URL');
});
test('payment preset still verifies complete backend config and uses global policy without organizationIds', async () => {
  const f = fixture();
  const result = await f.subject.activate(req, full());
  expect(result.status).toBe('verified');
  expect(result.ready).toBe(true);
  const policy = f.billing.request.mock.calls.find(
    (c) => c[2] === 'clients/portal',
  )![3];
  expect(policy).not.toHaveProperty('organizationIds');
  expect(f.transport.request).toHaveBeenCalledTimes(1);
  expect(f.lock.run).toHaveBeenCalledTimes(1);
  expect(f.held).toHaveBeenCalled();
});
test('incorrect installed configuration reports pending and retry reuses the client', async () => {
  const f = fixture();
  f.transport.request.mockResolvedValueOnce({
    ...(await f.transport.request()),
    clientId: 'wrong',
  });
  const result = await f.subject.activate(req, full());
  expect(result.status).toBe('pending');
  expect(result.steps.at(-1)?.name).toBe('Configuración del backend');
  expect((await f.subject.activate(req, full())).ready).toBe(true);
});
test.each([
  { ...simple('reports', ['missing']) },
  {
    ...simple('reports'),
    capabilities: [
      {
        code: 'reports',
        functions: ['read'],
        configuration: { channel: 'hidden' },
      },
    ],
  },
  {
    ...simple('payments', ['catalog']),
    payments: {
      productCode: 'product',
      successUrl: 'https://portal.test/success',
    },
  },
  {
    ...simple('reports'),
    legal: { applicationId: 'application', documentIds: ['doc'] },
  },
  {
    ...full(),
    legal: { applicationId: 'application', documentIds: ['foreign'] },
  },
])(
  'rejects invalid functions, irrelevant data and foreign documents before mutations %#',
  async (dto) => {
    const f = fixture();
    await expect(f.subject.activate(req, dto)).rejects.toThrow();
    expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
    expect(f.billing.request).not.toHaveBeenCalled();
  },
);
test('ambiguous client requires selection instead of silently creating or choosing an identity', async () => {
  const f = fixture();
  f.system.clients.push({ ...f.system.clients[0], clientId: 'billing' });
  await expect(f.subject.activate(req, simple())).rejects.toThrow(
    'identidad única',
  );
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
});
test('failed owner stops remaining steps and a lost lock prevents all writes', async () => {
  const f = fixture();
  f.billing.request.mockRejectedValueOnce(new Error('Unavailable'));
  expect((await f.subject.activate(req, full())).status).toBe('pending');
  expect(f.legal.request.mock.calls.some((c) => c[0] === 'PUT')).toBe(false);
  f.held.mockRejectedValue(new Error('Lease lost'));
  f.oauth.saveWithinLock.mockClear();
  expect((await f.subject.activate(req, full())).status).toBe('pending');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
});

test('adding new function cannot silently extend permissions to another product already in the same client policy', async () => {
  const f = fixture();
  f.billingOptions.policies.push({
    clientId: 'portal',
    enabled: true,
    products: ['product', 'other'],
    allowSharedCheckouts: false,
    organizationScope: 'all_for_allowed_products',
    allowedReturnOrigins: [],
  });
  f.capabilities
    .find((c) => c.code === 'payments')!
    .functions.find((fn) => fn.code === 'checkout')!.scopes = [
    { audience: 'billing-api', code: 'billing.integration.checkout.create' },
  ];
  await expect(f.subject.activate(req, full())).rejects.toThrow(
    'función nueva',
  );
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
  expect(f.billing.request).not.toHaveBeenCalled();
});
test('existing org-scoped OAuth grants without a policy cannot create a partial catalog-only connection', async () => {
  const f = fixture();
  const clients = await f.oauth.clients();
  clients[0].serviceDestinations = [
    {
      resource: 'https://billing.test',
      audience: 'billing-api',
      scopes: ['billing.integration.checkout.create'],
    },
  ];
  f.oauth.clients.mockResolvedValue(clients);
  await expect(
    f.subject.activate(req, {
      ...simple('payments', ['catalog']),
      payments: { productCode: 'product' },
    }),
  ).rejects.toThrow('requieren organizaciones');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
});
test('adding catalog access preserves existing backend returns and existing organization policy', async () => {
  const f = fixture();
  f.system.configuration.payments = {
    productCode: 'product',
    successUrl: 'https://portal.test/paid',
    cancelUrl: 'https://portal.test/cancel',
  };
  f.billingOptions.policies.push({
    clientId: 'portal',
    enabled: true,
    products: ['product'],
    allowSharedCheckouts: false,
    organizationScope: 'organizations',
    organizationIds: ['org'],
    allowedReturnOrigins: ['https://portal.test'],
  });
  const result = await f.subject.activate(req, {
    ...simple('payments', ['catalog']),
    payments: { productCode: 'product' },
  });
  expect(JSON.parse(result.configuration.PAYMENTS_CONNECTION)).toMatchObject({
    successUrl: 'https://portal.test/paid',
    cancelUrl: 'https://portal.test/cancel',
  });
  expect(f.billing.request).toHaveBeenCalledWith(
    req,
    'PUT',
    'clients/portal',
    expect.objectContaining({ organizationIds: ['org'] }),
  );
});

test('existing checkout scope without return origins is rejected before persisting catalog-only connection', async () => {
  const f = fixture();
  const clients = await f.oauth.clients();
  clients[0].serviceDestinations = [
    {
      resource: 'https://billing.test',
      audience: 'billing-api',
      scopes: ['billing.integration.checkout.create'],
    },
  ];
  f.oauth.clients.mockResolvedValue(clients);
  f.billingOptions.policies.push({
    clientId: 'portal',
    enabled: true,
    products: ['product'],
    organizationScope: 'all_for_allowed_products',
    allowedReturnOrigins: [],
    allowSharedCheckouts: false,
  });
  await expect(
    f.subject.activate(req, {
      ...simple('payments', ['catalog']),
      payments: { productCode: 'product' },
    }),
  ).rejects.toThrow('URLs de retorno');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
});

test('complete connection includes public module metadata so integrations do not configure technical clients manually', async () => {
  const f = fixture();
  const result = await f.subject.activate(req, full());
  const generated = JSON.parse(
    result.configuration.PAYMENTS_CONNECTION,
  ) as Record<string, unknown>;
  expect(generated.receiver).toEqual({
    audience: 'portal-api',
    billingClientId: 'billing',
    consoleClientId: 'console',
  });
  expect(generated.legal).toEqual({
    baseUrl: 'https://legal.test',
    audience: 'legal-api',
    resource: 'https://legal.test',
    verificationClientId: 'legal',
  });
  expect(result.status).toBe('verified');
  expect(generated).not.toHaveProperty('clientSecret');
});

test('collector with catalog derives callback audience without receiving licenses', async () => {
  const f = fixture();
  const dto = full();
  dto.capabilities[0].functions = ['catalog'];
  dto.payments = { productCode: 'product' };
  const result = await f.subject.activate(req, dto);
  const generated = JSON.parse(result.configuration.PAYMENTS_CONNECTION) as {
    receiver: { audience: string };
    legal: { verificationClientId: string };
  };
  expect(generated.receiver.audience).toBe('portal-api');
  expect(generated.legal.verificationClientId).toBe('legal');
});

test('one backend URL registers SDK routes with client audience, preserving API prefix and existing services', async () => {
  const f = fixture();
  f.system.services = [];
  const dto = full();
  dto.payments!.backendBaseUrl = 'https://portal.test/api/v1/';
  delete dto.payments!.receiverService;
  delete dto.payments!.checkService;
  const result = await f.subject.activate(req, dto);
  expect(result.status).toBe('verified');
  const saved = f.oauth.saveWithinLock.mock.calls[0][1] as SystemRecord;
  expect(
    saved.services.map((s) => [s.code, s.url, s.audience, s.resource]),
  ).toEqual([
    [
      'payments-license',
      'https://portal.test/api/v1/payments/webhooks/license',
      'portal-api',
      'https://portal.test',
    ],
    [
      'payments-check',
      'https://portal.test/api/v1/payments/integration-status',
      'portal-api',
      'https://portal.test',
    ],
    [
      'payments-legal-context',
      'https://portal.test/api/v1/payments/legal/context',
      'portal-api',
      'https://portal.test',
    ],
  ]);
  expect(saved.configuration.legalAcceptances.contextService).toBe(
    'payments-legal-context',
  );
  expect(saved.configuration.legalAcceptances.identityIssuer).toBe(
    'urn:hemia:portal',
  );
  expect(saved.configuration.payments.receiverService).toBe('payments-license');
  expect(f.system.services).toEqual([]);
});

test('standard backend rejects unsafe URLs, missing client audience, conflicting services and mixed selectors before saving', async () => {
  for (const url of [
    'https://portal.test/api?secret=x',
    'https://portal.test/api#x',
    'https://user:password@portal.test/api',
    'http://public.test/api',
  ]) {
    const f = fixture();
    const dto = full();
    dto.payments!.backendBaseUrl = url;
    delete dto.payments!.receiverService;
    delete dto.payments!.checkService;
    await expect(f.subject.activate(req, dto)).rejects.toThrow('URL base');
    expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
  }
  const f = fixture();
  const dto = full();
  dto.payments!.backendBaseUrl = 'https://portal.test/api';
  await expect(f.subject.activate(req, dto)).rejects.toThrow('no ambos');
  delete dto.payments!.receiverService;
  delete dto.payments!.checkService;
  const clients = await f.oauth.clients();
  clients[0].audience = '';
  f.oauth.clients.mockResolvedValue(clients);
  await expect(f.subject.activate(req, dto)).rejects.toThrow('audiencia');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
});

test('payments-only standard connection is repeatable without Legal or pre-registered services', async () => {
  const f = fixture();
  f.system.services = [];
  f.system.configuration = { reports: {} };
  const dto = full();
  dto.capabilities = [dto.capabilities[0]];
  delete dto.legal;
  dto.payments!.backendBaseUrl = 'https://portal.test/api';
  delete dto.payments!.receiverService;
  delete dto.payments!.checkService;
  expect((await f.subject.activate(req, dto)).status).toBe('verified');
  expect(f.legalCatalog).not.toHaveBeenCalled();
  const saved = f.oauth.saveWithinLock.mock.calls[0][1] as SystemRecord;
  expect(saved.services).toHaveLength(2);
  expect(saved.configuration).not.toHaveProperty('legalAcceptances');
  f.data.systems[0] = { ...saved, id: 'system' };
  expect((await f.subject.activate(req, dto)).status).toBe('verified');
  const repeated = f.oauth.saveWithinLock.mock.calls[1][1] as SystemRecord;
  expect(repeated.services).toEqual(saved.services);
});

test('standard route conflicts and production HTTP loopback are rejected before writes', async () => {
  const dto = full();
  dto.payments!.backendBaseUrl = 'https://portal.test/api';
  delete dto.payments!.receiverService;
  delete dto.payments!.checkService;
  const f = fixture();
  f.system.services.push({
    code: 'payments-license',
    name: 'Existing',
    url: 'https://other.test/license',
    resource: 'https://other.test',
    audience: 'other-api',
    enabled: true,
  });
  await expect(f.subject.activate(req, dto)).rejects.toThrow('otro destino');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
  const previous = process.env.NODE_ENV;
  try {
    process.env.NODE_ENV = 'production';
    const production = fixture();
    dto.payments!.backendBaseUrl = 'http://127.0.0.1:9000/api';
    await expect(production.subject.activate(req, dto)).rejects.toThrow(
      'URL base',
    );
    expect(production.oauth.saveWithinLock).not.toHaveBeenCalled();
  } finally {
    process.env.NODE_ENV = previous;
  }
});

test('subscription management requires organization scope and generates its selected catalog scope without granting it to catalog-only connections', async () => {
  const f = fixture();
  f.capabilities
    .find((c) => c.code === 'payments')!
    .functions.push({
      code: 'subscriptions',
      scopes: [
        { audience: 'billing-api', code: 'billing.subscriptions.manage' },
      ],
    });
  const dto = {
    ...simple('payments', ['subscriptions']),
    payments: {
      productCode: 'product',
      successUrl: 'https://portal.test/changed',
      cancelUrl: 'https://portal.test/unchanged',
    },
  };
  await expect(f.subject.activate(req, dto)).rejects.toThrow('alcance');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
  const result = await f.subject.activate(req, {
    ...dto,
    payments: {
      productCode: 'product',
      organizationScope: 'organizations',
      organizationIds: ['org'],
      successUrl: 'https://portal.test/changed',
      cancelUrl: 'https://portal.test/unchanged',
    },
  });
  expect(result.status).toBe('configured');
  const saved = f.oauth.saveWithinLock.mock.calls[0][1] as SystemRecord;
  expect(
    saved.clients.find((c) => c.capabilityCode === 'payments')?.roles,
  ).toContain('subscriptions');
  expect(JSON.parse(result.configuration.PAYMENTS_CONNECTION)).toMatchObject({
    clientId: 'portal',
    productCode: 'product',
  });
  expect(
    f.billing.request.mock.calls.find((c) => c[2] === 'clients/portal')?.[3],
  ).toMatchObject({
    organizationScope: 'organizations',
    organizationIds: ['org'],
  });
  const readOnly = fixture();
  readOnly.capabilities
    .find((c) => c.code === 'payments')!
    .functions.push({
      code: 'subscriptions',
      scopes: [
        { audience: 'billing-api', code: 'billing.subscriptions.manage' },
      ],
    });
  await readOnly.subject.activate(req, {
    ...simple('payments', ['catalog']),
    payments: { productCode: 'product' },
  });
  expect(
    JSON.stringify(readOnly.oauth.saveWithinLock.mock.calls),
  ).not.toContain('billing.subscriptions.manage');
});
test('an existing subscription grant cannot silently acquire a different product through a catalog-only connection', async () => {
  const f = fixture();
  const clients = await f.oauth.clients();
  clients[0].serviceDestinations = [
    {
      resource: 'https://billing.test',
      audience: 'billing-api',
      scopes: ['billing.subscriptions.manage'],
    },
  ];
  f.oauth.clients.mockResolvedValue(clients);
  f.billingOptions.policies.push({
    clientId: 'portal',
    enabled: true,
    products: ['other'],
    allowSharedCheckouts: false,
    organizationScope: 'all_for_allowed_products',
    allowedReturnOrigins: [],
  });
  await expect(
    f.subject.activate(req, {
      ...simple('payments', ['catalog']),
      payments: { productCode: 'product' },
    }),
  ).rejects.toThrow('otras funciones');
  expect(f.oauth.saveWithinLock).not.toHaveBeenCalled();
});
