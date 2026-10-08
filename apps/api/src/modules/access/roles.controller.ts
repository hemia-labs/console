import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../identity-access/sso-current-user-auth.guard';
import { AssignRoleDto, CreateRoleDto, UpdateRoleDto } from './dtos/access.dto';
import { RolesService } from './roles.service';

@Controller('access')
@UseGuards(SsoCurrentUserAuthGuard)
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get('roles')
  findRoles() {
    return this.roles.findRoles();
  }

  @Get('permissions')
  findPermissions() {
    return this.roles.findPermissions();
  }

  @Get('organizations/:organizationId/roles')
  findOrganizationRoles(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.roles.findOrganizationRoles(organizationId);
  }

  @Post('organizations/:organizationId/roles')
  createOrganizationRole(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateRoleDto,
  ) {
    return this.roles.createOrganizationRole(organizationId, dto);
  }

  @Patch('organizations/:organizationId/roles/:roleId')
  updateOrganizationRole(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roles.updateOrganizationRole(organizationId, roleId, dto);
  }

  @Delete('organizations/:organizationId/roles/:roleId')
  removeOrganizationRole(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.roles.removeOrganizationRole(organizationId, roleId);
  }

  @Post('organizations/:organizationId/memberships/:membershipId/roles')
  assignMembershipRole(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.roles.assignMembershipRole(organizationId, membershipId, dto);
  }

  @Delete(
    'organizations/:organizationId/memberships/:membershipId/roles/:roleId',
  )
  revokeMembershipRole(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.roles.revokeMembershipRole(
      organizationId,
      membershipId,
      roleId,
    );
  }
}
