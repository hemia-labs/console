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
import { CreateTenantDto } from './dtos/create-tenant.dto';
import { TenantParamDto } from './dtos/tenant-param.dto';
import { UpdateTenantStatusDto } from './dtos/update-tenant-status.dto';
import { UpdateTenantDto } from './dtos/update-tenant.dto';
import { TenantsService } from './tenants.service';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.tenantsService.findAll(currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateTenantDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.tenantsService.create(dto, currentUser);
  }

  @Get(':id')
  async findOne(
    @Param() params: TenantParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.tenantsService.findOne(params.id, currentUser);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param() params: TenantParamDto,
    @Body() dto: UpdateTenantStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.tenantsService.updateStatus(params.id, dto, currentUser);
  }

  @Patch(':id')
  async update(
    @Param() params: TenantParamDto,
    @Body() dto: UpdateTenantDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.tenantsService.update(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: TenantParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.tenantsService.remove(params.id, currentUser);
  }
}
