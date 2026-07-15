import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createIdentityAccessE2eTestingModule } from './utils/create-identity-access-e2e-testing-module';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';

describe('IdentityAccessController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest
        .fn()
        .mockResolvedValueOnce({ live: 'ok' })
        .mockResolvedValueOnce({ startup: 'ok' })
        .mockResolvedValueOnce({ ready: 'ok' }),
    };

    const moduleFixture: TestingModule = await createIdentityAccessE2eTestingModule()
      .overrideProvider(HemiaIdAdminClient)
      .useValue(hemiaIdAdminClient)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/identity-access/health/hemia-id (GET)', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/health/hemia-id')
      .set('Authorization', 'Bearer access-token')
      .set('Cookie', 'access_token=cookie-token')
      .expect(200)
      .expect({
        status: 'ok',
        live: { live: 'ok' },
        startup: { startup: 'ok' },
        ready: { ready: 'ok' },
      });

    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/health/live',
      auth: {
        authorization: 'Bearer access-token',
        cookie: 'access_token=cookie-token',
      },
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/health/startup',
      auth: {
        authorization: 'Bearer access-token',
        cookie: 'access_token=cookie-token',
      },
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(3, {
      method: 'GET',
      path: '/health/ready',
      auth: {
        authorization: 'Bearer access-token',
        cookie: 'access_token=cookie-token',
      },
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
