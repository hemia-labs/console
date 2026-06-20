import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { HemiaIdAdminClient } from '../../src/integrations/hemia-id/hemia-id-admin.client';
import { AuditController } from '../../src/modules/audit/audit.controller';
import { AuditService } from '../../src/modules/audit/audit.service';
import { AuditEventStatus } from '../../src/modules/audit/types/audit-event-status';
import { createIdentityAccessE2eTestingModule } from './utils/create-identity-access-e2e-testing-module';

describe('AuditController (e2e)', () => {
  let app: INestApplication<App>;
  let auditService: { findAll: jest.Mock };

  beforeEach(async () => {
    auditService = {
      findAll: jest.fn().mockResolvedValue({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: auditService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /identity-access/audit requires auth presence', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/audit')
      .expect(401);

    expect(auditService.findAll).not.toHaveBeenCalled();
  });

  it('GET /identity-access/audit validates and proxies filters', async () => {
    await request(app.getHttpServer())
      .get('/identity-access/audit')
      .set('Authorization', 'Bearer access-token')
      .query({
        page: '2',
        limit: '10',
        actorSubject: 'user-sub',
        action: 'post.users',
        resource: 'users',
        resourceId: 'user-id',
        status: AuditEventStatus.Success,
        from: '2026-06-18T00:00:00.000Z',
        to: '2026-06-19T00:00:00.000Z',
        hemiaIdRequestId: 'req-id',
      })
      .expect(200)
      .expect({
        data: [],
        page: 1,
        limit: 20,
        total: 0,
      });

    expect(auditService.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      actorSubject: 'user-sub',
      action: 'post.users',
      resource: 'users',
      resourceId: 'user-id',
      status: AuditEventStatus.Success,
      from: '2026-06-18T00:00:00.000Z',
      to: '2026-06-19T00:00:00.000Z',
      hemiaIdRequestId: 'req-id',
    });
  });
});

describe('AuditInterceptor (e2e)', () => {
  let app: INestApplication<App>;
  let auditService: { record: jest.Mock };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const moduleFixture: TestingModule =
      await createIdentityAccessE2eTestingModule()
        .overrideProvider(AuditService)
        .useValue(auditService)
        .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('records successful mutating identity-access requests', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        { id: '2df6e282-1517-48ff-9441-8cf80e65399f' },
        200,
        { 'x-request-id': 'hemia-request-id' },
      ),
    );

    await request(app.getHttpServer())
      .post('/identity-access/users')
      .set('Authorization', `Bearer ${jwt({ sub: 'user-sub' })}`)
      .send({
        email: 'ana@example.com',
        password: 'secret',
        name: 'Ana',
      })
      .expect(201);

    await waitForAsyncAudit();

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        actorSubject: 'user-sub',
        status: AuditEventStatus.Success,
        httpMethod: 'POST',
        route: '/identity-access/users',
        hemiaIdPath: '/users',
        hemiaIdRequestId: 'hemia-request-id',
      }),
    );
  });

  it('records failed upstream mutating requests and preserves response status', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ message: 'Forbidden' }, 403, {
        'x-correlation-id': 'hemia-correlation-id',
      }),
    );

    await request(app.getHttpServer())
      .delete('/identity-access/users/2df6e282-1517-48ff-9441-8cf80e65399f')
      .set('Authorization', `Bearer ${jwt({ sub: 'user-sub' })}`)
      .expect(403);

    await waitForAsyncAudit();

    expect(auditService.record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: AuditEventStatus.Failure,
        errorCode: '403',
        errorMessage: 'Forbidden',
        hemiaIdRequestId: 'hemia-correlation-id',
      }),
    );
  });

  it('does not audit GET requests', async () => {
    fetchMock.mockResolvedValue(jsonResponse([{ id: 'user-id' }]));

    await request(app.getHttpServer())
      .get('/identity-access/users')
      .set('Authorization', `Bearer ${jwt({ sub: 'user-sub' })}`)
      .expect(200);

    await waitForAsyncAudit();

    expect(auditService.record).not.toHaveBeenCalled();
  });

  it('uses real HemiaIdAdminClient in interceptor e2e', () => {
    expect(app.get(HemiaIdAdminClient)).toBeInstanceOf(HemiaIdAdminClient);
  });
});

const jsonResponse = (
  payload: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

const waitForAsyncAudit = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

const jwt = (payload: Record<string, unknown>): string =>
  [
    Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString(
      'base64url',
    ),
    Buffer.from(JSON.stringify(payload)).toString('base64url'),
    '',
  ].join('.');
