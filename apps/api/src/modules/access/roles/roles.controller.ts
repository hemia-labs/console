import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from '../../auth/authorization/console-authorization.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../../identity-access/sso-current-user-auth.guard';
import {
  AssignRoleDto,
  CreateRoleDto,
  UpdateRoleDto,
} from '../dtos/access.dto';
import { RolesService } from './roles.service';

@Controller('access')
@UseGuards(SsoCurrentUserAuthGuard)
export class RolesController {
  constructor(
    private readonly roles: RolesService,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}

  @Get('roles')
  async findRoles(@Req() request: ConsoleRequest) {
    return this.roles.findRoles(
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get('permissions')
  async findPermissions(@Req() request: ConsoleRequest) {
    return this.roles.findPermissions(
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get('organizations/:organizationId/roles')
  async findOrganizationRoles(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.roles.findOrganizationRoles(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('organizations/:organizationId/roles')
  async createOrganizationRole(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.roles.createOrganizationRole(
      organizationId,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Patch('organizations/:organizationId/roles/:roleId')
  async updateOrganizationRole(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roles.updateOrganizationRole(
      organizationId,
      roleId,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Delete('organizations/:organizationId/roles/:roleId')
  async removeOrganizationRole(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.roles.removeOrganizationRole(
      organizationId,
      roleId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('organizations/:organizationId/memberships/:membershipId/roles')
  async assignMembershipRole(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.roles.assignMembershipRole(
      organizationId,
      membershipId,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Delete(
    'organizations/:organizationId/memberships/:membershipId/roles/:roleId',
  )
  async revokeMembershipRole(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.roles.revokeMembershipRole(
      organizationId,
      membershipId,
      roleId,
      await this.authorization.accessTokenFor(request),
    );
  }
}
