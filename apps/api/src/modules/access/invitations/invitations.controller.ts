import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../../identity-access/sso-current-user-auth.guard';
import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from '../../auth/authorization/console-authorization.service';
import { CreateInvitationDto } from '../dtos/access.dto';
import { InvitationsService } from './invitations.service';

@Controller('access')
@UseGuards(SsoCurrentUserAuthGuard)
export class InvitationsController {
  constructor(
    private readonly invitations: InvitationsService,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}

  @Post('organizations/:organizationId/invitations')
  async create(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.create(
      organizationId,
      dto,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get('organizations/:organizationId/invitations')
  async findAll(
    @Req() request: ConsoleRequest,
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ) {
    return this.invitations.findAll(
      organizationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Get('invitations/:invitationId')
  async findOne(
    @Req() request: ConsoleRequest,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.invitations.findOne(
      invitationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('invitations/:invitationId/revoke')
  async revoke(
    @Req() request: ConsoleRequest,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.invitations.revoke(
      invitationId,
      await this.authorization.accessTokenFor(request),
    );
  }

  @Post('invitations/:invitationId/resend')
  async resend(
    @Req() request: ConsoleRequest,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.invitations.resend(
      invitationId,
      await this.authorization.accessTokenFor(request),
    );
  }
}
