import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { IdentityAccessService } from 'src/modules/identity-access/identity-access.service';

describe('IdentityAccessService', () => {
  let service: IdentityAccessService;
  let hemiaIdAdminClient: { request: jest.Mock };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentityAccessService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(IdentityAccessService);
  });

  it('checks Hemia ID health endpoints with forwarded auth', async () => {
    const auth = {
      authorization: 'Bearer access-token',
      cookie: 'access_token=cookie-token',
    };
    hemiaIdAdminClient.request
      .mockResolvedValueOnce({ live: 'ok' })
      .mockResolvedValueOnce({ startup: 'ok' })
      .mockResolvedValueOnce({ ready: 'ok' });

    await expect(service.getHemiaIdHealth(auth)).resolves.toEqual({
      status: 'ok',
      live: { live: 'ok' },
      startup: { startup: 'ok' },
      ready: { ready: 'ok' },
    });

    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/health/live',
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/health/startup',
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: '/health/ready',
      auth,
    });
  });

  it('propagates Hemia ID client exceptions', async () => {
    hemiaIdAdminClient.request.mockRejectedValue(
      new ServiceUnavailableException('Hemia ID down'),
    );

    await expect(service.getHemiaIdHealth({})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
