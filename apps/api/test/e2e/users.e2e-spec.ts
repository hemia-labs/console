import {
  ForbiddenException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  const userId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ id: userId, email: 'ana@example.com' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
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

  it('GET /identity-access/users proxies auth and query to Hemia ID', async () => {
    hemiaIdAdminClient.request.mockResolvedValueOnce([{ id: userId }]);

    await request(app.getHttpServer())
      .get('/identity-access/users')
      .query({ search: 'ana', status: 'active', page: '1', limit: '20' })
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect([{ id: userId }]);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/users',
      query: { search: 'ana', status: 'active', page: '1', limit: '20' },
      auth,
    });
  });

  it('GET /identity-access/users/:id proxies to Hemia ID', async () => {
    await request(app.getHttpServer())
      .get(`/identity-access/users/${userId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ id: userId, email: 'ana@example.com' });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: `/users/${userId}`,
      auth,
    });
  });

  it('POST /identity-access/users validates and proxies body', async () => {
    const body = {
      email: 'ana@example.com',
      password: 'secret',
      name: 'Ana',
      status: 'active',
      tenantId: 'must-be-stripped',
    };

    await request(app.getHttpServer())
      .post('/identity-access/users')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send(body)
      .expect(201)
      .expect({ id: userId, email: 'ana@example.com' });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/users',
      body: {
        email: 'ana@example.com',
        password: 'secret',
        name: 'Ana',
        status: 'active',
      },
      auth,
    });
  });

  it('POST /identity-access/users rejects missing required body', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/users')
      .send({ name: 'Ana' })
      .expect(400);
  });

  it('PATCH /identity-access/users/:id proxies body', async () => {
    const body = {
      name: 'Ana Updated',
      status: 'suspended',
    };

    await request(app.getHttpServer())
      .patch(`/identity-access/users/${userId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send(body)
      .expect(200)
      .expect({ id: userId, email: 'ana@example.com' });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: `/users/${userId}`,
      body,
      auth,
    });
  });

  it('PATCH /identity-access/users/:id/status rejects invalid status', async () => {
    await request(app.getHttpServer())
      .patch(`/identity-access/users/${userId}/status`)
      .send({ status: 'paused' })
      .expect(400);
  });

  it('PATCH /identity-access/users/:id/lock proxies without body', async () => {
    await request(app.getHttpServer())
      .patch(`/identity-access/users/${userId}/lock`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(200)
      .expect({ id: userId, email: 'ana@example.com' });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: `/users/${userId}/lock`,
      auth,
    });
  });

  it('PATCH /identity-access/users/:id/unlock proxies without body', async () => {
    await request(app.getHttpServer())
      .patch(`/identity-access/users/${userId}/unlock`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(200)
      .expect({ id: userId, email: 'ana@example.com' });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: `/users/${userId}/unlock`,
      auth,
    });
  });

  it('DELETE /identity-access/users/:id proxies to Hemia ID', async () => {
    hemiaIdAdminClient.request.mockResolvedValueOnce(undefined);

    await request(app.getHttpServer())
      .delete(`/identity-access/users/${userId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect('');

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: `/users/${userId}`,
      auth,
    });
  });

  it.each([
    [new UnauthorizedException('Missing auth'), 401],
    [new ForbiddenException('Forbidden'), 403],
  ])('returns Hemia ID auth error %p', async (exception, statusCode) => {
    hemiaIdAdminClient.request.mockRejectedValueOnce(exception);

    await request(app.getHttpServer())
      .get('/identity-access/users')
      .set('Authorization', auth.authorization)
      .expect(statusCode);
  });
});
