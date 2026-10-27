import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from '../../auth/authorization/console-authorization.service';
import { SsoAuthGuard } from '@hemia/auth/nestjs';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../../identity-access/sso-current-user-auth.guard';
import {
  CreateOrganizationDto,
  ListOrganizationsQueryDto,
  UpdateOrganizationDto,
} from '../dtos/access.dto';
import { OrganizationsService } from './organizations.service';

@Controller('access/organizations')
@UseGuards(SsoAuthGuard)
export class OrganizationsController {
  constructor(
    private readonly organizations: OrganizationsService,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}

  @Get()
  async findAll(
    @Req() request: ConsoleRequest,
    @Query() query: ListOrganizationsQueryDto,
  ) {
    return this.organizations.findAll(
      query,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get(':organizationId')
  async findOne(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.findOne(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post()
  @UseGuards(SsoCurrentUserAuthGuard)
  async create(
    @Req() request: ConsoleRequest,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizations.create(
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Patch(':organizationId')
  @UseGuards(SsoCurrentUserAuthGuard)
  async update(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizations.update(
      organizationId,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post(':organizationId/suspend')
  @UseGuards(SsoCurrentUserAuthGuard)
  async suspend(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.suspend(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post(':organizationId/activate')
  @UseGuards(SsoCurrentUserAuthGuard)
  async activate(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.activate(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post(':organizationId/archive')
  @UseGuards(SsoCurrentUserAuthGuard)
  async archive(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.organizations.archive(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }
}
