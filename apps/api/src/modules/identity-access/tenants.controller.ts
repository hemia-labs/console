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
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { TenantParamDto } from './dtos/tenant-param.dto';
import { UpdateTenantStatusDto } from './dtos/update-tenant-status.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantsService } from './tenants.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.tenantsService.findAll(extractHemiaIdAuth(request));
  }

  @Post()
  create(
    @Body() dto: CreateTenantDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.tenantsService.create(dto, extractHemiaIdAuth(request));
  }

  @Get(':id')
  findOne(
    @Param() params: TenantParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.tenantsService.findOne(params.id, extractHemiaIdAuth(request));
  }

  @Patch(':id/status')
  updateStatus(
    @Param() params: TenantParamDto,
    @Body() dto: UpdateTenantStatusDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.tenantsService.updateStatus(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Patch(':id')
  update(
    @Param() params: TenantParamDto,
    @Body() dto: UpdateTenantDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.tenantsService.update(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: TenantParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.tenantsService.remove(params.id, extractHemiaIdAuth(request));
  }
}
