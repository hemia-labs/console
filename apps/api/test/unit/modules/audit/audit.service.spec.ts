import { AuditService } from 'src/modules/audit/audit.service';
import { AuditEventStatus } from 'src/modules/audit/types/audit-event-status';

describe('AuditService', () => {
  let service: AuditService;
  let repository: {
    create: jest.Mock;
    save: jest.Mock;
    findAndCount: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      create: jest.fn((event) => event),
      save: jest.fn().mockResolvedValue(undefined),
      findAndCount: jest.fn().mockResolvedValue([
        [
          {
            id: 'audit-id',
            actorSubject: 'user-sub',
            actorSource: 'authorization',
            action: 'post.users',
            resource: 'users',
            resourceId: null,
            status: AuditEventStatus.Success,
            httpMethod: 'POST',
            route: '/identity-access/users',
            hemiaIdPath: '/users',
            hemiaIdRequestId: 'req-id',
            metadata: { ok: true },
            errorCode: null,
            errorMessage: null,
            createdAt: new Date('2026-06-19T00:00:00.000Z'),
          },
        ],
        1,
      ]),
    };
    service = new AuditService(repository as never);
  });

  it('persists sanitized audit events', async () => {
    await service.record({
      actorSubject: 'user-sub',
      actorSource: 'authorization',
      action: 'post.oauth-clients',
      resource: 'oauth-clients',
      status: AuditEventStatus.Success,
      httpMethod: 'POST',
      route: '/identity-access/oauth-clients',
      hemiaIdPath: '/oauth-clients',
      hemiaIdRequestId: 'req-id',
      metadata: {
        body: {
          clientSecret: 'secret',
          nested: { access_token: 'token' },
        },
      },
    });

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          body: {
            clientSecret: '[redacted]',
            nested: { access_token: '[redacted]' },
          },
        },
      }),
    );
    expect(repository.save).toHaveBeenCalled();
  });

  it('does not throw when persistence fails', async () => {
    repository.save.mockRejectedValueOnce(new Error('db down'));

    await expect(
      service.record({
        actorSource: 'none',
        action: 'post.users',
        resource: 'users',
        status: AuditEventStatus.Success,
        httpMethod: 'POST',
        route: '/identity-access/users',
      }),
    ).resolves.toBeUndefined();
  });

  it('returns paginated audit events', async () => {
    await expect(
      service.findAll({
        page: 2,
        limit: 10,
        status: AuditEventStatus.Success,
        from: '2026-06-18T00:00:00.000Z',
        to: '2026-06-19T00:00:00.000Z',
      }),
    ).resolves.toMatchObject({
      data: [
        {
          id: 'audit-id',
          metadata: { ok: true },
        },
      ],
      page: 2,
      limit: 10,
      total: 1,
    });

    expect(repository.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 10,
        order: { createdAt: 'DESC' },
      }),
    );
  });
});
