import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateMembershipDto } from './dtos/create-membership.dto';
import { ListMembershipsQueryDto } from './dtos/list-memberships-query.dto';
import { MembershipParamDto } from './dtos/membership-param.dto';
import { UpdateMembershipStatusDto } from './dtos/update-membership-status.dto';
import { MembershipsService } from './memberships.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get()
  findAll(
    @Query() query: ListMembershipsQueryDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.membershipsService.findAll(query, extractHemiaIdAuth(request));
  }

  @Post()
  create(
    @Body() dto: CreateMembershipDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.membershipsService.create(dto, extractHemiaIdAuth(request));
  }

  @Patch(':id/status')
  updateStatus(
    @Param() params: MembershipParamDto,
    @Body() dto: UpdateMembershipStatusDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.membershipsService.updateStatus(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: MembershipParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.membershipsService.remove(
      params.id,
      extractHemiaIdAuth(request),
    );
  }
}
