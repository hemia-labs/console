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

describe('SsoClientsController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  const ssoClientId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest.fn().mockResolvedValue({ id: ssoClientId }),
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

  it('GET /identity-access/sso-clients proxies auth', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/sso-clients')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ id: ssoClientId });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'GET',
      path: '/sso-clients',
      auth,
    });
  });

  it('POST /identity-access/sso-clients validates and strips extra fields', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/sso-clients')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({
        clientId: 'console-sso',
        name: 'Console SSO',
        allowedRedirectUris: ['https://console.hemia.cloud/sso/callback'],
        allowedOrigins: ['https://console.hemia.cloud'],
        status: 'active',
        ignored: true,
      })
      .expect(201)
      .expect({ id: ssoClientId });

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/sso-clients',
      body: {
        clientId: 'console-sso',
        name: 'Console SSO',
        allowedRedirectUris: ['https://console.hemia.cloud/sso/callback'],
        allowedOrigins: ['https://console.hemia.cloud'],
        status: 'active',
      },
      auth,
    });
  });

  it('POST /identity-access/sso-clients rejects invalid body values', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/sso-clients')
      .send({
        clientId: 'console-sso',
        allowedRedirectUris: ['https://console.hemia.cloud/sso/callback'],
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/sso-clients')
      .send({
        clientId: 'console-sso',
        name: 'Console SSO',
        allowedRedirectUris: ['not-a-url'],
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/sso-clients')
      .send({
        clientId: 'console-sso',
        name: 'Console SSO',
        allowedRedirectUris: ['https://console.hemia.cloud/sso/callback'],
        allowedOrigins: ['console.hemia.cloud'],
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/sso-clients')
      .send({
        clientId: 'console-sso',
        name: 'Console SSO',
        allowedRedirectUris: ['https://console.hemia.cloud/sso/callback'],
        status: 'disabled',
      })
      .expect(400);
  });

  it('GET/PATCH/DELETE /identity-access/sso-clients/:id validate uuid and proxy', async () => {
    await request(app.getHttpServer())
      .get(`/identity-access/sso-clients/${ssoClientId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'GET',
      path: `/sso-clients/${ssoClientId}`,
      auth,
    });

    await request(app.getHttpServer())
      .patch(`/identity-access/sso-clients/${ssoClientId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({
        name: 'Console SSO Updated',
        allowedRedirectUris: ['https://console.hemia.cloud/sso/new-callback'],
        allowedOrigins: ['https://admin.hemia.cloud'],
        ignored: true,
      })
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'PATCH',
      path: `/sso-clients/${ssoClientId}`,
      body: {
        name: 'Console SSO Updated',
        allowedRedirectUris: ['https://console.hemia.cloud/sso/new-callback'],
        allowedOrigins: ['https://admin.hemia.cloud'],
      },
      auth,
    });

    await request(app.getHttpServer())
      .delete(`/identity-access/sso-clients/${ssoClientId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(200);

    expect(hemiaIdAdminClient.request).toHaveBeenLastCalledWith({
      method: 'DELETE',
      path: `/sso-clients/${ssoClientId}`,
      auth,
    });

    await request(app.getHttpServer())
      .get('/identity-access/sso-clients/not-a-uuid')
      .expect(400);
  });

  it('accepts localhost redirect URIs and origins', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/sso-clients')
      .set('Authorization', auth.authorization)
      .send({
        clientId: 'local-sso',
        name: 'Local SSO',
        allowedRedirectUris: ['http://localhost:3000/sso/callback'],
        allowedOrigins: ['http://localhost:3000'],
      })
      .expect(201);

    expect(hemiaIdAdminClient.request).toHaveBeenCalledWith({
      method: 'POST',
      path: '/sso-clients',
      body: {
        clientId: 'local-sso',
        name: 'Local SSO',
        allowedRedirectUris: ['http://localhost:3000/sso/callback'],
        allowedOrigins: ['http://localhost:3000'],
      },
      auth: { authorization: auth.authorization },
    });
  });

  it.each([
    [new UnauthorizedException('Missing auth'), 401],
    [new ForbiddenException('Forbidden'), 403],
  ])('returns Hemia ID auth error %p', async (exception, statusCode) => {
    hemiaIdAdminClient.request.mockRejectedValueOnce(exception);

    await request(app.getHttpServer())
      .get('/identity-access/sso-clients')
      .set('Authorization', auth.authorization)
      .expect(statusCode);
  });
});
