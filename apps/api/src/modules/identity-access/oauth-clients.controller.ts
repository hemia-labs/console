import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreateOAuthClientDto } from './dtos/create-oauth-client.dto';
import { OAuthClientParamDto } from './dtos/oauth-client-param.dto';
import { UpdateOAuthClientDto } from './dtos/update-oauth-client.dto';
import { OAuthClientsService } from './oauth-clients.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/oauth-clients')
export class OAuthClientsController {
  constructor(private readonly oauthClientsService: OAuthClientsService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.oauthClientsService.findAll(extractHemiaIdAuth(request));
  }

  @Post()
  create(
    @Body() dto: CreateOAuthClientDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.oauthClientsService.create(dto, extractHemiaIdAuth(request));
  }

  @Post(':id/rotate-secret')
  rotateSecret(
    @Param() params: OAuthClientParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.oauthClientsService.rotateSecret(
      params.id,
      extractHemiaIdAuth(request),
    );
  }

  @Get(':id')
  findOne(
    @Param() params: OAuthClientParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.oauthClientsService.findOne(
      params.id,
      extractHemiaIdAuth(request),
    );
  }

  @Patch(':id')
  update(
    @Param() params: OAuthClientParamDto,
    @Body() dto: UpdateOAuthClientDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.oauthClientsService.update(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: OAuthClientParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.oauthClientsService.remove(
      params.id,
      extractHemiaIdAuth(request),
    );
  }
}
