import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { SsoClientStatus } from 'src/modules/identity-access/types/sso-client-status';
import { SsoClientsService } from 'src/modules/identity-access/sso-clients.service';

describe('SsoClientsService', () => {
  let service: SsoClientsService;
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
        SsoClientsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(SsoClientsService);
  });

  it('finds all SSO clients', async () => {
    await service.findAll(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/sso-clients',
      auth,
    });
  });

  it('finds one SSO client', async () => {
    await service.findOne('client-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/sso-clients/client-id',
      auth,
    });
  });

  it('creates a SSO client with body', async () => {
    const dto = {
      clientId: 'console-sso',
      name: 'Console SSO',
      allowedRedirectUris: ['https://console.hemia.cloud/sso/callback'],
      allowedOrigins: ['https://console.hemia.cloud'],
      status: SsoClientStatus.Active,
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/sso-clients',
      body: dto,
      auth,
    });
  });

  it('updates a SSO client with body', async () => {
    const dto = {
      name: 'Console SSO Updated',
      allowedOrigins: ['https://admin.hemia.cloud'],
      status: SsoClientStatus.Suspended,
    };

    await service.update('client-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/sso-clients/client-id',
      body: dto,
      auth,
    });
  });

  it('removes a SSO client', async () => {
    await service.remove('client-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/sso-clients/client-id',
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
