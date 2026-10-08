import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../identity-access/sso-current-user-auth.guard';
import { CreateInvitationDto } from './dtos/access.dto';
import { InvitationsService } from './invitations.service';

@Controller('access')
@UseGuards(SsoCurrentUserAuthGuard)
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}

  @Post('organizations/:organizationId/invitations')
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.create(organizationId, dto);
  }

  @Get('organizations/:organizationId/invitations')
  findAll(@Param('organizationId', ParseUUIDPipe) organizationId: string) {
    return this.invitations.findAll(organizationId);
  }

  @Get('invitations/:invitationId')
  findOne(@Param('invitationId', ParseUUIDPipe) invitationId: string) {
    return this.invitations.findOne(invitationId);
  }

  @Post('invitations/:invitationId/revoke')
  revoke(@Param('invitationId', ParseUUIDPipe) invitationId: string) {
    return this.invitations.revoke(invitationId);
  }

  @Post('invitations/:invitationId/resend')
  resend(@Param('invitationId', ParseUUIDPipe) invitationId: string) {
    return this.invitations.resend(invitationId);
  }
}
