import { RolesService } from 'src/modules/access/roles/roles.service';
import type { AccessAdminClient } from 'src/integrations/access/access-admin.client';
import type { AssignBillingRoleDto } from 'src/modules/access/dtos/access.dto';

describe('Billing role assignments BFF', () => {
  it.each(['organizations', 'all_customers'] as const)(
    'preserves the operator and builds the %s scope',
    async (scopeType) => {
      const requestAsUser = jest.fn().mockResolvedValue({ id: 'assignment' });
      const roles = new RolesService({
        requestAsUser,
      } as unknown as AccessAdminClient);
      const dto: AssignBillingRoleDto = {
        membershipId: 'member',
        roleId: 'role',
        scopeType,
        organizationId: 'organization',
        idempotencyKey: 'request',
        validFrom: '2026-11-18T00:00:00.000Z',
      };
      await expect(
        roles.assignBillingRole(dto, 'operator-token'),
      ).resolves.toEqual({
        id: 'assignment',
      });
      expect(requestAsUser).toHaveBeenCalledWith(
        {
          method: 'POST',
          path: '/v1/system-roles/assignments',
          body: {
            membershipId: dto.membershipId,
            roleId: dto.roleId,
            scopeType,
            organizationIds:
              scopeType === 'organizations' ? [dto.organizationId] : [],
            idempotencyKey: dto.idempotencyKey,
            validFrom: dto.validFrom,
            expiresAt: null,
          },
        },
        'operator-token',
      );
    },
  );
});

describe('System role assignments BFF', () => {
  it('uses Access for listing, assigning and revoking with the authenticated operator', async () => {
    const requestAsUser = jest.fn().mockResolvedValue({});
    const roles = new RolesService({
      requestAsUser,
    } as unknown as AccessAdminClient);
    const token = 'operator-token';
    const assignment = {
      scopeType: 'applications',
      consumerScopeType: 'organizations',
      resourceIds: ['application'],
      organizationIds: ['consumer'],
    };

    await roles.listSystemRoles('member', token);
    await roles.createSystemRole(assignment, token);
    await roles.revokeSystemRole('assignment', { expectedVersion: 3 }, token);

    expect(requestAsUser.mock.calls).toEqual([
      [
        {
          method: 'GET',
          path: '/v1/system-roles/assignments',
          query: { membershipId: 'member' },
        },
        token,
      ],
      [
        {
          method: 'POST',
          path: '/v1/system-roles/assignments',
          body: assignment,
        },
        token,
      ],
      [
        {
          method: 'POST',
          path: '/v1/system-roles/assignments/assignment/revoke',
          body: { expectedVersion: 3 },
        },
        token,
      ],
    ]);
  });
});
