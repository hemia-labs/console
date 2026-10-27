import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from '../../auth/authorization/console-authorization.service';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../../identity-access/sso-current-user-auth.guard';
import { CreateMembershipDto, UpdateMembershipDto } from '../dtos/access.dto';
import { MembershipsService } from './memberships.service';

@Controller('access/organizations/:organizationId/memberships')
@UseGuards(SsoCurrentUserAuthGuard)
export class MembershipsController {
  constructor(
    private readonly memberships: MembershipsService,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}

  @Get()
  async findAll(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.memberships.findAll(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post()
  async create(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateMembershipDto,
  ) {
    return this.memberships.create(
      organizationId,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get(':membershipId')
  async findOne(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.findOne(
      organizationId,
      membershipId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Patch(':membershipId')
  async update(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.memberships.update(
      organizationId,
      membershipId,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post(':membershipId/suspend')
  async suspend(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.suspend(
      organizationId,
      membershipId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post(':membershipId/activate')
  async activate(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.activate(
      organizationId,
      membershipId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post(':membershipId/revoke')
  async revoke(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.revoke(
      organizationId,
      membershipId,
      await this.authorization.accessTokenFor(request),
    );
  }
}
