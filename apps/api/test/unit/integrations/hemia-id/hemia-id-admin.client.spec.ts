import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';

describe('HemiaIdAdminClient', () => {
  let client: HemiaIdAdminClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    client = new HemiaIdAdminClient({
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          'hemiaId.baseUrl': 'http://localhost:3000/',
          'hemiaId.adminPrefix': '/api/v1',
          'hemiaId.timeoutMs': 5000,
          'hemiaId.service.clientId': 'identity-admin-service',
          'hemiaId.service.clientSecret': 'service-secret',
          'hemiaId.service.scopes':
            'identity.users.read identity.oauth_clients.read',
          'hemiaId.service.tokenUrl': '/oauth/token',
        };

        return values[key];
      }),
    } as unknown as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('builds URL with prefix, path and query params', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await client.request({
      method: 'GET',
      path: '/tenants',
      query: {
        search: 'acme',
        page: 2,
        active: true,
        ignored: undefined,
        ids: ['one', 'two'],
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/v1/tenants?search=acme&page=2&active=true&ids=one&ids=two',
      expect.any(Object),
    );
  });

  it('forwards only auth headers needed by Hemia ID', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await client.request({
      method: 'GET',
      path: 'users',
      auth: {
        authorization: 'Bearer secret-token',
        cookie: 'access_token=secret-cookie',
        tenantId: 'tenant-id',
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer secret-token',
          Cookie: 'access_token=secret-cookie',
          'X-Tenant-Id': 'tenant-id',
        },
      }),
    );
  });

  it('serializes JSON body and omits body for GET', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 'tenant-id' }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await client.request({
      method: 'POST',
      path: 'tenants',
      body: { name: 'Acme' },
    });
    await client.request({
      method: 'GET',
      path: 'tenants',
      body: { ignored: true },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify({ name: 'Acme' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      expect.objectContaining({
        body: undefined,
        headers: {
          Accept: 'application/json',
        },
      }),
    );
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(
      client.request({ method: 'DELETE', path: 'tenants/tenant-id' }),
    ).resolves.toBeUndefined();
  });

  it('returns body and Set-Cookie headers when requested', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ok: true }, 200, {
        'set-cookie': 'access_token=next-token; HttpOnly; Path=/',
      }),
    );

    await expect(
      client.requestWithHeaders({
        method: 'POST',
        path: 'accounts/switch',
        body: { accountIndex: 1 },
      }),
    ).resolves.toEqual({
      body: { ok: true },
      setCookie: ['access_token=next-token; HttpOnly; Path=/'],
    });
  });

  it('returns response metadata when requested', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ ok: true }, 200, {
        'x-request-id': 'admin-request-id',
      }),
    );

    await expect(
      client.requestWithMetadata({
        method: 'GET',
        path: 'health',
      }),
    ).resolves.toEqual({
      body: { ok: true },
      metadata: { requestId: 'admin-request-id' },
    });
  });

  it('requests a client_credentials token and calls Admin API with service bearer auth', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'm2m-token', expires_in: 300 }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'user-id' }));

    await expect(
      client.requestService({
        method: 'GET',
        path: '/users',
        query: { email: 'ana@example.com' },
      }),
    ).resolves.toEqual({ id: 'user-id' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/oauth/token',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: 'identity-admin-service',
          client_secret: 'service-secret',
          scope: 'identity.users.read identity.oauth_clients.read',
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/api/v1/users?email=ana%40example.com',
      expect.objectContaining({
        method: 'GET',
        body: undefined,
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer m2m-token',
        },
      }),
    );
  });

  it('caches service token until expiration margin', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'cached-token', expires_in: 300 }),
      )
      .mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));

    await client.requestService({ method: 'GET', path: '/users' });
    await client.requestService({ method: 'GET', path: '/oauth-clients' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/api/v1/oauth-clients',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer cached-token',
        },
      }),
    );
  });

  it('refreshes service token after expiration margin', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'first-token', expires_in: 31 }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }))
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'second-token', expires_in: 300 }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    await client.requestService({ method: 'GET', path: '/users' });
    nowSpy.mockReturnValue(2_500);
    await client.requestService({ method: 'GET', path: '/oauth-clients' });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'http://localhost:3000/api/v1/oauth-clients',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer second-token',
        },
      }),
    );
  });

  it('fails when service credentials are missing', async () => {
    client = new HemiaIdAdminClient({
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          'hemiaId.baseUrl': 'http://localhost:3000',
          'hemiaId.adminPrefix': '/api/v1',
          'hemiaId.timeoutMs': 5000,
          'hemiaId.service.tokenUrl': '/oauth/token',
        };

        return values[key];
      }),
    } as unknown as ConfigService);

    await expect(
      client.requestService({ method: 'GET', path: '/users' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [400, BadRequestException],
    [422, BadRequestException],
    [401, UnauthorizedException],
    [403, ForbiddenException],
    [404, NotFoundException],
    [409, ConflictException],
    [500, ServiceUnavailableException],
  ])('maps %s responses to Nest exceptions', async (status, exception) => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Mapped error' }, status),
    );

    await expect(
      client.request({ method: 'GET', path: 'tenants' }),
    ).rejects.toBeInstanceOf(exception);
  });

  it('does not expose sensitive error messages', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'clientSecret leaked' }, 400),
    );

    await expect(
      client.request({
        method: 'POST',
        path: 'oauth-clients',
        auth: {
          authorization: 'Bearer secret-token',
          cookie: 'access_token=secret-cookie',
        },
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: 'Hemia ID Admin API request failed',
      }),
    });
  });

  it.each([
    'authorization leaked',
    'cookie leaked',
    'access_token leaked',
    'refresh_token leaked',
    'client_id leaked',
    'client_secret leaked',
  ])('redacts sensitive error message %s', async (message) => {
    fetchMock.mockResolvedValue(jsonResponse({ message }, 400));

    await expect(
      client.request({ method: 'GET', path: 'health' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: 'Hemia ID Admin API request failed',
      }),
    });
  });

  it('does not expose sensitive service token error messages', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'client_id identity-admin-service leaked' }, 400),
    );

    await expect(
      client.requestService({ method: 'GET', path: '/users' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: 'Hemia ID Admin API request failed',
      }),
    });
  });

  it('maps timeout/network errors to ServiceUnavailableException', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(
      client.request({ method: 'GET', path: 'health' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});

const jsonResponse = (
  payload: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
