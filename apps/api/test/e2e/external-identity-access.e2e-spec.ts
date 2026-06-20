import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIdentityAccessE2eTestingModule } from './utils/create-identity-access-e2e-testing-module';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdExternalClient } from '../../src/integrations/hemia-id/hemia-id-external.client';

describe('ExternalIdentityAccessController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };
  let hemiaIdExternalClient: { request: jest.Mock };

  const invitationId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const organizationId = '3df6e282-1517-48ff-9441-8cf80e65399f';
  const teamId = '4df6e282-1517-48ff-9441-8cf80e65399f';
  const roleId = '5df6e282-1517-48ff-9441-8cf80e65399f';

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ from: 'admin' }),
    };
    hemiaIdExternalClient = {
      request: jest.fn().mockResolvedValue({ from: 'external' }),
    };

    const moduleFixture: TestingModule = await createIdentityAccessE2eTestingModule()
      .overrideProvider(HemiaIdAdminClient)
      .useValue(hemiaIdAdminClient)
      .overrideProvider(HemiaIdExternalClient)
      .useValue(hemiaIdExternalClient)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('proxies all External API routes without forwarding user auth', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/external/users/by-email')
      .query({ email: 'ana@example.com' })
      .set('Authorization', 'Bearer access-token')
      .expect(200)
      .expect({ from: 'external' });

    await request(app.getHttpServer())
      .get('/identity-access/external/users/by-sub/user-sub')
      .set('Authorization', 'Bearer access-token')
      .expect(200);

    await request(app.getHttpServer())
      .get('/identity-access/external/users/user-sub/memberships')
      .set('Authorization', 'Bearer access-token')
      .expect(200);

    await request(app.getHttpServer())
      .get('/identity-access/external/teams')
      .set('Cookie', 'access_token=cookie-token')
      .expect(200);

    await request(app.getHttpServer())
      .post('/identity-access/external/invitations')
      .set('Authorization', 'Bearer access-token')
      .send({
        email: 'ana@example.com',
        organizationId,
        teamId,
        roleId,
        expiresAt: '2026-07-01T00:00:00.000Z',
        redirectUrl: 'https://console.hemia.cloud/invitations',
        message: 'Welcome',
        tenantId: 'strip-me',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/identity-access/external/invitations/${invitationId}/resend`)
      .set('Authorization', 'Bearer access-token')
      .send({ ignored: true })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/identity-access/external/invitations/${invitationId}/cancel`)
      .set('Authorization', 'Bearer access-token')
      .send({ ignored: true })
      .expect(201);

    await request(app.getHttpServer())
      .get('/identity-access/external/events')
      .set('Authorization', 'Bearer access-token')
      .expect(200);

    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/users/by-email',
      query: { email: 'ana@example.com' },
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/users/by-sub/user-sub',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: '/users/user-sub/memberships',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(4, {
      method: 'GET',
      path: '/teams',
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(5, {
      method: 'POST',
      path: '/invitations',
      body: {
        email: 'ana@example.com',
        organizationId,
        teamId,
        roleId,
        expiresAt: '2026-07-01T00:00:00.000Z',
        redirectUrl: 'https://console.hemia.cloud/invitations',
        message: 'Welcome',
      },
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(6, {
      method: 'POST',
      path: `/invitations/${invitationId}/resend`,
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(7, {
      method: 'POST',
      path: `/invitations/${invitationId}/cancel`,
    });
    expect(hemiaIdExternalClient.request).toHaveBeenNthCalledWith(8, {
      method: 'GET',
      path: '/events',
    });
    expect(hemiaIdAdminClient.request).not.toHaveBeenCalled();
  });

  it('rejects External API routes without Authorization or Cookie', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/external/teams')
      .expect(401);

    expect(hemiaIdExternalClient.request).not.toHaveBeenCalled();
  });

  it('validates DTOs before proxying', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/external/users/by-email')
      .set('Authorization', 'Bearer access-token')
      .query({ email: 'not-an-email' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/external/invitations/not-a-uuid/resend')
      .set('Authorization', 'Bearer access-token')
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/external/invitations')
      .set('Authorization', 'Bearer access-token')
      .send({ email: 'not-an-email' })
      .expect(400);

    expect(hemiaIdExternalClient.request).not.toHaveBeenCalled();
  });
});
