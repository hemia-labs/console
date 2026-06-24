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
import { CreateOrganizationDto } from './dtos/create-organization.dto';
import { OrganizationParamDto } from './dtos/organization-param.dto';
import { UpdateOrganizationDto } from './dtos/update-organization.dto';
import { OrganizationsService } from './organizations.service';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.organizationsService.findAll(currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.organizationsService.create(dto, currentUser);
  }

  @Get(':id')
  async findOne(
    @Param() params: OrganizationParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.organizationsService.findOne(params.id, currentUser);
  }

  @Patch(':id')
  async update(
    @Param() params: OrganizationParamDto,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.organizationsService.update(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: OrganizationParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.organizationsService.remove(params.id, currentUser);
  }
}
