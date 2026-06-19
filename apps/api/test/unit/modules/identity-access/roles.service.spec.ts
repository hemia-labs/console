import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { RolesService } from 'src/modules/identity-access/roles.service';

describe('RolesService', () => {
  let service: RolesService;
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
        RolesService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(RolesService);
  });

  it('finds all roles', async () => {
    await service.findAll(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/roles',
      auth,
    });
  });

  it('finds one role', async () => {
    await service.findOne('role-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/roles/role-id',
      auth,
    });
  });

  it('creates a role with body', async () => {
    const dto = {
      name: 'Admin',
      key: 'admin',
      description: 'Admin role',
      scope: 'global',
      isSystem: false,
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/roles',
      body: dto,
      auth,
    });
  });

  it('updates a role with body', async () => {
    const dto = {
      name: 'Admin Updated',
      description: 'Updated role',
    };

    await service.update('role-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/roles/role-id',
      body: dto,
      auth,
    });
  });

  it('removes a role', async () => {
    await service.remove('role-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/roles/role-id',
      auth,
    });
  });

  it('assigns a permission to a role', async () => {
    const dto = { permissionId: 'permission-id' };

    await service.assignPermission('role-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/roles/role-id/permissions',
      body: dto,
      auth,
    });
  });

  it('removes a permission from a role', async () => {
    await service.removePermission('role-id', 'permission-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/roles/role-id/permissions/permission-id',
      auth,
    });
  });

  it('assigns a role to a user', async () => {
    const dto = { roleId: 'role-id' };

    await service.assignUserRole('user-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/roles/users/user-id',
      body: dto,
      auth,
    });
  });

  it('removes a role from a user', async () => {
    await service.removeUserRole('user-id', 'role-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/roles/users/user-id/role-id',
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
