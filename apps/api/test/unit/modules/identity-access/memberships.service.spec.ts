import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { MembershipsService } from 'src/modules/identity-access/memberships.service';

describe('MembershipsService', () => {
  let service: MembershipsService;
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
        MembershipsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(MembershipsService);
  });

  it('finds all memberships with query', async () => {
    const query = { userId: '2df6e282-1517-48ff-9441-8cf80e65399f' };

    await service.findAll(query, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/memberships',
      query,
      auth,
    });
  });

  it('creates a membership with body', async () => {
    const dto = {
      userId: '2df6e282-1517-48ff-9441-8cf80e65399f',
      organizationId: '3df6e282-1517-48ff-9441-8cf80e65399f',
      teamId: '4df6e282-1517-48ff-9441-8cf80e65399f',
      roleId: '5df6e282-1517-48ff-9441-8cf80e65399f',
      status: 'active',
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/memberships',
      body: dto,
      auth,
    });
  });

  it('updates membership status', async () => {
    const dto = { status: 'inactive' };

    await service.updateStatus('membership-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/memberships/membership-id/status',
      body: dto,
      auth,
    });
  });

  it('removes a membership', async () => {
    await service.remove('membership-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/memberships/membership-id',
      auth,
    });
  });

  it('propagates Hemia ID client exceptions', async () => {
    hemiaIdAdminClient.request.mockRejectedValue(
      new ServiceUnavailableException('Hemia ID down'),
    );

    await expect(service.findAll({}, auth)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
