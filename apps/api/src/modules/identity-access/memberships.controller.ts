import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '@hemia/auth/nestjs';

import { SsoCurrentUserAuthGuard } from './sso-current-user-auth.guard';
import { CreateMembershipDto } from './dtos/create-membership.dto';
import { ListMembershipsQueryDto } from './dtos/list-memberships-query.dto';
import { MembershipParamDto } from './dtos/membership-param.dto';
import { UpdateMembershipStatusDto } from './dtos/update-membership-status.dto';
import { MembershipsService } from './memberships.service';

@UseGuards(SsoCurrentUserAuthGuard)
@Controller('identity-access/memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  async findAll(
    @Query() query: ListMembershipsQueryDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.membershipsService.findAll(query, currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateMembershipDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.membershipsService.create(dto, currentUser);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param() params: MembershipParamDto,
    @Body() dto: UpdateMembershipStatusDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.membershipsService.updateStatus(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: MembershipParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.membershipsService.remove(params.id, currentUser);
  }
}
