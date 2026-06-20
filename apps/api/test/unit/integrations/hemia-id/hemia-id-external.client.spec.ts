import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HemiaIdExternalClient } from 'src/integrations/hemia-id/hemia-id-external.client';

describe('HemiaIdExternalClient', () => {
  let client: HemiaIdExternalClient;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    client = new HemiaIdExternalClient({
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          'hemiaId.baseUrl': 'http://localhost:3000/',
          'hemiaId.adminPrefix': '/api/v1',
          'hemiaId.timeoutMs': 5000,
          'hemiaId.external.clientId': 'external-client',
          'hemiaId.external.clientSecret': 'external-secret',
          'hemiaId.external.scopes': 'events:read users:read',
          'hemiaId.external.tokenUrl': '/oauth/token',
        };

        return values[key];
      }),
    } as unknown as ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requests a client_credentials token and calls External API with bearer auth', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'm2m-token', expires_in: 300 }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'user-id' }));

    await expect(
      client.request({
        method: 'GET',
        path: '/users/by-email',
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
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials&client_id=external-client&client_secret=external-secret&scope=events%3Aread+users%3Aread',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/api/v1/external/users/by-email?email=ana%40example.com',
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

  it('caches token until expiration margin', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'cached-token', expires_in: 300 }),
      )
      .mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));

    await client.request({ method: 'GET', path: '/teams' });
    await client.request({ method: 'GET', path: '/events' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://localhost:3000/api/v1/external/events',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer cached-token',
        },
      }),
    );
  });

  it('refreshes token after expiration margin', async () => {
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

    await client.request({ method: 'GET', path: '/teams' });
    nowSpy.mockReturnValue(2_500);
    await client.request({ method: 'GET', path: '/events' });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      'http://localhost:3000/api/v1/external/events',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer second-token',
        },
      }),
    );
  });

  it('returns response metadata when requested', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'm2m-token', expires_in: 300 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ ok: true }, 200, {
          'x-correlation-id': 'external-correlation-id',
        }),
      );

    await expect(
      client.requestWithMetadata({ method: 'GET', path: '/events' }),
    ).resolves.toEqual({
      body: { ok: true },
      metadata: { requestId: 'external-correlation-id' },
    });
  });

  it('fails when M2M credentials are missing', async () => {
    client = new HemiaIdExternalClient({
      get: jest.fn((key: string) => {
        const values: Record<string, string | number> = {
          'hemiaId.baseUrl': 'http://localhost:3000',
          'hemiaId.adminPrefix': '/api/v1',
          'hemiaId.timeoutMs': 5000,
          'hemiaId.external.tokenUrl': '/oauth/token',
        };

        return values[key];
      }),
    } as unknown as ConfigService);

    await expect(
      client.request({ method: 'GET', path: '/events' }),
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
    fetchMock.mockResolvedValue(jsonResponse({ message: 'Mapped error' }, status));

    await expect(
      client.request({ method: 'GET', path: '/events' }),
    ).rejects.toBeInstanceOf(exception);
  });

  it('does not expose sensitive token error messages', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'client_id external-client leaked' }, 400),
    );

    await expect(
      client.request({ method: 'GET', path: '/events' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: 'Hemia ID External API request failed',
      }),
    });
  });

  it('does not expose sensitive External API error messages', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'm2m-token', expires_in: 300 }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ message: 'access_token leaked' }, 400),
      );

    await expect(
      client.request({ method: 'GET', path: '/events' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: 'Hemia ID External API request failed',
      }),
    });
  });

  it.each([
    'authorization leaked',
    'cookie leaked',
    'access_token leaked',
    'refresh_token leaked',
    'client_secret leaked',
    'password leaked',
  ])('redacts sensitive error message %s', async (message) => {
    fetchMock.mockResolvedValue(jsonResponse({ message }, 400));

    await expect(
      client.request({ method: 'GET', path: '/events' }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        message: 'Hemia ID External API request failed',
      }),
    });
  });

  it('maps timeout/network errors to ServiceUnavailableException', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(
      client.request({ method: 'GET', path: '/events' }),
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
