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

describe('InvitationsController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  const invitationId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const organizationId = '3df6e282-1517-48ff-9441-8cf80e65399f';
  const teamId = '4df6e282-1517-48ff-9441-8cf80e65399f';
  const roleId = '5df6e282-1517-48ff-9441-8cf80e65399f';
  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ id: invitationId }),
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

  it('POST /identity-access/invitations validates and proxies body', async () => {
    const body = {
      email: 'ana@example.com',
      organizationId,
      teamId,
      roleId,
      expiresAt: '2026-07-01T00:00:00.000Z',
      redirectUrl: 'https://console.hemia.cloud/invitations',
      message: 'Welcome',
      tenantId: 'strip-me',
    };

    await request(app.getHttpServer())
      .post('/identity-access/invitations')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send(body)
      .expect(201)
      .expect({ id: invitationId });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
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
      auth,
    });
  });

  it('POST /identity-access/invitations rejects invalid email', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/invitations')
      .send({ email: 'not-an-email' })
      .expect(400);
  });

  it('POST /identity-access/invitations/:id/resend validates uuid and proxies without body', async () => {
    await request(app.getHttpServer())
      .post(`/identity-access/invitations/${invitationId}/resend`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(201)
      .expect({ id: invitationId });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: `/invitations/${invitationId}/resend`,
      auth,
    });

    await request(app.getHttpServer())
      .post('/identity-access/invitations/not-a-uuid/resend')
      .expect(400);
  });

  it('POST /identity-access/invitations/:id/cancel validates uuid and proxies without body', async () => {
    await request(app.getHttpServer())
      .post(`/identity-access/invitations/${invitationId}/cancel`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(201)
      .expect({ id: invitationId });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: `/invitations/${invitationId}/cancel`,
      auth,
    });

    await request(app.getHttpServer())
      .post('/identity-access/invitations/not-a-uuid/cancel')
      .expect(400);
  });

  it.each([
    [new UnauthorizedException('Missing auth'), 401],
    [new ForbiddenException('Forbidden'), 403],
  ])('returns Hemia ID auth error %p', async (exception, statusCode) => {
    hemiaIdAdminClient.request.mockRejectedValueOnce(exception);

    await request(app.getHttpServer())
      .post('/identity-access/invitations')
      .set('Authorization', auth.authorization)
      .send({ email: 'ana@example.com' })
      .expect(statusCode);
  });

  it('does not expose public accept endpoint', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/invitations/accept')
      .send({ token: 'token' })
      .expect(404);
  });
});
