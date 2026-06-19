import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { OrganizationsService } from 'src/modules/identity-access/organizations.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
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
        OrganizationsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  it('finds all organizations', async () => {
    await service.findAll(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/organizations',
      auth,
    });
  });

  it('finds one organization', async () => {
    await service.findOne('organization-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/organizations/organization-id',
      auth,
    });
  });

  it('creates an organization with body', async () => {
    const dto = {
      name: 'Acme Org',
      slug: 'acme-org',
      description: 'Primary org',
      status: 'active',
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/organizations',
      body: dto,
      auth,
    });
  });

  it('updates an organization with body', async () => {
    const dto = { name: 'Acme Org Updated', status: 'suspended' };

    await service.update('organization-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/organizations/organization-id',
      body: dto,
      auth,
    });
  });

  it('removes an organization', async () => {
    await service.remove('organization-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/organizations/organization-id',
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
