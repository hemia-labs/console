import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import { AssignPermissionToRoleDto } from './dtos/assign-permission-to-role.dto';
import { AssignRoleToUserDto } from './dtos/assign-role-to-user.dto';
import { CreateRoleDto } from './dtos/create-role.dto';
import { RoleParamDto } from './dtos/role-param.dto';
import { RolePermissionParamDto } from './dtos/role-permission-param.dto';
import { RoleUserAssignmentParamDto } from './dtos/role-user-assignment-param.dto';
import { RoleUserParamDto } from './dtos/role-user-param.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RolesService } from './roles.service';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.findAll(currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.create(dto, currentUser);
  }

  @Post(':id/permissions')
  async assignPermission(
    @Param() params: RoleParamDto,
    @Body() dto: AssignPermissionToRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.assignPermission(params.id, dto, currentUser);
  }

  @Delete(':id/permissions/:permissionId')
  async removePermission(
    @Param() params: RolePermissionParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.removePermission(
      params.id,
      params.permissionId,
      currentUser,
    );
  }

  @Post('users/:userId')
  async assignUserRole(
    @Param() params: RoleUserParamDto,
    @Body() dto: AssignRoleToUserDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.assignUserRole(params.userId, dto, currentUser);
  }

  @Delete('users/:userId/:roleId')
  async removeUserRole(
    @Param() params: RoleUserAssignmentParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.removeUserRole(
      params.userId,
      params.roleId,
      currentUser,
    );
  }

  @Get(':id')
  async findOne(
    @Param() params: RoleParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.findOne(params.id, currentUser);
  }

  @Patch(':id')
  async update(
    @Param() params: RoleParamDto,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.update(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: RoleParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.rolesService.remove(params.id, currentUser);
  }
}
