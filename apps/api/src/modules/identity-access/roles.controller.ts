import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { AssignPermissionToRoleDto } from './dtos/assign-permission-to-role.dto';
import { AssignRoleToUserDto } from './dtos/assign-role-to-user.dto';
import { CreateRoleDto } from './dtos/create-role.dto';
import { RoleParamDto } from './dtos/role-param.dto';
import { RolePermissionParamDto } from './dtos/role-permission-param.dto';
import { RoleUserAssignmentParamDto } from './dtos/role-user-assignment-param.dto';
import { RoleUserParamDto } from './dtos/role-user-param.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RolesService } from './roles.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.rolesService.findAll(extractHemiaIdAuth(request));
  }

  @Post()
  create(
    @Body() dto: CreateRoleDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.create(dto, extractHemiaIdAuth(request));
  }

  @Post(':id/permissions')
  assignPermission(
    @Param() params: RoleParamDto,
    @Body() dto: AssignPermissionToRoleDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.assignPermission(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id/permissions/:permissionId')
  removePermission(
    @Param() params: RolePermissionParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.removePermission(
      params.id,
      params.permissionId,
      extractHemiaIdAuth(request),
    );
  }

  @Post('users/:userId')
  assignUserRole(
    @Param() params: RoleUserParamDto,
    @Body() dto: AssignRoleToUserDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.assignUserRole(
      params.userId,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete('users/:userId/:roleId')
  removeUserRole(
    @Param() params: RoleUserAssignmentParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.removeUserRole(
      params.userId,
      params.roleId,
      extractHemiaIdAuth(request),
    );
  }

  @Get(':id')
  findOne(
    @Param() params: RoleParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.findOne(params.id, extractHemiaIdAuth(request));
  }

  @Patch(':id')
  update(
    @Param() params: RoleParamDto,
    @Body() dto: UpdateRoleDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.update(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: RoleParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.rolesService.remove(params.id, extractHemiaIdAuth(request));
  }
}
