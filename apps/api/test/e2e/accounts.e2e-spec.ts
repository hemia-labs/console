import {
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIdentityAccessE2eTestingModule } from './utils/create-identity-access-e2e-testing-module';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';

describe('AccountsController (e2e)', () => {
  let app: INestApplication<App>;
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
        body: {
          account: { accountIndex: 1 },
          session: { activeAccountIndex: 1 },
        },
        setCookie: ['access_token=next-token; HttpOnly; Path=/'],
      }),
    };

    const moduleFixture: TestingModule = await createIdentityAccessE2eTestingModule()
      .overrideProvider(HemiaIdAdminClient)
      .useValue(hemiaIdAdminClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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

  it('POST /identity-access/accounts/switch validates, strips body, returns body, and forwards cookies', async () => {
    const response = await request(app.getHttpServer())
      .post('/identity-access/accounts/switch')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ accountIndex: 1, ignored: true })
      .expect(201)
      .expect({
        account: { accountIndex: 1 },
        session: { activeAccountIndex: 1 },
      });

    expect(response.headers['set-cookie']).toEqual([
      'access_token=next-token; HttpOnly; Path=/',
    ]);
    expect(hemiaIdAdminClient.requestWithHeaders).toHaveBeenCalledWith({
      method: 'POST',
      path: '/accounts/switch',
      body: { accountIndex: 1 },
      auth,
    });
  });

  it('POST /identity-access/accounts/switch rejects invalid accountIndex', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/accounts/switch')
      .send({ accountIndex: -1 })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/accounts/switch')
      .send({ accountIndex: 'not-a-number' })
      .expect(400);
  });

  it('DELETE /identity-access/accounts/:accountIndex validates and proxies without body', async () => {
    await request(app.getHttpServer())
      .delete('/identity-access/accounts/2')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(200)
      .expect({ ok: true });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: '/accounts/2',
      auth,
    });

    await request(app.getHttpServer())
      .delete('/identity-access/accounts/-1')
      .expect(400);

    await request(app.getHttpServer())
      .delete('/identity-access/accounts/not-a-number')
      .expect(400);
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
