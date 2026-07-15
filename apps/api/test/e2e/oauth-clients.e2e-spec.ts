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

describe('OAuthClientsController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { requestService: jest.Mock };

  const oauthClientId = '2df6e282-1517-48ff-9441-8cf80e65399f';
  const auth = {
    authorization: 'Bearer access-token',
    cookie: 'access_token=cookie-token',
  };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      requestService: jest.fn().mockResolvedValue({ id: oauthClientId }),
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

  it('GET /identity-access/oauth-clients proxies auth', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/oauth-clients')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200)
      .expect({ id: oauthClientId });

    expect(hemiaIdAdminClient.requestService).toHaveBeenCalledWith({
      method: 'GET',
      path: '/oauth-clients',
      auth,
    });
  });

  it('POST /identity-access/oauth-clients validates, strips secrets, and returns one-time secret', async () => {
    hemiaIdAdminClient.requestService.mockResolvedValueOnce({
      id: oauthClientId,
      clientId: 'console-app',
      clientSecret: 'one-time-secret',
    });

    await request(app.getHttpServer())
      .post('/identity-access/oauth-clients')
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({
        clientId: 'console-app',
        audience: 'https://api.hemia.cloud',
        type: 'confidential',
        redirectUris: ['https://console.hemia.cloud/callback'],
        grantTypes: ['authorization_code'],
        responseTypes: ['code'],
        scopes: ['openid', 'profile'],
        requiresConsent: true,
        status: 'active',
        clientSecret: 'must-not-forward',
      })
      .expect(201)
      .expect({
        id: oauthClientId,
        clientId: 'console-app',
        clientSecret: 'one-time-secret',
      });

    expect(hemiaIdAdminClient.requestService).toHaveBeenCalledWith({
      method: 'POST',
      path: '/oauth-clients',
      body: {
        clientId: 'console-app',
        audience: 'https://api.hemia.cloud',
        type: 'confidential',
        redirectUris: ['https://console.hemia.cloud/callback'],
        grantTypes: ['authorization_code'],
        responseTypes: ['code'],
        scopes: ['openid', 'profile'],
        requiresConsent: true,
        status: 'active',
      },
      auth,
    });
  });

  it('POST /identity-access/oauth-clients rejects invalid body values', async () => {
    await request(app.getHttpServer())
      .post('/identity-access/oauth-clients')
      .send({
        clientId: 'console-app',
        audience: 'https://api.hemia.cloud',
        type: 'machine',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/oauth-clients')
      .send({
        clientId: 'console-app',
        audience: 'https://api.hemia.cloud',
        type: 'public',
        status: 'disabled',
      })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/oauth-clients')
      .send({
        clientId: 'console-app',
        audience: 'https://api.hemia.cloud',
        type: 'public',
        redirectUris: ['not-a-url'],
      })
      .expect(400);
  });

  it('GET/PATCH/DELETE /identity-access/oauth-clients/:id validate uuid and proxy', async () => {
    await request(app.getHttpServer())
      .get(`/identity-access/oauth-clients/${oauthClientId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .expect(200);

    expect(hemiaIdAdminClient.requestService).toHaveBeenLastCalledWith({
      method: 'GET',
      path: `/oauth-clients/${oauthClientId}`,
      auth,
    });

    await request(app.getHttpServer())
      .patch(`/identity-access/oauth-clients/${oauthClientId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({
        redirectUris: ['https://console.hemia.cloud/new-callback'],
        status: 'suspended',
        clientSecret: 'must-not-forward',
      })
      .expect(200);

    expect(hemiaIdAdminClient.requestService).toHaveBeenLastCalledWith({
      method: 'PATCH',
      path: `/oauth-clients/${oauthClientId}`,
      body: {
        redirectUris: ['https://console.hemia.cloud/new-callback'],
        status: 'suspended',
      },
      auth,
    });

    await request(app.getHttpServer())
      .delete(`/identity-access/oauth-clients/${oauthClientId}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ ignored: true })
      .expect(200);

    expect(hemiaIdAdminClient.requestService).toHaveBeenLastCalledWith({
      method: 'DELETE',
      path: `/oauth-clients/${oauthClientId}`,
      auth,
    });

    await request(app.getHttpServer())
      .get('/identity-access/oauth-clients/not-a-uuid')
      .expect(400);
  });

  it('POST /identity-access/oauth-clients/:id/rotate-secret proxies without body and returns one-time secret', async () => {
    hemiaIdAdminClient.requestService.mockResolvedValueOnce({
      id: oauthClientId,
      clientSecret: 'rotated-secret',
    });

    await request(app.getHttpServer())
      .post(`/identity-access/oauth-clients/${oauthClientId}/rotate-secret`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ clientSecret: 'must-not-forward' })
      .expect(201)
      .expect({
        id: oauthClientId,
        clientSecret: 'rotated-secret',
      });

    expect(hemiaIdAdminClient.requestService).toHaveBeenCalledWith({
      method: 'POST',
      path: `/oauth-clients/${oauthClientId}/rotate-secret`,
      auth,
    });

    await request(app.getHttpServer())
      .post('/identity-access/oauth-clients/not-a-uuid/rotate-secret')
      .expect(400);
  });

  it.each([
    [
      'redirect-uris',
      'https://console.hemia.cloud/callback',
    ],
    ['scopes', 'openid'],
    ['grant-types', 'authorization_code'],
    ['response-types', 'code'],
  ])('POST /identity-access/oauth-clients/:id/%s proxies value body', async (listPath, value) => {
    await request(app.getHttpServer())
      .post(`/identity-access/oauth-clients/${oauthClientId}/${listPath}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ value, clientSecret: 'must-not-forward' })
      .expect(201)
      .expect({ id: oauthClientId });

    expect(hemiaIdAdminClient.requestService).toHaveBeenLastCalledWith({
      method: 'POST',
      path: `/oauth-clients/${oauthClientId}/${listPath}`,
      body: { value },
      auth,
    });
  });

  it.each([
    [
      'redirect-uris',
      'https://console.hemia.cloud/callback',
    ],
    ['scopes', 'openid'],
    ['grant-types', 'authorization_code'],
    ['response-types', 'code'],
  ])('DELETE /identity-access/oauth-clients/:id/%s proxies value body', async (listPath, value) => {
    await request(app.getHttpServer())
      .delete(`/identity-access/oauth-clients/${oauthClientId}/${listPath}`)
      .set('Authorization', auth.authorization)
      .set('Cookie', auth.cookie)
      .send({ value, clientSecret: 'must-not-forward' })
      .expect(200)
      .expect({ id: oauthClientId });

    expect(hemiaIdAdminClient.requestService).toHaveBeenLastCalledWith({
      method: 'DELETE',
      path: `/oauth-clients/${oauthClientId}/${listPath}`,
      body: { value },
      auth,
    });
  });

  it('validates OAuth client list action params and body', async () => {
    await request(app.getHttpServer())
      .post(`/identity-access/oauth-clients/${oauthClientId}/redirect-uris`)
      .send({ value: 'not-a-url' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/identity-access/oauth-clients/${oauthClientId}/scopes`)
      .send({ value: '' })
      .expect(400);

    await request(app.getHttpServer())
      .post('/identity-access/oauth-clients/not-a-uuid/scopes')
      .send({ value: 'openid' })
      .expect(400);
  });

  it.each([
    [new UnauthorizedException('Missing auth'), 401],
    [new ForbiddenException('Forbidden'), 403],
  ])('returns Hemia ID auth error %p', async (exception, statusCode) => {
    hemiaIdAdminClient.requestService.mockRejectedValueOnce(exception);

    await request(app.getHttpServer())
      .get('/identity-access/oauth-clients')
      .set('Authorization', auth.authorization)
      .expect(statusCode);
  });
});
