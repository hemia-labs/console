import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { TenantStatus } from 'src/modules/identity-access/types/tenant-status';
import { TenantsService } from 'src/modules/identity-access/tenants.service';

describe('TenantsService', () => {
  let service: TenantsService;
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
        TenantsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(TenantsService);
  });

  it('finds all tenants', async () => {
    await service.findAll(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/tenants',
      auth,
    });
  });

  it('finds one tenant', async () => {
    await service.findOne('tenant-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/tenants/tenant-id',
      auth,
    });
  });

  it('creates a tenant with body', async () => {
    const dto = {
      name: 'Acme',
      slug: 'acme',
      status: TenantStatus.Active,
      plan: 'pro',
      ownerUserId: '2df6e282-1517-48ff-9441-8cf80e65399f',
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/tenants',
      body: dto,
      auth,
    });
  });

  it('updates a tenant with body', async () => {
    const dto = {
      name: 'Acme Updated',
      status: TenantStatus.Suspended,
    };

    await service.update('tenant-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/tenants/tenant-id',
      body: dto,
      auth,
    });
  });

  it('updates tenant status', async () => {
    const dto = { status: TenantStatus.Cancelled };

    await service.updateStatus('tenant-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/tenants/tenant-id/status',
      body: dto,
      auth,
    });
  });

  it('removes a tenant', async () => {
    await service.remove('tenant-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/tenants/tenant-id',
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
