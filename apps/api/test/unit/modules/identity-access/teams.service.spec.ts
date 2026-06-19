import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { TeamsService } from 'src/modules/identity-access/teams.service';

describe('TeamsService', () => {
  let service: TeamsService;
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
        TeamsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(TeamsService);
  });

  it('finds all teams', async () => {
    await service.findAll(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/teams',
      auth,
    });
  });

  it('finds one team', async () => {
    await service.findOne('team-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/teams/team-id',
      auth,
    });
  });

  it('creates a team with body', async () => {
    const dto = {
      name: 'Support',
      organizationId: '2df6e282-1517-48ff-9441-8cf80e65399f',
      slug: 'support',
      description: 'Support team',
      status: 'active',
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/teams',
      body: dto,
      auth,
    });
  });

  it('updates a team with body', async () => {
    const dto = { name: 'Support Updated', status: 'inactive' };

    await service.update('team-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/teams/team-id',
      body: dto,
      auth,
    });
  });

  it('removes a team', async () => {
    await service.remove('team-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/teams/team-id',
      auth,
    });
  });

  it('propagates Hemia ID client exceptions', async () => {
    hemiaIdAdminClient.request.mockRejectedValue(
      new ServiceUnavailableException('Hemia ID down'),
    );

    await expect(service.findAll(auth)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
