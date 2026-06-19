import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';

describe('IdentityAccessController (e2e)', () => {
  let app: INestApplication<App>;
  let hemiaIdAdminClient: { request: jest.Mock };

  beforeEach(async () => {
    hemiaIdAdminClient = {
      request: jest
        .fn()
        .mockResolvedValueOnce({ status: 'ok' })
        .mockResolvedValueOnce({ database: 'ok' }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
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
        hemiaId: { status: 'ok' },
        database: { database: 'ok' },
      });

    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(1, {
      method: 'GET',
      path: '/health',
      auth: {
        authorization: 'Bearer access-token',
        cookie: 'access_token=cookie-token',
      },
    });
    expect(hemiaIdAdminClient.request).toHaveBeenNthCalledWith(2, {
      method: 'GET',
      path: '/health/db',
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
