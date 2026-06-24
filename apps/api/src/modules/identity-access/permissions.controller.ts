import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { PermissionParamDto } from './dtos/permission-param.dto';
import { PermissionsService } from './permissions.service';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.permissionsService.findAll(currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.permissionsService.create(dto, currentUser);
  }

  @Post('sync-base')
  async syncBase(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.permissionsService.syncBase(currentUser);
  }

  @Get(':id')
  async findOne(
    @Param() params: PermissionParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.permissionsService.findOne(params.id, currentUser);
  }
}
