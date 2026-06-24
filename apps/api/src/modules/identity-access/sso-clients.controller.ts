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
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import { CreateSsoClientDto } from './dtos/create-sso-client.dto';
import { SsoClientParamDto } from './dtos/sso-client-param.dto';
import { UpdateSsoClientDto } from './dtos/update-sso-client.dto';
import { SsoClientsService } from './sso-clients.service';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/sso-clients')
export class SsoClientsController {
  constructor(private readonly ssoClientsService: SsoClientsService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.ssoClientsService.findAll(currentUser);
  }

  @Post()
  async create(
    @Body() dto: CreateSsoClientDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.ssoClientsService.create(dto, currentUser);
  }

  @Get(':id')
  async findOne(
    @Param() params: SsoClientParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.ssoClientsService.findOne(params.id, currentUser);
  }

  @Patch(':id')
  async update(
    @Param() params: SsoClientParamDto,
    @Body() dto: UpdateSsoClientDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.ssoClientsService.update(params.id, dto, currentUser);
  }

  @Delete(':id')
  async remove(
    @Param() params: SsoClientParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.ssoClientsService.remove(params.id, currentUser);
  }
}
