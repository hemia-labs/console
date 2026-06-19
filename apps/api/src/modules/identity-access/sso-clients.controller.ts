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
import { CreateSsoClientDto } from './dtos/create-sso-client.dto';
import { SsoClientParamDto } from './dtos/sso-client-param.dto';
import { UpdateSsoClientDto } from './dtos/update-sso-client.dto';
import { SsoClientsService } from './sso-clients.service';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/sso-clients')
export class SsoClientsController {
  constructor(private readonly ssoClientsService: SsoClientsService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.ssoClientsService.findAll(extractHemiaIdAuth(request));
  }

  @Post()
  create(
    @Body() dto: CreateSsoClientDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.ssoClientsService.create(dto, extractHemiaIdAuth(request));
  }

  @Get(':id')
  findOne(
    @Param() params: SsoClientParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.ssoClientsService.findOne(
      params.id,
      extractHemiaIdAuth(request),
    );
  }

  @Patch(':id')
  update(
    @Param() params: SsoClientParamDto,
    @Body() dto: UpdateSsoClientDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.ssoClientsService.update(
      params.id,
      dto,
      extractHemiaIdAuth(request),
    );
  }

  @Delete(':id')
  remove(
    @Param() params: SsoClientParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.ssoClientsService.remove(
      params.id,
      extractHemiaIdAuth(request),
    );
  }
}
