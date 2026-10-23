import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, type CurrentUserPayload } from '@hemia/auth/nestjs';

import { SsoCurrentUserAuthGuard } from '../sso-current-user-auth.guard';
import { AccountsService } from './accounts.service';

@UseGuards(SsoCurrentUserAuthGuard)
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
}
