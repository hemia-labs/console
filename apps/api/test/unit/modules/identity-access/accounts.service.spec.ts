import {
  ForbiddenException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HemiaIdAdminClient } from 'src/integrations/hemia-id/hemia-id-admin.client';
import { AccountsService } from 'src/modules/identity-access/accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let hemiaIdAdminClient: {
    request: jest.Mock;
    requestWithHeaders: jest.Mock;
  };

  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ ok: true }),
      requestWithHeaders: jest.fn().mockResolvedValue({
        body: { switched: true },
        setCookie: ['access_token=next-token; HttpOnly; Path=/'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: HemiaIdAdminClient,
          useValue: hemiaIdAdminClient,
        },
      ],
    }).compile();

    service = module.get(AccountsService);
  });

  it('finds all accounts', async () => {
    await service.findAll(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/accounts',
      auth,
    });
  });

  it('finds active account', async () => {
    await service.findActive(auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/accounts/active',
      auth,
    });
  });

  it('switches account and preserves response headers', async () => {
    await expect(service.switch({ accountIndex: 1 }, auth)).resolves.toEqual({
      body: { switched: true },
      setCookie: ['access_token=next-token; HttpOnly; Path=/'],
    });

    expect(hemiaIdAdminClient.requestWithHeaders).toHaveBeenCalledWith({
      method: 'POST',
      path: '/accounts/switch',
      body: { accountIndex: 1 },
      auth,
    });
  });

  it('removes account', async () => {
    await service.remove(2, auth);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/accounts/2',
      auth,
    });
  });

  it.each([
    new UnauthorizedException('Missing auth'),
    new ForbiddenException('Forbidden'),
    new ServiceUnavailableException('Hemia ID down'),
  ])('propagates Hemia ID request exception %p', async (exception) => {
    hemiaIdAdminClient.request.mockRejectedValue(exception);

    await expect(service.findAll(auth)).rejects.toBe(exception);
  });

  it.each([
    new UnauthorizedException('Missing auth'),
    new ForbiddenException('Forbidden'),
    new ServiceUnavailableException('Hemia ID down'),
  ])('propagates Hemia ID switch exception %p', async (exception) => {
    hemiaIdAdminClient.requestWithHeaders.mockRejectedValue(exception);

    await expect(service.switch({ accountIndex: 1 }, auth)).rejects.toBe(
      exception,
    );
  });
});
