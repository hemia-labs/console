import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdExternalClient } from 'src/integrations/hemia-id/hemia-id-external.client';
import { ExternalIdentityAccessService } from 'src/modules/identity-access/external-identity-access.service';

describe('ExternalIdentityAccessService', () => {
  let service: ExternalIdentityAccessService;
  let hemiaIdExternalClient: { request: jest.Mock };

  beforeEach(async () => {
    hemiaIdExternalClient = {
      request: jest.fn().mockResolvedValue({ ok: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExternalIdentityAccessService,
        {
          provide: HemiaIdExternalClient,
          useValue: hemiaIdExternalClient,
        },
      ],
    }).compile();

    service = module.get(ExternalIdentityAccessService);
  });

  it('maps External API paths', async () => {
    await service.findUserByEmail('ana@example.com');
    await service.findUserBySub('user-sub');
    await service.findMembershipsBySub('user-sub');
    await service.findTeams();
    await service.createInvitation({ email: 'ana@example.com' });
    await service.resendInvitation('2df6e282-1517-48ff-9441-8cf80e65399f');
    await service.cancelInvitation('2df6e282-1517-48ff-9441-8cf80e65399f');
    await service.findEvents();

    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/users/by-email',
      query: { email: 'ana@example.com' },
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/users/by-sub/user-sub',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: '/users/user-sub/memberships',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(4, {
      method: 'GET',
      path: '/teams',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(5, {
      method: 'POST',
      path: '/invitations',
      body: { email: 'ana@example.com' },
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(6, {
      method: 'POST',
      path: '/invitations/2df6e282-1517-48ff-9441-8cf80e65399f/resend',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(7, {
      method: 'POST',
      path: '/invitations/2df6e282-1517-48ff-9441-8cf80e65399f/cancel',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(8, {
      method: 'GET',
      path: '/events',
    });
  });
});
