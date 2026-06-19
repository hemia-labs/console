import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { PermissionParamDto } from './dtos/permission-param.dto';
import { PermissionsService } from './permissions.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.permissionsService.findAll(extractHemiaIdAuth(request));
  }

  @Post()
  create(
    @Body() dto: CreatePermissionDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.permissionsService.create(dto, extractHemiaIdAuth(request));
  }

  @Post('sync-base')
  syncBase(@Req() request: Request): Promise<unknown> {
    return this.permissionsService.syncBase(extractHemiaIdAuth(request));
  }

  @Get(':id')
  findOne(
    @Param() params: PermissionParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.permissionsService.findOne(
      params.id,
      extractHemiaIdAuth(request),
    );
  }
}
