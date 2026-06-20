import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateInvitationDto } from './dtos/create-invitation.dto';
import { ExternalUserEmailQueryDto } from './dtos/external-user-email-query.dto';
import { ExternalUserSubParamDto } from './dtos/external-user-sub-param.dto';
import { InvitationParamDto } from './dtos/invitation-param.dto';
import { ExternalIdentityAccessService } from './external-identity-access.service';
import { ensureExternalApiAccess } from './utils/ensure-external-api-access.util';

@Controller('identity-access/external')
export class ExternalIdentityAccessController {
  constructor(
    private readonly externalIdentityAccessService: ExternalIdentityAccessService,
  ) {}

  @Get('users/by-email')
  findUserByEmail(
    @Query() query: ExternalUserEmailQueryDto,
    @Req() request: Request,
  ): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.findUserByEmail(query.email);
  }

  @Get('users/by-sub/:sub')
  findUserBySub(
    @Param() params: ExternalUserSubParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.findUserBySub(params.sub);
  }

  @Get('users/:sub/memberships')
  findMembershipsBySub(
    @Param() params: ExternalUserSubParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.findMembershipsBySub(params.sub);
  }

  @Get('teams')
  findTeams(@Req() request: Request): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.findTeams();
  }

  @Post('invitations')
  createInvitation(
    @Body() dto: CreateInvitationDto,
    @Req() request: Request,
  ): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.createInvitation(dto);
  }

  @Post('invitations/:id/resend')
  resendInvitation(
    @Param() params: InvitationParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.resendInvitation(params.id);
  }

  @Post('invitations/:id/cancel')
  cancelInvitation(
    @Param() params: InvitationParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.cancelInvitation(params.id);
  }

  @Get('events')
  findEvents(@Req() request: Request): Promise<unknown> {
    ensureExternalApiAccess(request);
    return this.externalIdentityAccessService.findEvents();
  }
}
