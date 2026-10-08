import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../identity-access/sso-current-user-auth.guard';
import { CreateMembershipDto, UpdateMembershipDto } from './dtos/access.dto';
import { MembershipsService } from './memberships.service';

@Controller('access/organizations/:organizationId/memberships')
@UseGuards(SsoCurrentUserAuthGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get()
  findAll(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.memberships.findAll(organizationId);
  }

  @Post()
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateMembershipDto,
  ) {
    return this.memberships.create(organizationId, dto);
  }

  @Get(':membershipId')
  findOne(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.findOne(organizationId, membershipId);
  }

  @Patch(':membershipId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.memberships.update(organizationId, membershipId, dto);
  }

  @Post(':membershipId/suspend')
  suspend(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.suspend(organizationId, membershipId);
  }

  @Post(':membershipId/activate')
  activate(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.activate(organizationId, membershipId);
  }

  @Post(':membershipId/revoke')
  revoke(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ) {
    return this.memberships.revoke(organizationId, membershipId);
  }
}
