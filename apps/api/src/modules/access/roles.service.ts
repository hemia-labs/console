import { Injectable } from '@nestjs/common';
import { AccessAdminClient } from '../../integrations/access/access-admin.client';
import { AssignRoleDto, CreateRoleDto, UpdateRoleDto } from './dtos/access.dto';

@Injectable()
export class RolesService {
  constructor(private readonly accessAdminClient: AccessAdminClient) {}

  findRoles(): Promise<unknown> {
    return this.accessAdminClient.request({ method: 'GET', path: '/v1/roles' });
  }

  findPermissions(): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: '/v1/permissions',
    });
  }

  findOrganizationRoles(organizationId: string): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'GET',
      path: `/v1/organizations/${organizationId}/roles`,
    });
  }

  createOrganizationRole(
    organizationId: string,
    dto: CreateRoleDto,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/roles`,
      body: dto,
    });
  }

  updateOrganizationRole(
    organizationId: string,
    roleId: string,
    dto: UpdateRoleDto,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'PATCH',
      path: `/v1/organizations/${organizationId}/roles/${roleId}`,
      body: dto,
    });
  }

  removeOrganizationRole(
    organizationId: string,
    roleId: string,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'DELETE',
      path: `/v1/organizations/${organizationId}/roles/${roleId}`,
    });
  }

  assignMembershipRole(
    organizationId: string,
    membershipId: string,
    dto: AssignRoleDto,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'POST',
      path: `/v1/organizations/${organizationId}/memberships/${membershipId}/roles`,
      body: dto,
    });
  }

  revokeMembershipRole(
    organizationId: string,
    membershipId: string,
    roleId: string,
  ): Promise<unknown> {
    return this.accessAdminClient.request({
      method: 'DELETE',
      path: `/v1/organizations/${organizationId}/memberships/${membershipId}/roles/${roleId}`,
    });
  }
}
