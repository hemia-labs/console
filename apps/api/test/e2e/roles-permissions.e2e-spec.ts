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

describe('Roles and Permissions controllers (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  const roleId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const permissionId = '3df6e282-1517-48ff-9441-8cf80e65399f';
  const userId = '4df6e282-1517-48ff-9441-8cf80e65399f';
  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ ok: true }),
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

  it('GET /identity-access/roles proxies auth', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/roles')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ ok: true });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/roles',
      auth,
    });
  });

  it('POST /identity-access/roles validates and proxies body', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/roles')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({
        name: 'Admin',
        key: 'admin',
        description: 'Admin role',
        scope: 'global',
        isSystem: false,
        ignored: true,
      })
      .expect(201)
      .expect({ ok: true });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/roles',
      body: {
        name: 'Admin',
        key: 'admin',
        description: 'Admin role',
        scope: 'global',
        isSystem: false,
      },
      auth,
    });

    await request(app.getHttpServer())
      .post('/identity-access/roles')
      .send({ key: 'missing-name' })
      .expect(400);
  });

  it('GET/PATCH/DELETE /identity-access/roles/:id validate uuid and proxy', async () => {
    await request(app.getHttpServer())
      .get(`/identity-access/roles/${roleId}`)
      .set('Authorization', auth.authorization)
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'GET',
      path: `/roles/${roleId}`,
      auth: { authorization: auth.authorization },
    });

    await request(app.getHttpServer())
      .patch(`/identity-access/roles/${roleId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ name: 'Updated', ignored: true })
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'PATCH',
      path: `/roles/${roleId}`,
      body: { name: 'Updated' },
      auth,
    });

    await request(app.getHttpServer())
      .delete(`/identity-access/roles/${roleId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'DELETE',
      path: `/roles/${roleId}`,
      auth,
    });

    await request(app.getHttpServer())
      .get('/identity-access/roles/not-a-uuid')
      .expect(400);
  });

  it('assigns and removes role permissions', async () => {
    await request(app.getHttpServer())
      .post(`/identity-access/roles/${roleId}/permissions`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ permissionId, ignored: true })
      .expect(201);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'POST',
      path: `/roles/${roleId}/permissions`,
      body: { permissionId },
      auth,
    });

    await request(app.getHttpServer())
      .delete(`/identity-access/roles/${roleId}/permissions/${permissionId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'DELETE',
      path: `/roles/${roleId}/permissions/${permissionId}`,
      auth,
    });

    await request(app.getHttpServer())
      .post(`/identity-access/roles/${roleId}/permissions`)
      .send({ permissionId: 'not-a-uuid' })
      .expect(400);
  });

  it('assigns and removes user roles', async () => {
    await request(app.getHttpServer())
      .post(`/identity-access/roles/users/${userId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ roleId, ignored: true })
      .expect(201);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'POST',
      path: `/roles/users/${userId}`,
      body: { roleId },
      auth,
    });

    await request(app.getHttpServer())
      .delete(`/identity-access/roles/users/${userId}/${roleId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'DELETE',
      path: `/roles/users/${userId}/${roleId}`,
      auth,
    });

    await request(app.getHttpServer())
      .post('/identity-access/roles/users/not-a-uuid')
      .send({ roleId })
      .expect(400);
  });

  it('GET /identity-access/permissions proxies auth', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/permissions')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ ok: true });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/permissions',
      auth,
    });
  });

  it('POST /identity-access/permissions validates and proxies body', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/permissions')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({
        key: 'roles.read',
        resource: 'roles',
        action: 'read',
        description: 'Read roles',
        ignored: true,
      })
      .expect(201);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/permissions',
      body: {
        key: 'roles.read',
        resource: 'roles',
        action: 'read',
        description: 'Read roles',
      },
      auth,
    });

    await request(app.getHttpServer())
      .post('/identity-access/permissions')
      .send({ resource: 'roles' })
      .expect(400);
  });

  it('GET /identity-access/permissions/:id validates uuid and proxies', async () => {
    await request(app.getHttpServer())
      .get(`/identity-access/permissions/${permissionId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: `/permissions/${permissionId}`,
      auth,
    });

    await request(app.getHttpServer())
      .get('/identity-access/permissions/not-a-uuid')
      .expect(400);
  });

  it('POST /identity-access/permissions/sync-base proxies without body', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/permissions/sync-base')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(201);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/permissions/sync-base',
      auth,
    });
  });

  it('GET /identity-access/permissions/sync-base does not call sync-base', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/permissions/sync-base')
      .expect(400);

    expect(hemiaIdAdminClient.request).not.toHaveBeenCalledWith({
      method: 'POST',
      path: '/permissions/sync-base',
      auth: {},
    });
  });

  it.each([
    [new UnauthorizedException('Missing auth'), 401],
    [new ForbiddenException('Forbidden'), 403],
  ])('returns Hemia ID auth error %p', async (exception, statusCode) => {
    hemiaIdAdminClient.request.mockRejectedValueOnce(exception);

    await request(app.getHttpServer())
      .get('/identity-access/roles')
      .set('Authorization', auth.authorization)
      .expect(statusCode);
  });
});
