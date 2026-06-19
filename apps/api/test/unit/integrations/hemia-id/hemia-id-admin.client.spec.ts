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
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer secret-token',
          Cookie: 'access_token=secret-cookie',
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
