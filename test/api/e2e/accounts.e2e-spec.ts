import {
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIdentityAccessE2eTestingModule } from './utils/create-identity-access-e2e-testing-module';
import { HemiaIdAdminClient } from '../../../apps/api/src/integrations/hemia-id/hemia-id-admin.client';

describe('AccountsController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: {
    request: jest.Mock;
  };

  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ ok: true }),
    };

    const moduleFixture: TestingModule =
      await createIdentityAccessE2eTestingModule()
        .overrideProvider(HemiaIdAdminClient)
        .useValue(hemiaIdAdminClient)
        .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /identity-access/accounts proxies auth', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/accounts')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ ok: true });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/accounts',
      auth,
    });
  });

  it('GET /identity-access/accounts/active proxies auth', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/accounts/active')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ ok: true });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/accounts/active',
      auth,
    });
  });

  it('does not expose retired account mutations or call Identity for them', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/accounts/switch')
      .send({ accountIndex: 1 })
      .expect(404);
    await request(app.getHttpServer())
      .delete('/identity-access/accounts/1')
      .expect(404);
    expect(hemiaIdAdminClient.request).not.toHaveBeenCalled();
  });

  it.each([
    [new UnauthorizedException('Missing auth'), 401],
    [new ForbiddenException('Forbidden'), 403],
  ])('returns Hemia ID auth error %p', async (exception, statusCode) => {
    hemiaIdAdminClient.request.mockRejectedValueOnce(exception);

    await request(app.getHttpServer())
      .get('/identity-access/accounts')
      .set('Authorization', auth.authorization)
      .expect(statusCode);
  });
});
