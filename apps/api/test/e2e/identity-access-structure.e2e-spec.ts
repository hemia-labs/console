import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIdentityAccessE2eTestingModule } from './utils/create-identity-access-e2e-testing-module';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';

describe('Identity access structure controllers (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  const organizationId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const teamId = '3df6e282-1517-48ff-9441-8cf80e65399f';
  const membershipId = '4df6e282-1517-48ff-9441-8cf80e65399f';
  const userId = '5df6e282-1517-48ff-9441-8cf80e65399f';
  const roleId = '6df6e282-1517-48ff-9441-8cf80e65399f';
  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ ok: true }),
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

  it('proxies organizations CRUD to Hemia ID', async () => {
    hemiaIdAdminClient.request
      .mockResolvedValueOnce([{ id: organizationId }])
      .mockResolvedValueOnce({ id: organizationId, name: 'Acme Org' })
      .mockResolvedValueOnce({ id: organizationId, name: 'Acme Org' })
      .mockResolvedValueOnce({ id: organizationId, name: 'Updated' })
      .mockResolvedValueOnce(undefined);

    await request(app.getHttpServer())
      .get('/identity-access/organizations')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect([{ id: organizationId }]);

    await request(app.getHttpServer())
      .post('/identity-access/organizations')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ name: 'Acme Org', slug: 'acme-org', tenantId: 'strip-me' })
      .expect(201)
      .expect({ id: organizationId, name: 'Acme Org' });

    await request(app.getHttpServer())
      .get(`/identity-access/organizations/${organizationId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ id: organizationId, name: 'Acme Org' });

    await request(app.getHttpServer())
      .patch(`/identity-access/organizations/${organizationId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ name: 'Updated' })
      .expect(200)
      .expect({ id: organizationId, name: 'Updated' });

    await request(app.getHttpServer())
      .delete(`/identity-access/organizations/${organizationId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect('');

    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/organizations',
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      path: '/organizations',
      body: { name: 'Acme Org', slug: 'acme-org' },
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: `/organizations/${organizationId}`,
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(4, {
      method: 'PATCH',
      path: `/organizations/${organizationId}`,
      body: { name: 'Updated' },
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(5, {
      method: 'DELETE',
      path: `/organizations/${organizationId}`,
      auth,
    });
  });

  it('proxies teams CRUD to Hemia ID', async () => {
    hemiaIdAdminClient.request
      .mockResolvedValueOnce([{ id: teamId }])
      .mockResolvedValueOnce({ id: teamId, name: 'Support' })
      .mockResolvedValueOnce({ id: teamId, name: 'Support' })
      .mockResolvedValueOnce({ id: teamId, name: 'Support Updated' })
      .mockResolvedValueOnce(undefined);

    await request(app.getHttpServer())
      .get('/identity-access/teams')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect([{ id: teamId }]);

    await request(app.getHttpServer())
      .post('/identity-access/teams')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ name: 'Support', organizationId, tenantId: 'strip-me' })
      .expect(201)
      .expect({ id: teamId, name: 'Support' });

    await request(app.getHttpServer())
      .get(`/identity-access/teams/${teamId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ id: teamId, name: 'Support' });

    await request(app.getHttpServer())
      .patch(`/identity-access/teams/${teamId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ name: 'Support Updated' })
      .expect(200)
      .expect({ id: teamId, name: 'Support Updated' });

    await request(app.getHttpServer())
      .delete(`/identity-access/teams/${teamId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect('');

    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/teams',
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      path: '/teams',
      body: { name: 'Support', organizationId },
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: `/teams/${teamId}`,
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(4, {
      method: 'PATCH',
      path: `/teams/${teamId}`,
      body: { name: 'Support Updated' },
      auth,
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(5, {
      method: 'DELETE',
      path: `/teams/${teamId}`,
      auth,
    });
  });

  it('validates memberships query userId and proxies it', async () => {
    hemiaIdAdminClient.request.mockResolvedValueOnce([{ id: membershipId }]);

    await request(app.getHttpServer())
      .get('/identity-access/memberships')
      .query({ userId })
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect([{ id: membershipId }]);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/memberships',
      query: { userId },
      auth,
    });

    await request(app.getHttpServer())
      .get('/identity-access/memberships')
      .query({ userId: 'not-a-uuid' })
      .expect(400);
  });

  it('validates and proxies membership create', async () => {
    const body = {
      userId,
      organizationId,
      teamId,
      roleId,
      status: 'active',
      tenantId: 'strip-me',
    };

    hemiaIdAdminClient.request.mockResolvedValueOnce({ id: membershipId });

    await request(app.getHttpServer())
      .post('/identity-access/memberships')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send(body)
      .expect(201)
      .expect({ id: membershipId });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/memberships',
      body: {
        userId,
        organizationId,
        teamId,
        roleId,
        status: 'active',
      },
      auth,
    });

    await request(app.getHttpServer())
      .post('/identity-access/memberships')
      .send({ organizationId })
      .expect(400);
  });

  it('requires membership status and proxies update', async () => {
    hemiaIdAdminClient.request.mockResolvedValueOnce({ id: membershipId });

    await request(app.getHttpServer())
      .patch(`/identity-access/memberships/${membershipId}/status`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ status: 'inactive' })
      .expect(200)
      .expect({ id: membershipId });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'PATCH',
      path: `/memberships/${membershipId}/status`,
      body: { status: 'inactive' },
      auth,
    });

    await request(app.getHttpServer())
      .patch(`/identity-access/memberships/${membershipId}/status`)
      .send({})
      .expect(400);
  });

  it('deletes membership and handles empty upstream response', async () => {
    hemiaIdAdminClient.request.mockResolvedValueOnce(undefined);

    await request(app.getHttpServer())
      .delete(`/identity-access/memberships/${membershipId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect('');

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: `/memberships/${membershipId}`,
      auth,
    });
  });
});
