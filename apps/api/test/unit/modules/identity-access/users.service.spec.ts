import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { UserStatus } from 'src/modules/identity-access/types/user-status';
import { UsersService } from 'src/modules/identity-access/users.service';

describe('UsersService', () => {
  let service: UsersService;
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
        UsersService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('finds all users with query', async () => {
    const query = {
      search: 'ana',
      status: UserStatus.Active,
      page: '1',
      limit: '20',
    };

    await service.findAll(query, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/users',
      query,
      auth,
    });
  });

  it('finds one user', async () => {
    await service.findOne('user-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/users/user-id',
      auth,
    });
  });

  it('creates a user with body', async () => {
    const dto = {
      email: 'ana@example.com',
      password: 'secret',
      name: 'Ana',
      status: UserStatus.Active,
    };

    await service.create(dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/users',
      body: dto,
      auth,
    });
  });

  it('updates a user with body', async () => {
    const dto = {
      name: 'Ana Updated',
      status: UserStatus.Suspended,
    };

    await service.update('user-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/users/user-id',
      body: dto,
      auth,
    });
  });

  it('updates user status', async () => {
    const dto = { status: UserStatus.Locked };

    await service.updateStatus('user-id', dto, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/users/user-id/status',
      body: dto,
      auth,
    });
  });

  it('locks a user without body', async () => {
    await service.lock('user-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/users/user-id/lock',
      auth,
    });
  });

  it('unlocks a user without body', async () => {
    await service.unlock('user-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: '/users/user-id/unlock',
      auth,
    });
  });

  it('removes a user', async () => {
    await service.remove('user-id', auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/users/user-id',
      auth,
    });
  });

  it.each([
    new UnauthorizedException('Missing auth'),
    new ForbiddenException('Forbidden'),
    new ServiceUnavailableException('Hemia ID down'),
  ])('propagates Hemia ID client exception %p', async (exception) => {
    hemiaIdAdminClient.request.mockRejectedValue(exception);

    await expect(service.findAll({}, auth)).rejects.toBe(exception);
  });
});
