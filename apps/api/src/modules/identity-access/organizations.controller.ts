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
import { CreateOrganizationDto } from './dtos/create-organization.dto';
import { OrganizationParamDto } from './dtos/organization-param.dto';
import { UpdateOrganizationDto } from './dtos/update-organization.dto';
import { OrganizationsService } from './organizations.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.organizationsService.findAll(extractHemiaIdAuth(request));
  }

  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.organizationsService.create(dto, extractHemiaIdAuth(request));
  }

  @Get(':id')
  findOne(
    @Param() params: OrganizationParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.organizationsService.findOne(
      params.id,
      extractHemiaIdAuth(request),
    );
  }

  @Patch(':id')
  update(
    @Param() params: OrganizationParamDto,
    @Body() dto: UpdateOrganizationDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.organizationsService.update(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: OrganizationParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.organizationsService.remove(
      params.id,
      extractHemiaIdAuth(request),
    );
  }
}
