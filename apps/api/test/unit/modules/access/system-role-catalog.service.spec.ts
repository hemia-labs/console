import { SystemRoleCatalogService } from 'src/modules/access/system-role-catalog.service';
import { AccessAdminClient } from 'src/integrations/access/access-admin.client';
import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from 'src/modules/auth/console-authorization.service';

describe('System role publication BFF', () => {
  const request = {} as ConsoleRequest;
  function setup() {
    const access = {
      requestAsUser: jest.fn().mockResolvedValue({ catalogVersion: 2 }),
    };
    const auth = {
      accessTokenFor: jest.fn().mockResolvedValue('exchanged-human-token'),
    };
    const service = new SystemRoleCatalogService(
      access as unknown as AccessAdminClient,
      auth as unknown as ConsoleAuthorizationService,
    );
    return { service, access, auth };
  }
  it('uses the authenticated request and relays only the fixed versioned artifact', async () => {
    const { service, access, auth } = setup();
    await expect(service.publish(request, 'legal', 'v2', {})).resolves.toEqual({
      catalogVersion: 2,
    });
    expect(auth.accessTokenFor).toHaveBeenCalledWith(request);
    expect(access.requestAsUser).toHaveBeenCalledWith(
      { method: 'POST', path: '/v1/system-roles/catalogs/legal/v2', body: {} },
      'exchanged-human-token',
    );
  });
  it('loads persisted publication status using the same human session', async () => {
    const { service, access, auth } = setup();
    access.requestAsUser.mockResolvedValue([
      { productCode: 'legal', version: 2, publicationStatus: 'published' },
    ]);
    await expect(service.list(request)).resolves.toEqual([
      { productCode: 'legal', version: 2, publicationStatus: 'published' },
    ]);
    expect(auth.accessTokenFor).toHaveBeenCalledWith(request);
    expect(access.requestAsUser).toHaveBeenCalledWith(
      { method: 'GET', path: '/v1/system-roles/catalogs' },
      'exchanged-human-token',
    );
  });
  it('publishes the supported Billing artifact with the same human authorization', async () => {
    const { service, access } = setup();
    await service.publish(request, 'billing', 'v1', {});
    expect(access.requestAsUser).toHaveBeenCalledWith(
      {
        method: 'POST',
        path: '/v1/system-roles/catalogs/billing/v1',
        body: {},
      },
      'exchanged-human-token',
    );
  });
  it.each([
    ['unknown/route', 'v1'],
    ['legal', 'vNaN'],
    ['../legal', 'v2'],
  ])(
    'rejects unsupported catalog %s/%s before exchanging credentials',
    async (product, version) => {
      const { service, auth, access } = setup();
      await expect(
        service.publish(request, product, version, {}),
      ).rejects.toThrow('Unsupported system role catalog');
      expect(auth.accessTokenFor).not.toHaveBeenCalled();
      expect(access.requestAsUser).not.toHaveBeenCalled();
    },
  );
  it('rejects caller-supplied catalogs or identities before requesting a token', async () => {
    const { service, auth, access } = setup();
    await expect(
      service.publish(request, 'legal', 'v2', {
        subjectId: 'someone',
        roles: [],
      }),
    ).rejects.toThrow('body must be empty');
    expect(auth.accessTokenFor).not.toHaveBeenCalled();
    expect(access.requestAsUser).not.toHaveBeenCalled();
  });
});
