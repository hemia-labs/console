import { Injectable } from '@nestjs/common';
import { HemiaIdAdminClient } from '../../integrations/hemia-id/hemia-id-admin.client';
import { HemiaIdAdminAuth } from '../../integrations/hemia-id/hemia-id-admin.types';
import { AssignPermissionToRoleDto } from './dtos/assign-permission-to-role.dto';
import { AssignRoleToUserDto } from './dtos/assign-role-to-user.dto';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private readonly hemiaIdAdminClient: HemiaIdAdminClient) {}

  findAll(auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: '/roles',
      auth,
    });
  }

  findOne(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'GET',
      path: `/roles/${id}`,
      auth,
    });
  }

  create(dto: CreateRoleDto, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: '/roles',
      body: dto,
      auth,
    });
  }

  update(
    id: string,
    dto: UpdateRoleDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'PATCH',
      path: `/roles/${id}`,
      body: dto,
      auth,
    });
  }

  remove(id: string, auth: HemiaIdAdminAuth): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/roles/${id}`,
      auth,
    });
  }

  assignPermission(
    id: string,
    dto: AssignPermissionToRoleDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: `/roles/${id}/permissions`,
      body: dto,
      auth,
    });
  }

  removePermission(
    id: string,
    permissionId: string,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/roles/${id}/permissions/${permissionId}`,
      auth,
    });
  }

  assignUserRole(
    userId: string,
    dto: AssignRoleToUserDto,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'POST',
      path: `/roles/users/${userId}`,
      body: dto,
      auth,
    });
  }

  removeUserRole(
    userId: string,
    roleId: string,
    auth: HemiaIdAdminAuth,
  ): Promise<unknown> {
    return this.hemiaIdAdminClient.request({
      method: 'DELETE',
      path: `/roles/users/${userId}/${roleId}`,
      auth,
    });
  }
}
