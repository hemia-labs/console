import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { CreateInvitationDto } from './dtos/create-invitation.dto';
import { InvitationParamDto } from './dtos/invitation-param.dto';
import { InvitationsService } from './invitations.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  create(
    @Body() dto: CreateInvitationDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.invitationsService.create(dto, extractHemiaIdAuth(request));
  }

  @Post(':id/resend')
  resend(
    @Param() params: InvitationParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.invitationsService.resend(
      params.id,
      extractHemiaIdAuth(request),
    );
  }

  @Post(':id/cancel')
  cancel(
    @Param() params: InvitationParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.invitationsService.cancel(
      params.id,
      extractHemiaIdAuth(request),
    );
  }
}
