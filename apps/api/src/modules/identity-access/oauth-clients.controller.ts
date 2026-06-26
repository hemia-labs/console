import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '@hemia/auth/nestjs';

import { SsoCurrentUserAuthGuard } from './sso-current-user-auth.guard';
import { CreateOAuthClientDto } from './dtos/create-oauth-client.dto';
import {
  OAuthClientListValueDto,
  OAuthClientRedirectUriValueDto,
} from './dtos/oauth-client-list-value.dto';
import { OAuthClientParamDto } from './dtos/oauth-client-param.dto';
import { UpdateOAuthClientDto } from './dtos/update-oauth-client.dto';
import { OAuthClientsService } from './oauth-clients.service';

@UseGuards(SsoCurrentUserAuthGuard)
@Controller('identity-access/oauth-clients')
export class OAuthClientsController {
  constructor(private readonly oauthClientsService: OAuthClientsService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.findAll(currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateOAuthClientDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.create(dto, currentUser);
  }

  @Post(':id/rotate-secret')
  async rotateSecret(
    @Param() params: OAuthClientParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.rotateSecret(params.id, currentUser);
  }

  @Post(':id/redirect-uris')
  async addRedirectUri(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientRedirectUriValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.addListValue(
      params.id,
      'redirect-uris',
      dto,
      currentUser,
    );
  }

  @Delete(':id/redirect-uris')
  async removeRedirectUri(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientRedirectUriValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.removeListValue(
      params.id,
      'redirect-uris',
      dto,
      currentUser,
    );
  }

  @Post(':id/scopes')
  async addScope(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientListValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.addListValue(
      params.id,
      'scopes',
      dto,
      currentUser,
    );
  }

  @Delete(':id/scopes')
  async removeScope(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientListValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.removeListValue(
      params.id,
      'scopes',
      dto,
      currentUser,
    );
  }

  @Post(':id/grant-types')
  async addGrantType(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientListValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.addListValue(
      params.id,
      'grant-types',
      dto,
      currentUser,
    );
  }

  @Delete(':id/grant-types')
  async removeGrantType(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientListValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.removeListValue(
      params.id,
      'grant-types',
      dto,
      currentUser,
    );
  }

  @Post(':id/response-types')
  async addResponseType(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientListValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.addListValue(
      params.id,
      'response-types',
      dto,
      currentUser,
    );
  }

  @Delete(':id/response-types')
  async removeResponseType(
    @Param() params: OAuthClientParamDto,
    @Body() dto: OAuthClientListValueDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.removeListValue(
      params.id,
      'response-types',
      dto,
      currentUser,
    );
  }

  @Get(':id')
  async findOne(
    @Param() params: OAuthClientParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.findOne(params.id, currentUser);
  }

  @Patch(':id')
  async update(
    @Param() params: OAuthClientParamDto,
    @Body() dto: UpdateOAuthClientDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.update(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: OAuthClientParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.oauthClientsService.remove(params.id, currentUser);
  }
}
