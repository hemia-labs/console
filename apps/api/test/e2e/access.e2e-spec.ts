import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AccessAdminClient } from '../../src/integrations/access/access-admin.client';
import { createAccessTestingModule } from './utils/create-access-testing-module';

describe('Access proxy (e2e)', () => {
  let app: INestApplication<App>;
  let accessAdminClient: { request: jest.Mock };

  beforeEach(async () => {
    accessAdminClient = { request: jest.fn().mockResolvedValue({ ok: true }) };

    const moduleFixture: TestingModule = await createAccessTestingModule()
      .overrideProvider(AccessAdminClient)
      .useValue(accessAdminClient)
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

  it('requires the current SSO session', async () => {
    await request(app.getHttpServer()).get('/access/organizations').expect(401);
    expect(accessAdminClient.request).not.toHaveBeenCalled();
  });

  it('proxies organizations and preserves query params', async () => {
    await request(app.getHttpServer())
      .get('/access/organizations')
      .query({ status: 'active', type: 'customer', search: 'acme', limit: 50 })
      .set('Authorization', 'Bearer console-token')
      .expect(200)
      .expect({ ok: true });

    expect(accessAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/v1/organizations',
      query: { limit: 50, search: 'acme', status: 'active', type: 'customer' },
    });
  });

  it('proxies organization, membership and role mutations', async () => {
    const organizationId = '2f8a2b2e-3c5d-4f0a-91a0-123456789abc';
    const membershipId = '8e0f8c0f-7f2d-4b1b-9b7d-123456789abc';
    const roleId = '9e0f8c0f-7f2d-4b1b-9b7d-123456789abc';
    const auth = { Authorization: 'Bearer console-token' };

    await request(app.getHttpServer())
      .post(`/access/organizations/${organizationId}/archive`)
      .set(auth)
      .expect(201);
    await request(app.getHttpServer())
      .patch(
        `/access/organizations/${organizationId}/memberships/${membershipId}`,
      )
      .set(auth)
      .send({ version: 1, membership_type: 'owner' })
      .expect(200);
    await request(app.getHttpServer())
      .post(
        `/access/organizations/${organizationId}/memberships/${membershipId}/roles`,
      )
      .set(auth)
      .send({ roleCode: 'support_lead' })
      .expect(201);
    await request(app.getHttpServer())
      .delete(
        `/access/organizations/${organizationId}/memberships/${membershipId}/roles/${roleId}`,
      )
      .set(auth)
      .expect(200);

    expect(accessAdminClient.request.mock.calls).toEqual([
      [{ method: 'POST', path: `/v1/organizations/${organizationId}/archive` }],
      [
        {
          method: 'PATCH',
          path: `/v1/organizations/${organizationId}/memberships/${membershipId}`,
          body: { version: 1, membership_type: 'owner' },
        },
      ],
      [
        {
          method: 'POST',
          path: `/v1/organizations/${organizationId}/memberships/${membershipId}/roles`,
          body: { roleCode: 'support_lead' },
        },
      ],
      [
        {
          method: 'DELETE',
          path: `/v1/organizations/${organizationId}/memberships/${membershipId}/roles/${roleId}`,
        },
      ],
    ]);
  });

  it('proxies products and invitations but excludes internal callbacks', async () => {
    const organizationId = '2f8a2b2e-3c5d-4f0a-91a0-123456789abc';
    const auth = { Authorization: 'Bearer console-token' };

    await request(app.getHttpServer())
      .post(`/access/organizations/${organizationId}/products/horus/enable`)
      .set(auth)
      .send({ source: 'manual' })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/access/organizations/${organizationId}/invitations`)
      .set(auth)
      .send({ email: 'user@acme.com' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/access/invitations/invitation-id/resend')
      .set(auth)
      .expect(400);

    await request(app.getHttpServer())
      .post('/access/invitations/accept')
      .set(auth)
      .send({ token: 'one-time-token' })
      .expect(404);
    await request(app.getHttpServer())
      .post('/access/internal/product-instances')
      .set(auth)
      .send({})
      .expect(404);

    expect(accessAdminClient.request).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      path: `/v1/organizations/${organizationId}/products/horus/enable`,
      body: { source: 'manual' },
    });
    expect(accessAdminClient.request).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      path: `/v1/organizations/${organizationId}/invitations`,
      body: { email: 'user@acme.com' },
    });
  });
});
