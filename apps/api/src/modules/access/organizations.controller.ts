import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../identity-access/sso-current-user-auth.guard';
import {
  CreateOrganizationDto,
  ListOrganizationsQueryDto,
  UpdateOrganizationDto,
} from './dtos/access.dto';
import { OrganizationsService } from './organizations.service';

@Controller('access/organizations')
@UseGuards(SsoCurrentUserAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  findAll(@Query() query: ListOrganizationsQueryDto) {
    return this.organizations.findAll(query);
  }

  @Get(':organizationId')
  findOne(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.organizations.findOne(organizationId);
  }

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizations.create(dto);
  }

  @Patch(':organizationId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizations.update(organizationId, dto);
  }

  @Post(':organizationId/suspend')
  suspend(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.organizations.suspend(organizationId);
  }

  @Post(':organizationId/activate')
  activate(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.organizations.activate(organizationId);
  }

  @Post(':organizationId/archive')
  archive(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.organizations.archive(organizationId);
  }
}
