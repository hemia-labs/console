import { SsoAuthGuard } from '@hemia/auth/nestjs';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SsoCurrentUserAuthGuard } from '../../identity-access/sso-current-user-auth.guard';
import {
  ConsoleAuthorizationService,
  type ConsoleRequest,
} from '../../auth/authorization/console-authorization.service';
import {
  CreateInvitationDto,
  ListInvitationsQueryDto,
} from '../dtos/access.dto';
import { InvitationsService } from './invitations.service';

@Controller('access')
@UseGuards(SsoAuthGuard)
export class InvitationsController {
  constructor(
    private readonly invitations: InvitationsService,
    private readonly authorization: ConsoleAuthorizationService,
  ) {}

  @Post('organizations/:organizationId/invitations')
  @UseGuards(SsoCurrentUserAuthGuard)
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

  @Get('invitations')
  async listAll(
    @Req() request: ConsoleRequest,
    @Query() query: ListInvitationsQueryDto,
  ) {
    return this.invitations.listAll(
      query,
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
  @UseGuards(SsoCurrentUserAuthGuard)
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
  @UseGuards(SsoCurrentUserAuthGuard)
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
