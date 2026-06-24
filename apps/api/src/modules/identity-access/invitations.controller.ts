import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import { CreateInvitationDto } from './dtos/create-invitation.dto';
import { InvitationParamDto } from './dtos/invitation-param.dto';
import { InvitationsService } from './invitations.service';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  async create(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.invitationsService.create(dto, currentUser);
  }

  @Post(':id/resend')
  async resend(
    @Param() params: InvitationParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.invitationsService.resend(params.id, currentUser);
  }

  @Post(':id/cancel')
  async cancel(
    @Param() params: InvitationParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.invitationsService.cancel(params.id, currentUser);
  }
}
