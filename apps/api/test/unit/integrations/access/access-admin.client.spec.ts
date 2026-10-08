import {
  ConflictException,
  ServiceUnavailableException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditRequestContext } from 'src/common/audit/audit-request-context';
import { AccessAdminClient } from 'src/integrations/access/access-admin.client';

describe('AccessAdminClient', () => {
  let client: AccessAdminClient;
  let fetchMock: jest.Mock;
  let auditRequestContext: { addUpstreamCall: jest.Mock };

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    auditRequestContext = { addUpstreamCall: jest.fn() };
    client = new AccessAdminClient(
      {
        get: jest.fn((key: string) => {
          const values: Record<string, string | number> = {
            'accessAdmin.apiBaseUrl': 'http://localhost:3019/',
            'accessAdmin.clientId': 'console-access-admin',
            'accessAdmin.clientSecret': 'access-secret',
            'accessAdmin.scopes': 'organization.read role.read',
            'accessAdmin.timeoutMs': 5000,
            'accessAdmin.tokenUrl': 'http://localhost:3000/oauth/token',
          };

          return values[key];
        }),
        getOrThrow: jest.fn((key: string) => {
          const values: Record<string, string> = {
            'accessAdmin.apiBaseUrl': 'http://localhost:3019',
            'accessAdmin.tokenUrl': 'http://localhost:3000/oauth/token',
          };

          return values[key];
        }),
      } as unknown as ConfigService,
      auditRequestContext as unknown as AuditRequestContext,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publishes with the exchanged human token without obtaining a service token or logging it', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ catalogVersion: 2, replayed: false, roles: [] }),
    );
    await client.requestAsUser(
      { method: 'POST', path: '/v1/system-roles/catalogs/legal/v2', body: {} },
      'human-exchanged-token',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3019/v1/system-roles/catalogs/legal/v2',
      expect.objectContaining({
        redirect: 'error',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: 'Bearer human-exchanged-token',
        },
        body: '{}',
      }),
    );
    expect(
      JSON.stringify(auditRequestContext.addUpstreamCall.mock.calls),
    ).not.toContain('human-exchanged-token');
  });

  it('preserves forbidden responses for human publication without falling back to a service token', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          code: 'ACCESS_FORBIDDEN',
          detail: 'Active platform administrator authority is required',
        },
        403,
      ),
    );
    await expect(
      client.requestAsUser(
        {
          method: 'POST',
          path: '/v1/system-roles/catalogs/legal/v2',
          body: {},
        },
        'human-exchanged-token',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('requests a JSON client_credentials token and calls Access', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'm2m-token', expires_in: 300 }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'organization-id' }));

    await expect(
      client.request({
        method: 'GET',
        path: '/v1/organizations',
        query: { search: 'acme', limit: 50 },
      }),
    ).resolves.toEqual({ id: 'organization-id' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:3000/oauth/token',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }),
    );
    const tokenRequest = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(tokenRequest[1].body).toBe(
      JSON.stringify({
        client_id: 'console-access-admin',
        client_secret: 'access-secret',
        grant_type: 'client_credentials',
        scope: 'organization.read role.read',
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3019/v1/organizations?search=acme&limit=50',
      expect.objectContaining({
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer m2m-token',
        },
      }),
    );
  });

  it('caches the service token until the refresh margin', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'cached-token', expires_in: 300 }),
      )
      .mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));

    await client.request({ method: 'GET', path: '/v1/roles' });
    await client.request({ method: 'GET', path: '/v1/permissions' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    const permissionsRequest = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(permissionsRequest[0]).toBe('http://localhost:3019/v1/permissions');
    expect(permissionsRequest[1].headers).toEqual(
      expect.objectContaining({ Authorization: 'Bearer cached-token' }),
    );
  });

  it('maps Access problem details and preserves trace_id', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ access_token: 'm2m-token', expires_in: 300 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            code: 'ACCESS_CONFLICT',
            detail: 'Organization already exists',
            trace_id: 'trace-123',
          },
          409,
        ),
      );

    await expect(
      client.request({ method: 'POST', path: '/v1/organizations' }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(auditRequestContext.addUpstreamCall).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'access', traceId: 'trace-123' }),
    );
  });

  it.each([
    [401, ServiceUnavailableException],
    [403, ServiceUnavailableException],
    [500, ServiceUnavailableException],
  ])(
    'maps Access status %s to the Console exception',
    async (status, exception) => {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({ access_token: 'm2m-token', expires_in: 300 }),
        )
        .mockResolvedValueOnce(
          jsonResponse({ detail: 'Access failure' }, status),
        );

      await expect(
        client.request({ method: 'GET', path: '/v1/roles' }),
      ).rejects.toBeInstanceOf(exception);
    },
  );

  it('does not call upstream when credentials are missing', async () => {
    client = new AccessAdminClient(
      {
        get: jest.fn((key: string) =>
          key === 'accessAdmin.clientId' ? 'console-access-admin' : undefined,
        ),
        getOrThrow: jest.fn(),
      } as unknown as ConfigService,
      auditRequestContext as unknown as AuditRequestContext,
    );

    await expect(
      client.request({ method: 'GET', path: '/v1/roles' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps network failures to ServiceUnavailableException', async () => {
    fetchMock.mockRejectedValue(new DOMException('Aborted', 'AbortError'));

    await expect(
      client.request({ method: 'GET', path: '/v1/roles' }),
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
