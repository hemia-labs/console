import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { InvitationsService } from 'src/modules/identity-access/invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
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
        InvitationsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(InvitationsService);
  });

  it('creates an invitation with body', async () => {
    const dto = {
      email: 'ana@example.com',
      organizationId: '2df6e282-1517-48ff-9441-8cf80e65399f',
      teamId: '3df6e282-1517-48ff-9441-8cf80e65399f',
      roleId: '4df6e282-1517-48ff-9441-8cf80e65399f',
      expiresAt: '2026-07-01T00:00:00.000Z',
      redirectUrl: 'https://console.hemia.cloud/invitations',
      message: 'Welcome',
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/invitations',
      body: dto,
      auth,
    });
  });

  it('resends an invitation without body', async () => {
    await service.resend('invitation-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/invitations/invitation-id/resend',
      auth,
    });
  });

  it('cancels an invitation without body', async () => {
    await service.cancel('invitation-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/invitations/invitation-id/cancel',
      auth,
    });
  });

  it.each([
    new UnauthorizedException('Missing auth'),
    new ForbiddenException('Forbidden'),
    new ServiceUnavailableException('Hemia ID down'),
  ])('propagates Hemia ID client exception %p', async (exception) => {
    hemiaIdAdminClient.request.mockRejectedValue(exception);

    await expect(
      service.create({ email: 'ana@example.com' }, auth),
    ).rejects.toBe(exception);
  });
});
