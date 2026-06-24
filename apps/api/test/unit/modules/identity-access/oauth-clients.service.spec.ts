import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { OAuthClientStatus } from 'src/modules/identity-access/types/oauth-client-status';
import { OAuthClientType } from 'src/modules/identity-access/types/oauth-client-type';
import { OAuthClientsService } from 'src/modules/identity-access/oauth-clients.service';

describe('OAuthClientsService', () => {
  let service: OAuthClientsService;
  let hemiaIdAdminClient: { request: jest.Mock };

  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ ok: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthClientsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(OAuthClientsService);
  });

  it('finds all OAuth clients', async () => {
    await service.findAll(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/oauth-clients',
      auth,
    });
  });

  it('finds one OAuth client', async () => {
    await service.findOne('client-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/oauth-clients/client-id',
      auth,
    });
  });

  it('creates an OAuth client with body', async () => {
    const dto = {
      clientId: 'console-app',
      audience: 'https://api.hemia.cloud',
      type: OAuthClientType.Confidential,
      redirectUris: ['https://console.hemia.cloud/callback'],
      grantTypes: ['authorization_code'],
      responseTypes: ['code'],
      scopes: ['openid', 'profile'],
      requiresConsent: true,
      status: OAuthClientStatus.Active,
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/oauth-clients',
      body: dto,
      auth,
    });
  });

  it('updates an OAuth client with body', async () => {
    const dto = {
      redirectUris: ['https://console.hemia.cloud/new-callback'],
      status: OAuthClientStatus.Suspended,
    };

    await service.update('client-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/oauth-clients/client-id',
      body: dto,
      auth,
    });
  });

  it('rotates an OAuth client secret without body', async () => {
    await service.rotateSecret('client-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/oauth-clients/client-id/rotate-secret',
      auth,
    });
  });

  it.each([
    ['redirect-uris' as const, 'https://console.hemia.cloud/callback'],
    ['scopes' as const, 'openid'],
    ['grant-types' as const, 'authorization_code'],
    ['response-types' as const, 'code'],
  ])('adds OAuth client %s value', async (listPath, value) => {
    await service.addListValue('client-id', listPath, { value }, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: `/oauth-clients/client-id/${listPath}`,
      body: { value },
      auth,
    });
  });

  it.each([
    ['redirect-uris' as const, 'https://console.hemia.cloud/callback'],
    ['scopes' as const, 'openid'],
    ['grant-types' as const, 'authorization_code'],
    ['response-types' as const, 'code'],
  ])('removes OAuth client %s value', async (listPath, value) => {
    await service.removeListValue('client-id', listPath, { value }, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: `/oauth-clients/client-id/${listPath}`,
      body: { value },
      auth,
    });
  });

  it('removes an OAuth client', async () => {
    await service.remove('client-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/oauth-clients/client-id',
      auth,
    });
  });

  it.each([
    new UnauthorizedException('Missing auth'),
    new ForbiddenException('Forbidden'),
    new ServiceUnavailableException('Hemia ID down'),
  ])('propagates Hemia ID client exception %p', async (exception) => {
    hemiaIdAdminClient.request.mockRejectedValue(exception);

    await expect(service.findAll(auth)).rejects.toBe(exception);
  });
});
