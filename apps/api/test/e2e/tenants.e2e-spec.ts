import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIdentityAccessE2eTestingModule } from './utils/create-identity-access-e2e-testing-module';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';

describe('TenantsController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  const tenantId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ id: tenantId, name: 'Acme' }),
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

  it('GET /identity-access/tenants proxies to Hemia ID', async () => {
    hemiaIdAdminClient.request.mockResolvedValueOnce([{ id: tenantId }]);

    await request(app.getHttpServer())
      .get('/identity-access/tenants')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect([{ id: tenantId }]);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/tenants',
      auth,
    });
  });

  it('POST /identity-access/tenants validates and proxies body', async () => {
    const body = {
      name: 'Acme',
      slug: 'acme',
      status: 'active',
      plan: 'pro',
      ownerUserId: tenantId,
    };

    await request(app.getHttpServer())
      .post('/identity-access/tenants')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send(body)
      .expect(201)
      .expect({ id: tenantId, name: 'Acme' });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/tenants',
      body,
      auth,
    });
  });

  it('POST /identity-access/tenants rejects missing required body', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/tenants')
      .send({ slug: 'acme' })
      .expect(400);
  });

  it('PATCH /identity-access/tenants/:id/status rejects invalid status', async () => {
    await request(app.getHttpServer())
      .patch(`/identity-access/tenants/${tenantId}/status`)
      .send({ status: 'paused' })
      .expect(400);
  });

  it('DELETE /identity-access/tenants/:id proxies to Hemia ID', async () => {
    hemiaIdAdminClient.request.mockResolvedValueOnce(undefined);

    await request(app.getHttpServer())
      .delete(`/identity-access/tenants/${tenantId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect('');

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'DELETE',
      path: `/tenants/${tenantId}`,
      auth,
    });
  });
});
