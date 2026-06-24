import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  SsoAuthGuard,
  type CurrentUserPayload,
} from '@hemia/auth/nestjs';
import type { Response } from 'express';
import { AccountsService } from './accounts.service';
import { AccountIndexParamDto } from './dtos/account-index-param.dto';
import { SwitchAccountDto } from './dtos/switch-account.dto';

@UseGuards(SsoAuthGuard)
@Controller('identity-access/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.accountsService.findAll(currentUser);
  }

  @Get('active')
  async findActive(
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.accountsService.findActive(currentUser);
  }

  @Post('switch')
  async switch(
    @Body() dto: SwitchAccountDto,
    @CurrentUser() currentUser: CurrentUserPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const result = await this.accountsService.switch(dto, currentUser);

    for (const cookie of result.setCookie) {
      response.append('Set-Cookie', cookie);
    }

    return result.body;
  }

  @Delete(':accountIndex')
  async remove(
    @Param() params: AccountIndexParamDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ): Promise<unknown> {
    return this.accountsService.remove(params.accountIndex, currentUser);
  }
}
