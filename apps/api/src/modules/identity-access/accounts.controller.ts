import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AccountsService } from './accounts.service';
import { AccountIndexParamDto } from './dtos/account-index-param.dto';
import { SwitchAccountDto } from './dtos/switch-account.dto';
import { extractHemiaIdAuth } from './utils/extract-hemia-id-auth.util';

@Controller('identity-access/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll(@Req() request: Request): Promise<unknown> {
    return this.accountsService.findAll(extractHemiaIdAuth(request));
  }

  @Get('active')
  findActive(@Req() request: Request): Promise<unknown> {
    return this.accountsService.findActive(extractHemiaIdAuth(request));
  }

  @Post('switch')
  async switch(
    @Body() dto: SwitchAccountDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const result = await this.accountsService.switch(
      dto,
      extractHemiaIdAuth(request),
    );

    for (const cookie of result.setCookie) {
      response.append('Set-Cookie', cookie);
    }

    return result.body;
  }

  @Delete(':accountIndex')
  remove(
    @Param() params: AccountIndexParamDto,
    @Req() request: Request,
  ): Promise<unknown> {
    return this.accountsService.remove(
      params.accountIndex,
      extractHemiaIdAuth(request),
    );
  }
}
