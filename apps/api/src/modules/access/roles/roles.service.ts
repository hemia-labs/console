import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../../integrations/access/access-admin.client';
import {
  AssignRoleDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../dtos/access.dto';

@Injectable()
export class RolesService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findRoles(accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      { method: 'GET', path: '/v1/roles' },
      accessToken,
    );
  }

  findPermissions(accessToken: string): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: '/v1/permissions',
      },
      accessToken,
    );
  }

  findOrganizationRoles(
    organizationId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'GET',
        path: `/v1/organizations/${organizationId}/roles`,
      },
      accessToken,
    );
  }

  createOrganizationRole(
    organizationId: string,
    dto: CreateRoleDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/roles`,
        body: dto,
      },
      accessToken,
    );
  }

  updateOrganizationRole(
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'PATCH',
        path: `/v1/organizations/${organizationId}/roles/${roleId}`,
        body: dto,
      },
      accessToken,
    );
  }

  removeOrganizationRole(
    organizationId: string,
    roleId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'DELETE',
        path: `/v1/organizations/${organizationId}/roles/${roleId}`,
      },
      accessToken,
    );
  }

  assignMembershipRole(
    organizationId: string,
    membershipId: string,
    dto: AssignRoleDto,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'POST',
        path: `/v1/organizations/${organizationId}/memberships/${membershipId}/roles`,
        body: dto,
      },
      accessToken,
    );
  }

  revokeMembershipRole(
    organizationId: string,
    membershipId: string,
    roleId: string,
    accessToken: string,
  ): Promise<unknown> {
    return this.accessAdminClient.requestAsUser(
      {
        method: 'DELETE',
        path: `/v1/organizations/${organizationId}/memberships/${membershipId}/roles/${roleId}`,
      },
      accessToken,
    );
  }
}
